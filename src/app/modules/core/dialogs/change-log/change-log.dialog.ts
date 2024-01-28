import {AfterViewInit, Component, Inject} from '@angular/core';
import {MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA, MatLegacyDialogRef as MatDialogRef} from '@angular/material/legacy-dialog';

@Component({
    selector: 'app-change-log',
    templateUrl: './change-log.dialog.html',
    styleUrls: ['./change-log.dialog.scss']
})
export class ChangeLogDialog implements AfterViewInit {

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: any,
        public dialogRef: MatDialogRef<ChangeLogDialog>
    ) {}

    public onConfirm() {
        this.dialogRef.close();
    }

    ngAfterViewInit() {
        document.getElementById("version-title").innerHTML = this.data?.title;
        document.getElementById("release-notes").innerHTML = this.data?.message;
    }
}
