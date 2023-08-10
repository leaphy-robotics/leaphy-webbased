import { Injectable } from '@angular/core';
import { filter } from 'rxjs/operators';
import { BackEndState } from '../state/backend.state';
import { RobotWiredState } from '../state/robot.wired.state';
import {DialogState} from "../state/dialog.state";

@Injectable({
    providedIn: 'root',
})

export class RobotWiredEffects {

    constructor(
        private robotWiredState: RobotWiredState,
        private backEndState: BackEndState,
        private dialogState: DialogState,
    ) {
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
              if (this.robotWiredState.getSerialPort() == null) {
                return;
              }
              console.log("Serial output listening");
              try {
                try {
                  await this.robotWiredState.getSerialPort().open({ baudRate: 115200 });
                } catch (e) {
                  if (!e.message.includes("already open")) {
                    console.log(e);
                  }
                }
                this.robotWiredState.setIsSerialOutputStillListening(true);
                const abortController = new AbortController();

                const readableStream = this.robotWiredState.getSerialPort().readable;

                const writableStream = new WritableStream({
                  write: async (chunk) => {
                    const str = new TextDecoder("utf-8").decode(chunk);
                    const serialData = { time: new Date(), data: str };
                    this.robotWiredState.setIncomingSerialData(serialData);
                  },
                });

                const pipePromise = readableStream.pipeTo(writableStream, { signal: abortController.signal });

                pipePromise.catch((error) => {

                  if (error.toString().includes('Upload started')) {
                    writableStream.abort("Upload started")
                    console.log('Stream aborted');
                  } else {
                    console.error('Error while piping stream:', error);
                  }
                }).then(
                  async () => {
                    await this.robotWiredState.getSerialPort().close();
                    await this.robotWiredState.getSerialPort().open({baudRate: 115200});
                    this.robotWiredState.setIsSerialOutputStillListening(false);
                  }
                );

                this.robotWiredState.setAbortController(abortController);
              } catch (e) {
                console.log(e);
              }
            });
    }


}
