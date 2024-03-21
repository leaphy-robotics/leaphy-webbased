import {clearReadBuffer, delay} from './utils'
import {RobotWiredState} from "../../state/robot.wired.state";
import {AppState} from "../../state/app.state";
import BaseProtocol from "./protocols/base";
import {UploadState} from "../../state/upload.state";

class Arduino {
    port: SerialPort = null
    isUploading = false
    serialOptions = null
    readStream = null
    writeStream: WritableStreamDefaultWriter = null
    robotWiredState: RobotWiredState
    uploadState: UploadState
    appState: AppState

    /**
     * Create a new Arduino instance.
     * @param serialOptions The options to use when opening the serial port.
     * @param appState The app state to use
     * @param robotWiredState The robot state to use
     * @param uploadState The upload state to use
     */
    constructor(robotWiredState: RobotWiredState, appState: AppState, uploadState: UploadState, serialOptions = { baudRate: 115200 }) {
        this.serialOptions = serialOptions
        this.robotWiredState = robotWiredState
        this.uploadState = uploadState
        this.appState = appState
    }

    /**
     * Open a connection to a user-selected Arduino.
     */
    async connect() {
        let port: SerialPort;
        try {
            const ports = await navigator.serial.getPorts()

            if (ports[0]) port = ports[0]
            else port = await navigator.serial.requestPort({
                filters: this.robotWiredState.SUPPORTED_VENDORS.map(vendor => ({
                    usbVendorId: vendor
                }))
            })
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

    setPort(port: SerialPort) {
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
                    await this.port.open({baudRate: 115200})
                        .catch(async () => {
                            await delay(4000)

                            const [port] = await navigator.serial.getPorts()
                            this.robotWiredState.setSerialPort(port)
                            this.setPort(port)

                            await this.port.open({baudRate: 115200})
                        })
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

    async upload(program: Record<string, string>) {
        if (this.isUploading)
            throw new Error('Arduino is already uploading')

        const Uploader = this.appState.getSelectedRobotType().protocol
        this.isUploading = true

        const upload = new Uploader(this.port, this.robotWiredState, this.uploadState, this.serialOptions, this)
        await upload.upload(program)
            .catch(async err => {
                await this.close()
                throw err
            })
        await this.close()
    }

    /**
     * Clean up the connection
     * @returns {Promise<void>}
     */
    async close() {
        this.readStream?.releaseLock();
        this.writeStream?.releaseLock();
        this.readStream = null;
        this.writeStream = null;
        this.isUploading = false
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
