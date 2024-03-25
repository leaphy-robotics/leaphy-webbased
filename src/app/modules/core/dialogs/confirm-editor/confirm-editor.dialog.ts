import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {AppState} from 'src/app/state/app.state';

@Component({
    selector: 'app-confirm-editor',
    templateUrl: './confirm-editor.dialog.html',
    styleUrls: ['../dialog-styles.scss', './confirm-editor.dialog.scss']
})
export class ConfirmEditorDialog {
    constructor(
        public dialogRef: MatDialogRef<ConfirmEditorDialog>,
        public appState: AppState,
    ) { }

    public close(confirm: boolean) {
        this.dialogRef.close(confirm)
    }
}
