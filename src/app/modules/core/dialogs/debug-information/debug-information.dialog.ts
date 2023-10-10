import {Component} from '@angular/core';
import {MatDialogRef} from '@angular/material/dialog';
import {RobotWiredState} from "../../../../state/robot.wired.state";
import {TranslateService} from "@ngx-translate/core";

@Component({
  selector: 'debug-information',
  templateUrl: './debug-information.dialog.html',
  styleUrls: ['./debug-information.dialog.scss']
})
export class DebugInformationDialog {

  public os: string = '';
  public browser: string = '';
  public browserVersion: string = '';
  public serialPort: SerialPort | undefined;
  public webSerialSupported: string = 'Supported';


  constructor(
    public dialogRef: MatDialogRef<DebugInformationDialog>,
    public robotWiredState: RobotWiredState,
    private translate: TranslateService,
  ) {
    // @ts-ignore
    this.os = navigator.userAgentData?.platform ?? translate.instant("UNKNOWN");
    // @ts-ignore
    this.browser = navigator.userAgentData?.brands[0].brand ?? translate.instant("UNKNOWN");
    // @ts-ignore
    this.browserVersion = navigator.userAgentData?.brands[0].version ?? translate.instant("UNKNOWN");
    this.serialPort = this.robotWiredState.getSerialPort();
    if (!('serial' in navigator)) {
      this.webSerialSupported = translate.instant("WEB_SERIAL_NOT_SUPPORTED");
    } else {
      this.webSerialSupported = translate.instant("WEB_SERIAL_SUPPORTED");
    }
  }

  public onCloseClicked() {
    this.dialogRef.close();
  }


  protected readonly document = document;
}
