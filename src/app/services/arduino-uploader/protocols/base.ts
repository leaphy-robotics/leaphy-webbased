import { LeaphyPort, RobotWiredState } from "../../../state/robot.wired.state";
import ArduinoUploader from "../ArduinoUploader";
import { UploadState } from "../../../state/upload.state";
import { SerialPort } from "web-serial-polyfill";

export default class BaseProtocol {
    constructor(
        public port: LeaphyPort,
        public robotWiredState: RobotWiredState,
        public uploadState: UploadState,
        public uploader: ArduinoUploader,
    ) {}

    async upload(_program: Record<string, string>) {
        throw new Error("Not implemented");
    }

    waitForPort() {
        return new Promise<LeaphyPort>(async (resolve, reject) => {
            const platform = navigator.userAgent.toLowerCase();
            if (platform.includes("android")) {
                const device = await this.uploadState.requestUSBDevice();
                resolve(new SerialPort(device));
            }

            let attempts = 0;
            let interval = setInterval(async () => {
                if (++attempts > 200) {
                    clearInterval(interval);
                    reject("Failed to reconnect");
                }

                const port = await this.robotWiredState.requestSerialPort(
                    false,
                    false,
                );
                if (port) {
                    clearInterval(interval);
                    resolve(port);
                }
            }, 50);
        });
    }
}
