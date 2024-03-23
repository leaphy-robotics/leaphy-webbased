import {clearReadBuffer} from './utils'
import {RobotWiredState} from "../../state/robot.wired.state";
import {AppState} from "../../state/app.state";

class Arduino {
    port: SerialPort = null
    isUploading = false
    serialOptions = null
    readStream = null
    writeStream: WritableStreamDefaultWriter = null
    robotWiredState: RobotWiredState
    appState: AppState

    /**
     * Create a new Arduino instance.
     * @param serialOptions The options to use when opening the serial port.
     * @param appState The app state to use
     * @param robotWiredState The robot state to use
     */
    constructor(robotWiredState: RobotWiredState, appState: AppState, serialOptions = { baudRate: 115200 }) {
        this.serialOptions = serialOptions
        this.robotWiredState = robotWiredState
        this.appState = appState
    }

    /**
     * Open a connection to a user-selected Arduino.
     */
    async connect() {
        var port;
        try {
            port = await navigator.serial.requestPort({filters: [{usbVendorId: 0x1a86}, {usbVendorId: 9025}, {usbVendorId: 2341}, {usbVendorId: 0x0403}]});
        } catch (error) {
            console.log(error)
            throw new Error('No device selected')
        }
        if (port === this.port)
            return
        try {
            await port.open(this.serialOptions)
        } catch (error) {
            console.log(error)
            throw new Error('Connecting to device')
        }
        this.port = port
    }

    /**
     * Serial monitor system
     * @param outputStream The stream to write to
     */
    async serialMonitor(outputStream: WritableStream) {
        if (this.robotWiredState.getSerialPort() == null) {
            return;
        }
        this.port = this.robotWiredState.getSerialPort();

        try {
            if (this.port.readable.locked) {
                await this.port.readable.cancel();
                this.port.readable.getReader().releaseLock();
            }
            await this.port.close();
            await this.port.open({baudRate: 115200, bufferSize: 1024});
            const abortController = new AbortController();

            const readableStream = this.port.readable;

            this.readStream = this.port.readable.getReader();
            this.writeStream = this.port.writable.getWriter();
            await clearReadBuffer(this.robotWiredState, this.readStream);
            this.readStream.releaseLock();

            this.robotWiredState.setSerialWrite(this.writeStream);
            const pipePromise = readableStream.pipeTo(outputStream, { signal: abortController.signal });

            pipePromise.catch((error) => {
                if (error.toString().includes('Upload started')) {
                    outputStream.abort("Upload started")
                    console.log('Stream aborted');
                } else if (error.toString().includes('The device has been lost.')) {
                    this.robotWiredState.setSerialPort(null);
                    console.log('Device disconnected');
                } else {
                    this.robotWiredState.setSerialPort(null);
                    console.error('Error while piping stream:', error);
                }
            }).then(
                async () => {
                    if (this.port == null) {
                        return;
                    }
                    this.writeStream.releaseLock();

                    await this.port.close();
                    await this.port.open({baudRate: 115200});
                }
            );

            this.robotWiredState.setAbortController(abortController);
        } catch (e) {
            if (this.port == null) {
                return;
            }
            await this.port.close();
            this.port = null;
            this.robotWiredState.setSerialPort(null);
            console.log(e);
        }
    }

    async upload(program: string, callback = (message: string) => {}) {
        let content = '';
        fetch('/avrdude.conf')
            .then(response => response.text())
            .then(data => {
                content = data;
            });

        if (this.isUploading)
            throw new Error('Arduino is already uploading')

        if (this.port == null)
            throw new Error('No device selected')

        // import Module from @leaphy-robotics/avrdude-webassembly/avrdude.js
        const Module = await import('@leaphy-robotics/avrdude-webassembly/avrdude.js')
        const avrdude = await Module.default()
        // get the protocol from the robot type
        const protocol = this.appState.getSelectedRobotType().protocol.name
        // get the part number from the robot type
        const part = this.appState.getSelectedRobotType().micrcontoller

        let args = "";

        window["funcs"] = avrdude;
        window["activePort"] = this.port;
        avrdude.FS.writeFile('/tmp/avrdude.conf', content);
        avrdude.FS.writeFile('/tmp/program.hex', program);

        if (part == "atmega328p") {
            args = "avrdude -P /dev/null -V -v -p atmega328p -c stk500v1 -C /tmp/avrdude.conf -b 115200 -D -U flash:w:/tmp/program.hex:i"
        } else if (part == "atmega4809") {
            args = "avrdude -P /dev/null -V -v -p atmega4809 -c jtag2updi -C /tmp/avrdude.conf -b 115200 -e -D -U flash:w:/tmp/program.hex:i \"-Ufuse2:w:0x01:m\" \"-Ufuse5:w:0xC9:m\" \"-Ufuse8:w:0x00:m\"";
        } else if (part == "atmega2560") {
            args = "avrdude -P /dev/null -V -v -p atmega2560 -c stk500v2 -C /tmp/avrdude.conf -b 115200 -D -U flash:w:/tmp/program.hex:i";
        }

        const avr = avrdude.cwrap("startAvrdude", "number", ["string"])
        await avr(args);

        if (window["writeStream"])
            window["writeStream"].releaseLock();

        const log = window["avrdudeLog"];
        this.robotWiredState.clearUploadLog();
        for (let i = 0; i < log.length; i++) {
            this.robotWiredState.addToUploadLog(log[i]);
        }

        this.isUploading = true

    }

    /**
     * Check if webserial is available.
     * @returns {boolean} True if webserial is available.
     */
    static isAvailable(): boolean {
        return 'serial' in navigator
    }
}

export default Arduino
