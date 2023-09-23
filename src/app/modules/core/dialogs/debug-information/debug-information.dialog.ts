import {Component} from '@angular/core';
import {MatDialogRef} from '@angular/material/dialog';
import {RobotWiredState} from "../../../../state/robot.wired.state";

@Component({
  selector: 'debug-information',
  templateUrl: './debug-information.dialog.html',
  styleUrls: ['./debug-information.dialog.scss']
})
export class DebugInformationDialog {

  constructor(
    public dialogRef: MatDialogRef<DebugInformationDialog>,
    public robotWiredState: RobotWiredState,
  ) {

  }

  public onCloseClicked() {
    this.dialogRef.close();
  }


  protected readonly document = document;
}
