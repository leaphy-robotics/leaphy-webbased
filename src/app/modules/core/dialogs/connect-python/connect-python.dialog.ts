import {Component} from '@angular/core';
import {MatDialogRef} from '@angular/material/dialog';
import {TranslateService} from "@ngx-translate/core";
import {DialogState} from "../../../../state/dialog.state";
import {RobotWiredState} from "../../../../state/robot.wired.state";
import {BehaviorSubject} from "rxjs";
import {CodeEditorType} from "../../../../domain/code-editor.type";
import {PythonUploaderService} from "../../../../services/python-uploader/PythonUploader.service";

@Component({
    selector: 'app-connect-python',
    templateUrl: './connect-python.dialog.html',
    styleUrls: ['./connect-python.dialog.scss']
})
export class ConnectPythonDialog {
    statusMessage: string = '';
    progressBarWidth: number = 0;
    protected readonly document = document;
    public uploading: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    public firmwareWriting: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    public uploadFailed: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    public didUpload: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

    constructor(
        public dialogRef: MatDialogRef<ConnectPythonDialog>,
        private dialogState: DialogState,
        private translate: TranslateService,
        private upload: PythonUploaderService,
        private robotWiredState: RobotWiredState,
    ) {}

    public async makePythonRobotConnection() {
        this.dialogState.isSerialOutputListening = false;
        this.uploading.next(true);
        this.onUpdate('CONNECTING');
        this.progressBarWidth += 25;

        if ('serial' in navigator && 'showDirectoryPicker' in window) {
            try {
                await this.upload.connect();
            } catch (error) {
                if (error.message === 'No device selected') {
                    this.onUpdate('NO_DEVICE_SELECTED');
                    this.onError('No device selected')
                } else if (error.message === 'Signature mismatch') {
                    this.onUpdate("SIGNATURE_MISMATCH");
                    this.onError('Signature mismatch')
                } else {
                    console.log(error);
                }
                setTimeout(() => {
                    this.showReturnOptions()
                }, 1);
                return
            }
            this.progressBarWidth += 25;
            await this.upload.installStandardLibraries();
            this.progressBarWidth += 25;
        } else {
            this.onUpdate('NO_SERIAL_SUPPORT')
            this.showReturnOptions();
        }

        this.onUpdate('CONNECTED');
        this.showReturnOptions();
        this.robotWiredState.pythonDeviceConnected = true;
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
            this.progressBarWidth += 50;
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
        this.uploading.next(false);
        this.firmwareWriting.next(false);
        this.didUpload.next(true);
    }

    returnBlockEnvironment() {
        this.dialogState.isSerialOutputListening = true;
        this.dialogRef.close("BLOCK_ENVIRONMENT");
    }

    returnHelpEnvironment() {
        this.dialogState.isSerialOutputListening = true;
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
