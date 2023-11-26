import {Component, HostListener} from '@angular/core';
import {AppState} from 'src/app/state/app.state';
import {BackEndState} from 'src/app/state/backend.state';
import {BlocklyEditorState} from 'src/app/state/blockly-editor.state';
import {WorkspaceStatus} from 'src/app/domain/workspace.status';
import {SketchStatus} from 'src/app/domain/sketch.status';
import {DialogState} from 'src/app/state/dialog.state';
import {Language} from 'src/app/domain/language';
import {Router} from "@angular/router";
import {CodeEditorType} from "../../../../domain/code-editor.type";
import {RobotWiredState} from "../../../../state/robot.wired.state";
import {MatSnackBar} from "@angular/material/snack-bar";

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
        private robotWiredState: RobotWiredState,
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
        this.appState.setIsCodeEditorToggleRequested();
    }

    public onSaveWorkspaceAsClicked() {
        this.blocklyState.setWorkspaceStatus(WorkspaceStatus.SavingAs);
    }

    public onUploadClicked() {
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
        else if (this.appState.getCurrentEditor() == CodeEditorType.Advanced)
            this.router.navigate(['/cppEditor'], { skipLocationChange: true });
        else if (this.appState.getCurrentEditor() == CodeEditorType.Python)
            this.router.navigate(['/pythonEditor'], { skipLocationChange: true });
    }
}


