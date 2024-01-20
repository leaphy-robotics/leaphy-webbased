import {Component, HostListener} from '@angular/core';
import {AppState} from 'src/app/state/app.state';
import {BackEndState} from 'src/app/state/backend.state';
import {BlocklyEditorState} from 'src/app/state/blockly-editor.state';
import {WorkspaceStatus} from 'src/app/domain/workspace.status';
import {SketchStatus} from 'src/app/domain/sketch.status';
import {DialogState} from 'src/app/state/dialog.state';
import {Language} from 'src/app/domain/language';
import {Router} from "@angular/router";
import {CodeEditorType} from "../../../domain/code-editor.type";
import {RobotWiredState} from "../../../state/robot.wired.state";
import {MatSnackBar} from "@angular/material/snack-bar";
import JSZip from 'jszip';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss']
})
export class HeaderComponent {

    constructor(
        public appState: AppState,
        public backEndState: BackEndState,
        public blocklyState: BlocklyEditorState,
        public dialogState: DialogState,
        public robotWiredState: RobotWiredState,
        private router: Router,
        private snackBar: MatSnackBar,
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
        console.log(data);
        const files = [];
        for (const file of data) {
            files.push(file.download_url);
        }
        console.log(files);
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
            const port = await navigator.serial.requestPort({filters: [{usbVendorId: 0x1a86}, {usbVendorId: 9025}, {usbVendorId: 2341}, {usbVendorId: 0x0403}]})
            if (port !== this.robotWiredState.getSerialPort()) {
                await port.open({baudRate: 115200});
                this.robotWiredState.setSerialPort(port);
                this.dialogState.setIsSerialOutputListening(true);
            }
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
        this.blocklyState.setSketchStatus(SketchStatus.ReadyToSend);
    }

    public onRunClicked() {
        this.blocklyState.setSketchStatus(SketchStatus.Sending);
    }

    public onUndoClicked() {
        this.blocklyState.setUndo(false);
    }

    public onRedoClicked() {
        this.blocklyState.setUndo(true);
    }

    public onHelpClicked() {
        this.appState.setShowHelpPage(true);
    }

    public onEmailClicked() {
        // copy email to clipboard
        navigator.clipboard.writeText('helpdesk@leaphy.nl').then(function() {});
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
        this.backEndState.setIsViewLogClicked();
    }

    public onToggleSoundClicked() {
        this.blocklyState.setIsSoundToggled();
    }

    public onLanguageChanged(language: Language) {
        this.appState.setChangedLanguage(language);
        window.location.reload();
    }

    public onBackToBlocks() {
        console.log("onBackToBlocks: ", this.appState.getCurrentEditor());
        if (this.appState.getCurrentEditor() == CodeEditorType.Beginner)
            this.router.navigate(['/blocks'], { skipLocationChange: true });
        else if (this.appState.getCurrentEditor() == CodeEditorType.CPP)
            this.router.navigate(['/cppEditor'], { skipLocationChange: true });
        else if (this.appState.getCurrentEditor() == CodeEditorType.Python)
            this.router.navigate(['/pythonEditor'], { skipLocationChange: true });
    }

    protected readonly AppState = AppState;
}


