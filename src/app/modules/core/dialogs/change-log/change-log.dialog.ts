import {AfterViewInit, Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';

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
