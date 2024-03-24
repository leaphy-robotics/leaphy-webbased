import { Injectable } from "@angular/core";
import { filter } from "rxjs/operators";
import { RobotWiredState } from "../state/robot.wired.state";
import { DialogState } from "../state/dialog.state";
import ArduinoUploader from "../services/arduino-uploader/ArduinoUploader";
import { AppState } from "../state/app.state";
import { UploadState } from "../state/upload.state";

@Injectable({
    providedIn: "root",
})
export class RobotWiredEffects {
    private webserial: ArduinoUploader;
    private logBuffer: string = "";

    constructor(
        private appState: AppState,
        private robotWiredState: RobotWiredState,
        private uploadState: UploadState,
        private dialogState: DialogState,
    ) {
        this.webserial = new ArduinoUploader(
            this.robotWiredState,
            this.appState,
            this.uploadState,
        );

        this.dialogState.isSerialOutputListening$
            .pipe(filter((isListening) => !!isListening))
            .subscribe(async () => {
                if (this.robotWiredState.getPythonDeviceConnected()) return;
                const robotWiredState = this.robotWiredState;

                const outputStream = new WritableStream({
                    start: async () => {
                        this.logBuffer = "";
                    },
                    write: async (chunk) => {
                        this.logBuffer += new TextDecoder("utf-8").decode(
                            chunk,
                        );
                        const date = new Date();

                        function makeString(chunkedStr: string) {
                            const serialData = { time: date, data: chunkedStr };
                            robotWiredState.setIncomingSerialData(serialData);
                        }

                        let i = this.logBuffer.indexOf("\n");
                        await new Promise((resolve) => {
                            // Give the browser time to render/update the dialog
                            setTimeout(resolve, 1);
                        });
                        while (i != -1) {
                            let part = this.logBuffer.slice(0, i);
                            this.logBuffer = this.logBuffer.slice(i + 1);
                            if (part.length > 0) {
                                makeString(part);
                            }
                            i = this.logBuffer.indexOf("\n");
                        }
                        if (this.logBuffer.length > 100) {
                            // No \n was received after 100 bytes -> force output to the dialog
                            makeString(this.logBuffer);
                            this.logBuffer = "";
                        }
                    },
                });

                this.webserial.serialMonitor(outputStream).then(() => {});
            });
    }
}
