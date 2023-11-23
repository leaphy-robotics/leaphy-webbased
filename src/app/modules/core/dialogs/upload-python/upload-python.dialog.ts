import {Component} from '@angular/core';
import {MatDialogRef} from '@angular/material/dialog';
import {TranslateService} from "@ngx-translate/core";
import {DialogState} from "../../../../state/dialog.state";
import {RobotWiredState} from "../../../../state/robot.wired.state";
import {BehaviorSubject} from "rxjs";
import {CodeEditorType} from "../../../../domain/code-editor.type";
import {PythonUploaderService} from "../../../../services/python-uploader/PythonUploader.service";

@Component({
    selector: 'upload-python',
    templateUrl: './upload-python.dialog.html',
    styleUrls: ['./upload-python.dialog.scss']
})
export class UploadPythonDialog {
    statusMessage: string = '';
    progressBarWidth: number = 0;
    protected readonly document = document;
    public uploading: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    public firmwareWriting: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    public uploadFailed: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

    constructor(
        public dialogRef: MatDialogRef<UploadPythonDialog>,
        private dialogState: DialogState,
        private translate: TranslateService,
        private upload: PythonUploaderService
    ) {}

    public async startUpload() {
        this.dialogState.setIsSerialOutputListening(false);
        this.progressBarWidth += 25;

        if ('serial' in navigator && 'showDirectoryPicker' in window) {
        } else {
            this.onUpdate('NO_SERIAL_SUPPORT')
            this.showReturnOptions();
        }
    }

    public async startFlash() {
        this.progressBarWidth += 50;
        this.onUpdate('FLASHING');
        try {
            await this.upload.connectInBootMode();
        }  catch (error) {
            if (error.message === 'No device selected') {
                this.onUpdate('NO_DEVICE_SELECTED');
                this.onError('No device selected')
            }
            // wait to give angular time to update the UI
            setTimeout(() => {
                this.showReturnOptions()
            }, 1);
            return
        }
        try {
            this.progressBarWidth += 100;
            await this.upload.flash();
        } catch (error) {
            this.onUpdate("SIGNATURE_MISMATCH");
            this.onError('Signature mismatch')
            setTimeout(() => {
                this.showReturnOptions()
            }, 1);
            return
        }
        this.progressBarWidth += 50;
        this.onUpdate('FLASHED');
        this.showReturnOptions();
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
        document.getElementById("return-options").classList.add("return-options");
        if (this.uploadFailed) {
            console.log("upload failed");
            document.getElementById("helpEnvironment").classList.remove("hidden");
            document.getElementById("end-status").classList.add("failed-upload");
        }
        document.getElementById("end-status").classList.remove("hidden");
    }

    returnBlockEnvironment() {
        this.dialogState.setIsSerialOutputListening(true);
        this.dialogRef.close("BLOCK_ENVIRONMENT");
    }

    returnHelpEnvironment() {
        this.dialogState.setIsSerialOutputListening(true);
        this.dialogRef.close("HELP_ENVIRONMENT");
    }

    onError(error: string, showDedicatedErrorMessages: boolean = false) {
        if (showDedicatedErrorMessages) {
            document.getElementById("error-message").innerText = error;
            document.getElementById("error-message").classList.remove("hidden");
        }
        this.uploadFailed.next(true);
    }

    flashFirmware() {
        this.firmwareWriting.next(true);
        this.startFlash();
    }

    protected readonly CodeEditorType = CodeEditorType;
}
