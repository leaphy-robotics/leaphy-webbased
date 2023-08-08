import { Injectable } from '@angular/core';
import Arduino from "./webserial/ArduinoUploader";
import {BackEndState} from "../state/backend.state";

@Injectable({
  providedIn: 'root'
})
export class UploadService {
  uploader = new Arduino();

  constructor(private backEndMessage: BackEndState) {
  }

  public async upload(hex: string, callback: (message: string) => void = (message: string) => {}) {
    await this.uploader.connect();
    await this.uploader.upload(hex, callback);
  }
}




