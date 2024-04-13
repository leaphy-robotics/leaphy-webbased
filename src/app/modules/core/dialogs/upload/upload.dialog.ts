import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import ArduinoUploader from "../../../../services/arduino-uploader/ArduinoUploader";
import {DialogState} from "../../../../state/dialog.state";
import {RobotWiredState} from "../../../../state/robot.wired.state";
import {environment} from "src/environments/environment";
import {AppState} from "../../../../state/app.state";
import {UploadState} from "../../../../state/upload.state";

@Component({
    selector: 'app-upload',
    templateUrl: './upload.dialog.html',
    styleUrls: ['./upload.dialog.scss']
})
export class UploadDialog {
    private upload = new ArduinoUploader(this.robotWiredState, this.appState, this.uploadState);

    constructor(
        public dialogRef: MatDialogRef<UploadDialog>,
        private dialogState: DialogState,
        private robotWiredState: RobotWiredState,
        private appState: AppState,
        public uploadState: UploadState,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        // get all the vars for upload from the data passed in
        const source_code = data.source_code;
        const board = data.board;
        const libraries = data.libraries;

        this.uploadState.reset()
        this.startUpload(source_code, board, libraries).then()
    }

    async compile(source_code: string, board: string, libraries: string) {
        const res = await fetch(`${environment.backend}/compile/cpp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                source_code, board, libraries
            })
        })
        if (!res.ok) {
            let message: string = await res.text()
            try {
                message = JSON.parse(message).detail
            } catch {}
            throw new Error(message)
        }

        return await res.json() as Record<string, string>
    }

    public async startUpload(source_code: string, board: string, libraries: string) {
        this.dialogState.isSerialOutputListening = false;
        if (!navigator.serial && !navigator.usb) {
            this.uploadState.statusMessage = 'NO_SERIAL_SUPPORT'
            this.uploadState.failed = true
            this.uploadState.done = true
            return
        }

        if (this.robotWiredState.serialPort === null) {
            try {
                await this.upload.connect()
                this.robotWiredState.serialPort = this.upload.port;
            } catch (error) {
                if (error.toString() === 'Error: No device selected') {
                    this.uploadState.failed = true
                    this.uploadState.statusMessage = 'NO_DEVICE_SELECTED'
                    console.error(error);
                } else {
                    this.uploadState.statusMessage = "UPDATE_FAILED"
                    this.uploadState.error = error.toString()
                    console.error(error);
                }

                return
            }
        }

        this.robotWiredState.abortController?.abort("Upload started");
        this.upload.setPort(this.robotWiredState.serialPort);
        this.uploadState.addProgress(25);

        this.uploadState.statusMessage = 'COMPILATION_STARTED';
        const response = await this.compile(source_code, board, libraries).catch(error => {
            this.uploadState.statusMessage = 'COMPILATION_FAILED';
            // make the printed red text
            console.log('%c' + error.toString(), 'color: red');

            // remove the last 4 lines of the error message
            const errorLines = error.toString().split("\n");
            errorLines.splice(errorLines.length - 5, 5);
            this.uploadState.error = errorLines.join("\n")
        })
        if (!response) return

        this.uploadState.addProgress(25);
        this.uploadState.statusMessage = 'UPDATE_STARTED'

        try {
            await this.upload.upload(response);
        } catch (error) {
            this.uploadState.error = error.toString()
            console.error(error);

        }
        this.uploadState.done = true;

        console.log("Finished upload");

    }

    returnBlockEnvironment() {
        this.dialogState.isSerialOutputListening = true;
        this.dialogRef.close("BLOCK_ENVIRONMENT");
    }

    returnHelpEnvironment() {
        this.dialogState.isSerialOutputListening = true;
        this.dialogRef.close("HELP_ENVIRONMENT");
    }

    async reconnect() {
        try {
            const port = await navigator.usb.requestDevice({
                filters: RobotWiredState.SUPPORTED_VENDORS.map(vendor => ({
                    vendorId: vendor
                }))
            })
            this.uploadState.connectUSB(port)
        } catch (e) {}
    }
}
