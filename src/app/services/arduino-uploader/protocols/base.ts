import {RobotWiredState} from "../../../state/robot.wired.state";
import {clearReadBuffer, delay} from "../utils";
import ArduinoUploader from "../ArduinoUploader";
import {UploadState} from "../../../state/upload.state";

export default class BaseProtocol {
    constructor(
        public port: SerialPort,
        public robotWiredState: RobotWiredState,
        public uploadState: UploadState,
        public serialOptions: SerialOptions,
        public uploader: ArduinoUploader
    ) {}

    async upload(_program: Record<string, string>) {
        throw new Error("Not implemented")
    }

    /**
     * Reset the Arduino.
     * @returns {Promise<void>}
     */
    async reset(baudRate: number) {
        await this.uploader.writeStream?.releaseLock();
        await this.uploader.readStream?.releaseLock();
        await this.port.close();
        await this.port.open({ baudRate: baudRate })
        this.uploader.readStream = this.port.readable.getReader();
        this.uploader.writeStream = this.port.writable.getWriter();

        try {
            await this.port.setSignals({ dataTerminalReady: false })
            await delay(250);
            await this.port.setSignals({ dataTerminalReady: true })
            await clearReadBuffer(this.robotWiredState, this.uploader.readStream);
        } catch (e) {
            throw e;
        }
    }
}
