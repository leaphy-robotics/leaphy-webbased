import { Injectable } from '@angular/core';
import {SerialPort} from "serialport";
import Arduino from "./webserial/ArduinoUploader";

@Injectable({
  providedIn: 'root'
})
export class UploadService {
  uploader = new Arduino();

  constructor() {
  }

  public async upload(hex: string) {
    await this.uploader.connect();
    await this.uploader.upload(hex);
  }
}




