import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { AppState } from 'src/app/state/app.state';
import {PythonUploaderService} from "../../../../services/python-uploader/PythonUploader.service";
import {BackEndState} from "../../../../state/backend.state";
import {RobotWiredState} from "../../../../state/robot.wired.state";

@Component({
    selector: 'app-file-explorer',
    templateUrl: './file-explorer.dialog.html',
    styleUrls: ['./file-explorer.dialog.scss']
})
export class FileExplorerDialog {
    public currentPath: string = '/';
    protected readonly document = document;

    public dirContent: { name: string, isDir: boolean }[] = [];

    constructor(
        private upload: PythonUploaderService,
        public dialogRef: MatDialogRef<FileExplorerDialog>,
        public appState: AppState,
        private robotWiredState: RobotWiredState
    ) {
        this.upload.connect().then(() => {
            this.robotWiredState.setSerialPort(this.upload.port)
            this.upload.runFileSystemCommand('ls', this.currentPath).then((files) => {
                this.dirContent = files;
            });
        });
    }

    set currentDir(path: string) {
        this.currentPath = path;
    }

    public openDir(path: string) {
        if (path[-1] != '/')
            path += '/';
        this.currentPath += path;
        this.upload.runFileSystemCommand('ls', this.currentPath).then((files) => {
            this.dirContent = files;
        });
    }

    public openDirRaw(path: string) {
        this.currentPath = path;
        this.upload.runFileSystemCommand('ls', this.currentPath).then((files) => {
            this.dirContent = files;
        });
    }

    public async openFile(filename: string) {
        filename = this.currentPath + '/' + filename;
        const content = await this.upload.runFileSystemCommand('get', filename);
        this.dialogRef.close(content);
    }
}
