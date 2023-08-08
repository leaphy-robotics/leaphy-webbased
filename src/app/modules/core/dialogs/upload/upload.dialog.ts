import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import { Language } from 'src/app/domain/language';
import { AppState } from 'src/app/state/app.state';
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
      // @ts-ignore
      try {
        await this.upload.connect();
        this.progressBarWidth += 25;
      } catch (error) {
        if (error.toString() === 'Error: No device selected') {
          this.onUpdate('NO_DEVICE_SELECTED')
          console.error(error);
        } else {
          this.onUpdate('DRIVER_ERROR')
          console.error(error);
        }
        return;
      }
      this.onUpdate('UPDATE_STARTED')
      try {
        await this.upload.upload(hex, (message: string) => { this.onUpdate(message) });
      } catch (error) {
        // close dialog
        this.onUpdate('UPDATE_FAILED')
        this.showReturnOptions();
        console.error(error);

      }
      this.onUpdate('UPDATE_COMPLETE')
      this.showReturnOptions();
    } else {
      console.log('Web serial doesn\'t seem to be enabled in your browser. Try enabling it by visiting:');
      console.log('chrome://flags/#enable-experimental-web-platform-features');
    }
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
  }

  returnBlockEnvironment() {
    this.dialogRef.close("BLOCK_ENVIRONMENT");
  }

  returnHelpEnvironment() {
    this.dialogRef.close("HELP_ENVIRONMENT");
  }

  protected readonly document = document;
}
