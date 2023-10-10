import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {TranslateService} from "@ngx-translate/core";
import ArduinoUploader from "../../../../services/webserial/ArduinoUploader";
import {DialogState} from "../../../../state/dialog.state";
import {RobotWiredState} from "../../../../state/robot.wired.state";

@Component({
  selector: 'upload-information',
  templateUrl: './upload.dialog.html',
  styleUrls: ['./upload.dialog.scss']
})
export class UploadDialog {
  private upload = new ArduinoUploader(this.robotWiredState);

  statusMessage: string = '';
  progressBarWidth: number = 0;
  uploadFailed: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<UploadDialog>,
    private dialogState: DialogState,
    private robotWiredState: RobotWiredState,
    private translate: TranslateService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    // get all the vars for upload from the data passed in
    const source_code = data.source_code;
    const board = data.board;
    const libraries = data.libraries;
    this.startUpload(source_code, board, libraries)
  }

  public async startUpload(source_code: string, board: string, libraries: string) {
    console.log("Starting upload");
    this.dialogState.setIsSerialOutputListening(false);
    function makeRequest(source_code, board, libraries) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://webservice.leaphyeasybloqs.com/compile/cpp', true);
        xhr.setRequestHeader('Content-Type', 'application/json');

        xhr.onload = () => {
          if (xhr.status === 200) {
            resolve(xhr.response);
          } else if (xhr.status === 500) {
            reject(new Error('Request failed: ' + xhr.status + ' ' + xhr.response.detail));
          }
          else {
            reject(new Error('Request failed: ' + xhr.status));
          }
          xhr.abort();
        };

        xhr.onerror = () => {
          reject(new Error('Network error'));
        };

        xhr.responseType = 'json'; // Change the responseType to 'json'
        xhr.send(JSON.stringify({source_code, board, libraries}));
      });
    }
    this.onUpdate('COMPILATION_STARTED');
    const response = await makeRequest(source_code, board, libraries).catch(error => {
      this.onUpdate('COMPILATION_FAILED');
      if (!error.toString().startsWith("Error: Request failed: 500 ")) {
        console.error(error);
        return;
      }
      // make the printed red text
      console.log('%c' + error.toString().replace("Error: Request failed: 500 ", ""), 'color: red');

      // remove the last 4 lines of the error message
      const errorLines = error.toString().replace("Error: Request failed: 500 ", "").split("\n");
      errorLines.splice(errorLines.length - 5, 5);
      const errorString = errorLines.join("\n");
      this.onError(errorString);
      this.showReturnOptions();
    });
    if (response === undefined) {
        return;
    }
    const hex = response['hex']; // Extract the "hex" property from the response
    this.onUpdate('COMPILATION_COMPLETE');
    this.progressBarWidth += 25;

    if ('serial' in navigator) {

      try {
        if (this.robotWiredState.getSerialPort() !== null) {
          this.dialogState.setIsSerialOutputListening(false);
          this.robotWiredState.getAbortController().abort("Upload started");
          while (this.robotWiredState.getIsSerialOutputStillListening()) {
            await new Promise(r => setTimeout(r, 1000));
          }
          this.upload.port = this.robotWiredState.getSerialPort();

        } else {
          await this.upload.connect();
          this.robotWiredState.setSerialPort(this.upload.port);
        }
        this.progressBarWidth += 25;
      } catch (error) {
        if (error.toString() === 'Error: No device selected') {
          this.uploadFailed = true;
          this.onUpdate('NO_DEVICE_SELECTED')
          this.showReturnOptions();
          console.error(error);
        } else {
          this.uploadFailed = true;
          this.onUpdate('DRIVER_ERROR')
          this.showReturnOptions();
          console.error(error);
        }
        return;
      }
      this.onUpdate('UPDATE_STARTED')
      try {
        await this.upload.upload(hex, (message: string) => { this.onUpdate(message) });
      } catch (error) {
        // close dialog
        this.uploadFailed = true;
        this.showReturnOptions();
        console.error(error);

      }
      this.showReturnOptions();
    }
    else {
      this.onUpdate('NO_SERIAL_SUPPORT')
      this.showReturnOptions();
    }
    console.log("Finished upload");

  }
  onUpdate(message: string) {
    if (message.endsWith("%")) {
      this.progressBarWidth += parseInt(message.replace("%", ""));
    } else {
      const translation = this.translate.instant(message);
      this.statusMessage = translation !== null ? translation : message.replace(/_/g, " ");
    }
  }

  showReturnOptions() {
    document.getElementById("return-options").classList.remove("hidden");
    document.getElementById("upload-progress-bar").classList.add("hidden");
    document.getElementById("return-options").classList.add("return-options");
    if (this.uploadFailed) {
      document.getElementById("upload-status").classList.add("failed-upload");
      document.getElementById("helpEnviroment").classList.remove("hidden");
    }
  }

  returnBlockEnvironment() {
    this.dialogState.setIsSerialOutputListening(true);
    this.dialogRef.close("BLOCK_ENVIRONMENT");
  }

  returnHelpEnvironment() {
    this.dialogState.setIsSerialOutputListening(true);
    this.dialogRef.close("HELP_ENVIRONMENT");
  }

    onError(error: string) {
      document.getElementById("error-message").innerText = error;
      document.getElementById("error-message").classList.remove("hidden");
      this.uploadFailed = true;
    }

  protected readonly document = document;
}
