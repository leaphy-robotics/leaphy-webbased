import { Requests, Responses, Signature } from './stk500'
import { convertArrayToHex, delay, includesAll } from './utils'
import { parse } from 'intel-hex'
import {Buffer} from "buffer";

class Arduino {
  port = null
  isUploading = false
  serialOptions = null
  readStream = null
  writeStream = null

  /**
   * Create a new Arduino instance.
   * @param serialOptions The options to use when opening the serial port.
   */
  constructor(serialOptions = { baudRate: 115200 }) {
    this.serialOptions = serialOptions
  }

  /**
   * Open a connection to a user-selected Arduino.
   */
  async connect() {
    var port;
    try {
      // @ts-ignore
      port = await navigator.serial.requestPort({filters: [{usbVendorId: 0x1a86}, {usbVendorId: 9025}]});
    } catch (error) {
      console.error(error)
      throw new Error('No device selected')
    }
    if (port === this.port)
      return
    try {
      await port.open(this.serialOptions)
    } catch (error) {
      console.error(error)
      throw new Error('Connecting to device')
    }
    this.port = port
  }

  /**
   * Upload a program to the Arduino.
   * @param {string} program The program to upload.
   * @param callback A callback function to call when the upload status changes.
   */
  async upload(program: string, callback = (message: string) => {}) {
    if (this.isUploading)
      throw new Error('Arduino is already uploading')
    this.isUploading = true

    this.readStream = this.port.readable.getReader();
    this.writeStream = this.port.writable.getWriter();

    let response = null
    // start timer
    response = await this.attemptNewBootloader(callback)
    if (response === null) {
      response = await this.attemptOldBootloader();
      if (response !== null) {
        console.log("Using old bootloader")
      }
    }
    else {
      console.log("Using new bootloader")
    }

    if (response === null) {
      await this.close()
      callback("COULD_NOT_CONNECT")
      throw new Error('Could not connect to Arduino')
    }

    if (!includesAll([Responses.IN_SYNC, Responses.OK], response)) {
      await this.close()
      callback("NOT_IN_SYNC")
      throw new Error('Arduino is not in sync')
    }

    // Try to match signature
    const signature = await this.send([0x75]);
    if (!includesAll(Signature, signature)) {
      await this.close()
      callback("SIGNATURE_MISMATCH")
      throw new Error('Arduino does not match signature')
    }


    const optionsResponse = await this.writeOptions({ pagesizehigh: 0, pagesizelow: 128 });
    if (!includesAll([Responses.OK], optionsResponse)) {
      await this.close()
      callback("OPTIONS_NOT_ACCEPTED")
      throw new Error('Arduino did not accept options')
    }

    // Start programming
    await this.send([Requests.ENTER_PROG_MODE]);

    await this.writeProgram(program, callback);

    await this.send([Requests.LEAVE_PROG_MODE]);

    // Reset the Arduino
    await this.reset(115200);

    // Complete the upload
    callback("UPDATE_COMPLETE")
    await this.close();
  }

  /**
   * Try to the sync with the Arduino using the old bootloader.
   * @returns {Promise<string>} The response of the Device
   * @param callback The callback to call when a update is available
   */
  async attemptOldBootloader(callback = (message: string) => {}) : Promise<string> {
    let response = null
    await this.reset(57600);
    for (let i = 0; i < 10; i++) {
      try {
        response = await this.send([Requests.GET_SYNC], 500)
        break
      } catch (error) {
        console.log(error)
      }
    }
    if (response === null) {
      this.readStream.releaseLock();
      this.writeStream.releaseLock();
      this.readStream = null;
      this.writeStream = null;
      callback("COULD_NOT_CONNECT")
      throw new Error('Could not connect to Arduino')
    }
    return response
  }


  /**
   * Try to the sync with the Arduino using the new bootloader.
   * @returns {Promise<string>} The response of the Device
   * @param callback The callback to call when a update is available
   */
  async attemptNewBootloader(callback = (message: string) => {}) : Promise<string> {
    let response = null
    await this.reset(this.serialOptions.baudRate);
    for (let i = 0; i < 10; i++) {
      try {
        response = await this.send([Requests.GET_SYNC], 500)
        break;
      } catch (error) {
        console.log(error)
      }
    }
    if (response === null) {
      this.readStream.releaseLock();
      this.writeStream.releaseLock();
      this.readStream = null;
      this.writeStream = null;
      callback("COULD_NOT_CONNECT")
      throw new Error('Could not connect to Arduino')
    }
    return response
  }


