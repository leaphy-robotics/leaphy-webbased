import { Requests, Responses, Signature } from './stk500'
import { convertArrayToHex, delay, includesAll } from './utils'
import { parse } from 'intel-hex'
import { SerialPort } from 'serialport'
import {Buffer} from "buffer";

class Arduino {
  /** @type {SerialPort} */
  port = null
  isUploading = false
  serialOptions = null
  readStream = null
  writeStream = null

  /**
   * Create a new Arduino instance.
   * @param {SerialOptions} serialOptions The options to use when opening the serial port.
   */
  constructor(serialOptions = { baudRate: 115200 }) {
    this.serialOptions = serialOptions
  }

  /**
   * Open a connection to a user-selected Arduino.
   */
  async connect() {
    // @ts-ignore
    const port = await navigator.serial.requestPort({filters: [{usbVendorId: 0x1a86}]});
    if (port === this.port)
      return
    await port.open(this.serialOptions)
    this.port = port
  }

  /**
   * Upload a program to the Arduino.
   * @param {string} program The program to upload.
   */
  async upload(program) {
    if (this.isUploading)
      throw new Error('Arduino is already uploading')
    this.isUploading = true

    this.readStream = this.port.readable.getReader();
    this.writeStream = this.port.writable.getWriter();

    let response = null
    await this.port.setSignals({ dataTerminalReady: false })
    await delay(250);
    await this.port.setSignals({ dataTerminalReady: true })
    for (let i = 0; i < 10; i++) {
      try {
        response = await this.send([Requests.GET_SYNC], 500)
        break
      } catch (error) {
        console.log(error)
      }
    }
    if (response === null) {
      throw new Error('Arduino did not respond')
    }
    if (!includesAll([Responses.IN_SYNC, Responses.OK], response)) {
      throw new Error('Arduino is not in sync')
    }

    // Try to match signature

    const signature = await this.send([0x75]);
    if (!includesAll(Signature, signature)) {
      throw new Error('Arduino does not match signature')
    }


    const optionsResponse = await this.writeOptions({ pagesizehigh: 0, pagesizelow: 128 });
    if (!includesAll([Responses.OK], optionsResponse)) {
      throw new Error('Arduino did not accept options')
    }
    await this.send([Requests.ENTER_PROG_MODE]);
    await this.writeProgram(program);
    await this.send([Requests.LEAVE_PROG_MODE]);

    // reset the Arduino
    await this.port.setSignals({ dataTerminalReady: false })
    await delay(250);
    this.port.setSignals({ dataTerminalReady: true })

    this.readStream.releaseLock();
    this.writeStream.releaseLock();
    this.readStream = null;
    this.writeStream = null;
    this.isUploading = false
  }

  /**
   * Send commands to the Arduino.
   * @returns The response of the Device
   * @param command
   * @param timeoutMs
   */
  async send(command, timeoutMs = 1100) {
    const buffer = new Uint8Array([...command, Requests.CRC_EOP]);
    console.log("Sending: " + convertArrayToHex(buffer).join(' '));
    await this.writeBuffer(buffer);

    const timeoutPromise = new Promise((resolve, _) => {
      setTimeout(() => {
        resolve("Timeout");
      }, timeoutMs);
    });

    while (true) {
      const promise = this.receive();
      const result = await Promise.race([promise, timeoutPromise]);

      if (result instanceof Uint8Array) {
        const answer = Array.from(result);
        if (answer.includes(Responses.OK))
          return answer;
        else if (answer.includes(Responses.NOT_IN_SYNC))
          throw new Error('Arduino is not in sync');
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
   */
  async writeProgram(program: string) {
    const hex = parse(program);

    let data: Buffer = hex.data;
    let i = 0;
    do {
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
  }


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

  static isAvailable() {
    return 'serial' in navigator
  }
}

export default Arduino
