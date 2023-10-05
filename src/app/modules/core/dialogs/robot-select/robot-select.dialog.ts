import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { AppState } from 'src/app/state/app.state';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';
import { Inject } from '@angular/core';

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
