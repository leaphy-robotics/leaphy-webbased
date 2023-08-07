import { Injectable } from '@angular/core';
import { filter } from 'rxjs/operators';
import { BackEndState } from '../state/backend.state';
import { RobotWiredState } from '../state/robot.wired.state';

@Injectable({
    providedIn: 'root',
})

export class RobotWiredEffects {

    constructor(
        private robotWiredState: RobotWiredState,
        private backEndState: BackEndState,
    ) {
        // React to messages from the Electron backend
        this.backEndState.backEndMessages$
            .pipe(filter(message => !!message))
            .subscribe(message => {
                    if (message.event == 'SERIAL_DATA')
                    {
                        const serialData = {time: new Date(), data: String(message.payload)}
                        this.robotWiredState.setIncomingSerialData(serialData);
                    }
            });
    }
}
