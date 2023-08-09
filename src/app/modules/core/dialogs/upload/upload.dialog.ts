import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {TranslateService} from "@ngx-translate/core";
import ArduinoUploader from "../../../../services/webserial/ArduinoUploader";

@Component({
  selector: 'upload-information',
  templateUrl: './upload.dialog.html',
  styleUrls: ['./upload.dialog.scss']
})
export class UploadDialog {
  private upload = new ArduinoUploader();

  statusMessage: string = '';
  progressBarWidth: number = 0;
  constructor(
    public dialogRef: MatDialogRef<UploadDialog>,
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
    const uploader = new ArduinoUploader();
    function makeRequest(source_code, board, libraries) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://webservice.leaphyeasybloqs.com/compile/cpp', true);
        xhr.setRequestHeader('Content-Type', 'application/json');

        xhr.onload = () => {
          if (xhr.status === 200) {
            resolve(xhr.response);
          } else {
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
    const response = await makeRequest(source_code, board, libraries);
    const hex = response['hex']; // Extract the "hex" property from the response
    this.progressBarWidth += 25;
    this.onUpdate('COMPILATION_COMPLETE');

    if ('serial' in navigator) {
      try {
        await this.upload.connect();
        this.progressBarWidth += 25;
      } catch (error) {
        if (error.toString() === 'Error: No device selected') {
          this.onUpdate('NO_DEVICE_SELECTED')
          this.showReturnOptions();
          console.error(error);
        } else {
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

  }

  returnBlockEnvironment() {
    this.dialogRef.close("BLOCK_ENVIRONMENT");
  }

  returnHelpEnvironment() {
    this.dialogRef.close("HELP_ENVIRONMENT");
  }

  protected readonly document = document;
}
