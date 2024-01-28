import { Component, Inject } from '@angular/core';
import { MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog';
import { AppState } from 'src/app/state/app.state';
import {MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA} from '@angular/material/legacy-dialog';

@Component({
    selector: 'app-robot-select',
    templateUrl: './robot-select.dialog.html',
    styleUrls: ['./robot-select.dialog.scss']
})
export class SelectRobotTypeDialog {
    constructor(
        @Inject(MAT_DIALOG_DATA) public data: any,
        public dialogRef: MatDialogRef<SelectRobotTypeDialog>,
        public appState: AppState,

    ) { }

    public onRobotSelected(robotType: String) {
        this.dialogRef.close(robotType);
    }
}