  /**
   * Send commands to the Arduino.
   * @returns The response of the Device
   * @param command
   * @param timeoutMs
   */
  async send(command, timeoutMs = 1000) {
    const buffer = new Uint8Array([...command, Requests.CRC_EOP]);
    console.log("Sending: " + convertArrayToHex(buffer).join(' '));
    await this.writeBuffer(buffer);

    const timeoutPromise = new Promise((resolve, _) => {
      setTimeout(() => {
        resolve("Timeout");
      }, timeoutMs);
    });

    var IN_SYNC = false;
    var OK = false;
    var returnBuffer = new Uint8Array(0);
    while (true) {
      const promise = this.receive();
      const result = await Promise.race([promise, timeoutPromise]);

      if (result instanceof Uint8Array) {
        const answer = Array.from(result);
        if (answer.includes(Responses.NOT_IN_SYNC))
          throw new Error('Arduino is not in sync');
        else
          returnBuffer = new Uint8Array([...returnBuffer, ...answer]);
        if (answer.includes(Responses.IN_SYNC))
          IN_SYNC = true;
        if (answer.includes(Responses.OK))
          OK = true;
        if (OK && IN_SYNC)
          return returnBuffer;
      } else if (result === "Timeout") {
        await this.readStream.cancel();
        await this.readStream.releaseLock();
        this.readStream = this.port.readable.getReader();
        throw new Error('Timeout');
      }
    }
  }


  /**
   * Send raw bytes to the Arduino.
   * @param {Uint8Array} data The bytes to send.
   */
  async writeBuffer(data) {
    await this.writeStream.write(data)
  }


  /**
   * Read raw bytes from the Arduino.
   * @returns {Promise<Uint8Array>} The bytes received.
   */
  async receive() {
    const { value } = await this.readStream.read()
    console.log("Received: " + convertArrayToHex(value).join(' '))
    return value
  }


  /**
   * Write a program to the Arduino.
   * @param program
   * @param onProgress
   */
  async writeProgram(program: string, onProgress = (progress: string) => {}) {
    const hex = parse(program);

    let data: Buffer = hex.data;
    let i = 0;
    do {
      // calculate progress
      const progress = Math.round((i / hex.data.length) * 100);
      onProgress(progress.toString() + "%");
      const offset = Math.min(data.length, 128);
      const page = data.subarray(0, offset);
      data = data.subarray(offset);
      const length = page.length;
      const lengthHigh = length >> 8;
      const lengthLow = length & 0xff;
      const startAddress = (hex.startSegmentAddress + i) >> 1;

      await this.send([Requests.SET_ADDRESS, startAddress & 0xff, (startAddress >> 8) & 0xff]);
      const buffer = new Uint8Array([Requests.SET_PAGE, lengthHigh, lengthLow, 0x46, ...page]);
      await this.send(buffer);
      i += page.length;
    } while (data.length > 0);
    onProgress("100%")
  }

  /**
   * Write the options to the Arduino.
   * @returns {Promise<number[]>} The response of the Device
   * @param options The options to write
   */
  async writeOptions(options) {
    const buffer = new Uint8Array([
      0x42,
      options.devicecode || 0,
      options.revision || 0,
      options.progtype || 0,
      options.parmode || 0,
      options.polling || 0,
      options.selftimed || 0,
      options.lockbytes || 0,
      options.fusebytes || 0,
      options.flashpollval1 || 0,
      options.flashpollval2 || 0,
      options.eeprompollval1 || 0,
      options.eeprompollval2 || 0,
      options.pagesizehigh || 0,
      options.pagesizelow || 0,
      options.eepromsizehigh || 0,
      options.eepromsizelow || 0,
      options.flashsize4 || 0,
      options.flashsize3 || 0,
      options.flashsize2 || 0,
      options.flashsize1 || 0
    ]);

    return await this.send(buffer);

  }

  /**
   * Clear out the read buffer.
   * @returns {Promise<void>}
   */
  async clearReadBuffer() {
    const timeoutPromise = new Promise((resolve, _) => {
      setTimeout(() => {
        resolve("Timeout");
      }, 100);
    });

    while (true) {
      const result = await Promise.race([this.receive(), timeoutPromise]);
      if (result === "Timeout")
        break;
    }
  }

  /**
   * Reset the Arduino.
   * @returns {Promise<void>}
   */
  async reset(baudrate) {
    await this.writeStream.releaseLock();
    await this.readStream.releaseLock();
    await this.port.close();
    await this.port.open({ baudRate: baudrate })
    this.readStream = this.port.readable.getReader();
    this.writeStream = this.port.writable.getWriter();
    await this.port.setSignals({ dataTerminalReady: false })
    await delay(250);
    await this.port.setSignals({ dataTerminalReady: true })
    await this.clearReadBuffer();
  }

  /**
   * Clean up the connection.
   * @returns {Promise<void>}
   */
  async close() {
    this.readStream.releaseLock();
    this.writeStream.releaseLock();
    this.readStream = null;
    this.writeStream = null;
    this.isUploading = false
    this.port.close();
  }

  /**
   * Check if webserial is available.
   * @returns {boolean} True if webserial is available.
   */
  static isAvailable() {
    return 'serial' in navigator
  }
}

export default Arduino
