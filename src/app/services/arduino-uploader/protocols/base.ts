import { RobotWiredState } from "../../../state/robot.wired.state";
import { clearReadBuffer, delay } from "../utils";
import ArduinoUploader from "../ArduinoUploader";
import { UploadState } from "../../../state/upload.state";

export default class BaseProtocol {
    constructor(
        public port: SerialPort,
        public robotWiredState: RobotWiredState,
        public uploadState: UploadState,
        public uploader: ArduinoUploader,
    ) {}

    async upload(_program: Record<string, string>) {
        throw new Error("Not implemented");
    }

    waitForPort() {
        return new Promise<SerialPort>((resolve, reject) => {
            let attempts = 0;
            let interval = setInterval(async () => {
                if (++attempts > 200) {
                    clearInterval(interval);
                    reject("Failed to reconnect");
                }

                const [port] = await navigator.serial.getPorts();
                if (port) {
                    clearInterval(interval);
                    resolve(port);
                }
            }, 50);
        });
    }
}
