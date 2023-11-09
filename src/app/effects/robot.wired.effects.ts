import { Injectable } from '@angular/core';
import { filter } from 'rxjs/operators';
import { BackEndState } from '../state/backend.state';
import { RobotWiredState } from '../state/robot.wired.state';
import {DialogState} from "../state/dialog.state";
import ArduinoWebserial from "../services/webserial/ArduinoWebserial";

@Injectable({
    providedIn: 'root',
})

export class RobotWiredEffects {
    private webserial: ArduinoWebserial;
    private logBuffer: string = "";

    constructor(
        private robotWiredState: RobotWiredState,
        private backEndState: BackEndState,
        private dialogState: DialogState,
    ) {
        this.webserial = new ArduinoWebserial(this.robotWiredState);
        this.backEndState.backEndMessages$
            .pipe(filter(message => !!message))
            .subscribe(message => {
                if (message.event == 'SERIAL_DATA')
                {
                    const serialData = {time: new Date(), data: String(message.payload)}
                    this.robotWiredState.setIncomingSerialData(serialData);
                }
            });

        this.dialogState.isSerialOutputListening$
            .pipe(filter(isListening => !!isListening))
            .subscribe(async () => {
                const robotWiredState = this.robotWiredState;

                const writableStream = new WritableStream({
                    start: async () => {
                        this.logBuffer = "";
                    },
                    write: async (chunk) => {
                        this.logBuffer += new TextDecoder("utf-8").decode(chunk);
                        const date = new Date();

                        function makeString (chunkedStr: string) {
                            const serialData = { time: date, data: chunkedStr };
                            robotWiredState.setIncomingSerialData(serialData);
                        }
                        
                        let i = this.logBuffer.indexOf("\n");
                        await new Promise((resolve) => {
                            // Give the browser time to render/update the dialog
                            setTimeout(resolve, 1)
                        })
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

                this.webserial.serialMonitor(writableStream);
            });
    }


}
