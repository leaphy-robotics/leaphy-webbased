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
                    write: async (chunk) => {
                        let entireStr = new TextDecoder("utf-8").decode(chunk);
                        const date = new Date();

                        function makeString (chunkedStr: string) {
                            const serialData = { time: date, data: chunkedStr };
                            robotWiredState.setIncomingSerialData(serialData);
                        }
                        function makeStringFinal (chunkedStr: string) {
                            const serialData = { time: date, data: chunkedStr };
                            robotWiredState.setFinalSerialData(serialData);
                        }
                        console.log("entireStr: " + entireStr.replace(/\n/g, "\\n"));
                        let icount = 0;
                        let i;
                        do {
                            console.log("icount: " + icount);
                            i = entireStr.indexOf("\n");
                            let part = entireStr.slice(0, i);
                            entireStr = entireStr.slice(i + 1);
                            console.log("part: " + part);
                            console.log("entireStr: " + entireStr);
                            makeStringFinal(part);
                            icount++;
                        } while (i != -1);
                        if (entireStr !== '\n') { makeString(entireStr); }
                    },
                });

                this.webserial.serialMonitor(writableStream);
            });
    }


}
