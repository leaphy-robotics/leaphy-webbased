import {Component, HostListener} from '@angular/core';
import {AppState} from 'src/app/state/app.state';
import {BlocklyEditorState} from 'src/app/state/blockly-editor.state';
import {WorkspaceStatus} from 'src/app/domain/workspace.status';
import {DialogState} from 'src/app/state/dialog.state';
import {Language} from 'src/app/domain/language';
import {Router} from "@angular/router";
import {CodeEditorType} from "../../../domain/code-editor.type";
import {RobotWiredState} from "../../../state/robot.wired.state";
import {MatSnackBar} from "@angular/material/snack-bar";
import JSZip from 'jszip';
import {microPythonRobotType} from "../../../domain/robot.type";
import {DebugInformationDialog} from "../../core/dialogs/debug-information/debug-information.dialog";
import {MatDialog} from "@angular/material/dialog";
import {UploadDialog} from "../../core/dialogs/upload/upload.dialog";
import {CodeEditorState} from "../../../state/code-editor.state";
import {PythonUploaderService} from "../../../services/python-uploader/PythonUploader.service";
import {ConnectPythonDialog} from "../../core/dialogs/connect-python/connect-python.dialog";
import {StatusMessageDialog} from "../../core/dialogs/status-message/status-message.dialog";

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {

    constructor(
        public appState: AppState,
        public blocklyState: BlocklyEditorState,
        public dialogState: DialogState,
        public robotWiredState: RobotWiredState,
        private router: Router,
        private snackBar: MatSnackBar,
        private dialog: MatDialog,
        private codeEditorState: CodeEditorState,
        private uploaderService: PythonUploaderService
    ) {

    }

    public onNewProjectClicked() {
        this.appState.setSelectedRobotType(null);
    }

    public onLoadWorkspaceClicked() {
        this.blocklyState.setWorkspaceStatus(WorkspaceStatus.Finding);
    }

    public async onDownloadDriversClicked() {
        // check the GitHub api for what files we need to download with url: https://api.github.com/repos/leaphy-robotics/leaphy-firmware/
        // then download the files with the url: https://raw.githubusercontent.com/leaphy-robotics/leaphy-firmware/master/drivers/
        // then zip the files into one file and download them all
        const url = 'https://api.github.com/repos/leaphy-robotics/leaphy-firmware/contents/drivers';
        const response = await fetch(url);
        const data = await response.json();
        const files = [];
        for (const file of data) {
            files.push(file.download_url);
        }
        const zip = new JSZip();
        const promises = [];
        for (const file of files) {
            promises.push(fetch(file).then(response => response.blob()).then(blob => {
                zip.file(file.split('/').pop(), blob);
            }));
        }
        await Promise.all(promises);
        const content = await zip.generateAsync({type: 'blob'});
        const a = document.createElement('a');
        const url2 = URL.createObjectURL(content);
        a.href = url2;
        a.download = 'leaphy-drivers.zip';
        a.click();
        URL.revokeObjectURL(url2);
    }

    public async onChooseRobot() {
        if ('serial' in navigator) {
            const port = await navigator.serial.requestPort({
                filters: this.robotWiredState.SUPPORTED_VENDORS.map(vendor => ({
                    usbVendorId: vendor
                }))
            })
            if (port !== this.robotWiredState.getSerialPort()) {
                await port.open({baudRate: 115200});
                this.robotWiredState.setSerialPort(port);
                this.dialogState.setIsSerialOutputListening(true);
            }

            this.snackBar.openFromComponent(StatusMessageDialog, {
                duration: 2000,
                horizontalPosition: 'center',
                verticalPosition: 'bottom',
                data: { message: "CONNECTED" }
            })
        }
    }

    public onSaveWorkspaceClicked() {
        this.blocklyState.setWorkspaceStatus(WorkspaceStatus.Saving);
    }

    // To capture the keyboard shortcut for Saving a project
    @HostListener('window:keydown', ['$event'])
    onCtrlS(event: KeyboardEvent) {
        if ((event.metaKey || event.ctrlKey) && event.key === 's') {
            this.onSaveWorkspaceClicked();
            event.preventDefault();
        }
    }

    public onCodeEditorClicked() {
        this.appState.switchCodeEditor();
    }

    public onSaveWorkspaceAsClicked() {
        this.blocklyState.setWorkspaceStatus(WorkspaceStatus.SavingAs);
    }

    public onConnectClicked() {
        this.dialog.open(ConnectPythonDialog, {
            width: '600px', disableClose: true,
        }).afterClosed().subscribe((result) => {
            if (result) {
                if (result == "HELP_ENVIRONMENT") {
                    const langcode = this.appState.getCurrentLanguageCode();
                    this.router.navigateByUrl('/' + langcode + '/driverissues', {skipLocationChange: true}).then(() => {});
                }
            }
        });
    }

    public async onRunClicked() {
        const robotType = this.appState.getSelectedRobotType();
        const code = this.codeEditorState.getCode();
        const libraries = [...robotType.libs];
        libraries.push(...this.codeEditorState.getInstalledLibraries().map(lib => `${lib.name}@${lib.version}`));
        try {
            if (this.appState.getCurrentEditor() == CodeEditorType.Python) {
                await this.uploaderService.runCode(code)
            } else {
                this.dialog.open(UploadDialog, {
                    width: '450px', disableClose: true,
                    data: {source_code: code, libraries: libraries, board: robotType.fqbn}
                }).afterClosed().subscribe((result) => {
                    if (result) {
                        if (result == "HELP_ENVIRONMENT") {
                            const langcode = this.appState.getCurrentLanguageCode();
                            this.router.navigateByUrl('/' + langcode + '/driverissues', {skipLocationChange: true});
                        }
                    }
                });
            }


        } catch (error) {
            console.log('Error:', error.message);
        }
    }

    public onUndoClicked() {
        this.blocklyState.setUndo(false);
    }

    public onRedoClicked() {
        this.blocklyState.setUndo(true);
    }

    public onHelpClicked() {
        window.open("https://discord.com/invite/Yeg7Kkrq5W", '_blank').focus()
    }

    public onEmailClicked() {
        // copy email to clipboard
        navigator.clipboard.writeText('helpdesk@leaphy.org').then(function() {});
        this.snackBar.open('Email copied to clipboard', 'Close', {
            duration: 2000,
        });
    }

    isDriverIssuesUrl(): boolean {
        return !(this.router.url.endsWith('driverissues'));
    }

    public onShowInfoClicked() {
        this.dialogState.setIsInfoDialogVisible(true);
    }

    public onViewLogClicked() {
        this.dialog.open(DebugInformationDialog, {
            disableClose: false,
        });
    }

    public onToggleSoundClicked() {
        this.blocklyState.setIsSoundToggled();
    }

    public onLanguageChanged(language: Language) {
        this.appState.setChangedLanguage(language);
        window.location.reload();
    }

    public onBackToBlocks() {
        if (this.appState.getCurrentEditor() == CodeEditorType.Beginner)
            this.router.navigate(['/blocks'], {skipLocationChange: true}).then(() => {});
        else if (this.appState.getCurrentEditor() == CodeEditorType.CPP)
            this.router.navigate(['/cppEditor'], { skipLocationChange: true }).then(() => {});
        else if (this.appState.getCurrentEditor() == CodeEditorType.Python)
            this.router.navigate(['/pythonEditor'], { skipLocationChange: true }).then(() => {});
    }

    public onExamplesClicked() {
        this.dialogState.setIsExamplesDialogVisible(true)
    }

    protected readonly AppState = AppState;
    protected readonly microPythonRobotType = microPythonRobotType;
}


