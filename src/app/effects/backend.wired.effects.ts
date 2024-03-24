import {Injectable} from '@angular/core';
import {BlocklyEditorState} from '../state/blockly-editor.state';
import {filter, withLatestFrom} from 'rxjs/operators';
import {BackEndState} from '../state/backend.state';
import {SketchStatus} from '../domain/sketch.status';
import {AppState} from '../state/app.state';
import {WorkspaceStatus} from '../domain/workspace.status';
import {CodeEditorType} from '../domain/code-editor.type';
import {NameFileDialog} from "../modules/core/dialogs/name-file/name-file.dialog";
import {MatDialog} from "@angular/material/dialog";
import {VariableDialog} from "../modules/core/dialogs/variable/variable.dialog";
import {UploadDialog} from "../modules/core/dialogs/upload/upload.dialog";
import {Router} from "@angular/router";
import {DebugInformationDialog} from "../modules/core/dialogs/debug-information/debug-information.dialog";
import * as Blockly from 'blockly/core';
import {ConnectPythonDialog} from "../modules/core/dialogs/connect-python/connect-python.dialog";
import {FileExplorerDialog} from "../modules/core/dialogs/file-explorer/file-explorer.dialog";
import {CodeEditorState} from "../state/code-editor.state";
import {PythonUploaderService} from "../services/python-uploader/PythonUploader.service";
import {LocationSelectDialog} from "../modules/core/dialogs/location-select/location-select.dialog";
import {PythonFile} from "../domain/python-file.type";
import {RobotWiredState} from "../state/robot.wired.state";


const fileExtensions = [
    ".l_flitz_uno",
    ".l_flitz_nano",
    ".l_original_uno",
    ".l_original_nano",
    ".l_original_nano_esp32",
    ".l_original_nano_rp2040",
    ".l_click",
    ".l_uno",
    ".l_nano",
    ".l_nano_esp32",
    ".l_nano_rp2040",
    ".l_mega",
    ".l_wifi",
    ".ino",
    ".py",
]

@Injectable({
    providedIn: 'root',
})

// Defines the effects on the Electron environment that different state changes have
export class BackendWiredEffects {

    constructor(
        private blocklyState: BlocklyEditorState,
        private router: Router,
        private backEndState: BackEndState,
        private appState: AppState,
        private blocklyEditorState: BlocklyEditorState,
        private dialog: MatDialog,
        private codeEditorState: CodeEditorState,
        private uploaderService: PythonUploaderService,
        private robotWiredState: RobotWiredState,
        private uploadService: PythonUploaderService
    ) {
        // Only set up these effects when we're in Desktop mode
        this.appState.isDesktop$
            .pipe(filter(isDesktop => !!isDesktop))
            .subscribe(() => {
                try {
                    Blockly.dialog.setPrompt((msg, defaultValue, callback) => {
                        this.dialog.open(VariableDialog, {
                            width: '400px',
                            data: { name: defaultValue }
                        }).afterClosed().subscribe(result => {
                            callback(result);
                        });
                    });
                } catch (e) {
                    console.log(e);
                    throw e;
                }

                // When the sketch status is set to sending, send a compile request to backend
                this.blocklyEditorState.sketchStatus$
                    .pipe(withLatestFrom(this.codeEditorState.code$, this.appState.selectedRobotType$))
                    .pipe(filter(([, , robotType,]) => !!robotType))
                    .subscribe(([status, code, robotType]) => {
                        switch (status) {
                            case SketchStatus.Sending:
                                const libraries = [...robotType.libs];
                                libraries.push(...codeEditorState.getInstalledLibraries().map(lib => `${lib.name}@${lib.version}`));

                                const payload = {
                                    code,
                                    fqbn: robotType.fqbn,
                                    core: robotType.core,
                                    name: robotType.name,
                                    libs: libraries
                                };
                                this.send('compile', payload);
                                break;
                            case SketchStatus.ReadyToSend:
                                this.dialog.open(ConnectPythonDialog, {
                                    width: '600px', disableClose: true,
                                }).afterClosed().subscribe((result) => {
                                    if (result) {
                                        if (result == "HELP_ENVIRONMENT") {
                                            const langcode = this.appState.getCurrentLanguageCode();
                                            this.router.navigateByUrl('/' + langcode + '/driverissues', { skipLocationChange: true });
                                        }
                                    }
                                });
                                break;
                            default:
                                break;
                        }
                    });

                // When a workspace project is being loaded, relay the command to Electron
                this.blocklyEditorState.workspaceStatus$
                    .pipe(withLatestFrom(this.appState.codeEditor$))
                    .pipe(filter(([status]) => status === WorkspaceStatus.Finding))
                    .pipe(withLatestFrom(this.appState.selectedRobotType$))
                    .subscribe(([, robotType]) => {
                        this.send('restore-workspace', robotType.id);
                    });

                // When the workspace is being saved as a new project, relay the command to Electron
                this.blocklyEditorState.workspaceStatus$
                    .pipe(withLatestFrom(this.appState.codeEditor$))
                    .pipe(filter(([status]) => status === WorkspaceStatus.SavingAs))
                    .pipe(withLatestFrom(this.appState.selectedRobotType$))
                    .subscribe(([, robotType]) => {
                        this.send('save-workspace-as', { extension: robotType.id });
                    });

                this.blocklyEditorState.workspaceStatus$
                    .pipe(withLatestFrom(this.appState.codeEditor$))
                    .pipe(filter(([status]) => status === WorkspaceStatus.Saving))
                    .subscribe(() => {
                        this.send('save-workspace');
                    });

                // When the workspace is being temporarily saved, relay the command to Electron
                this.blocklyEditorState.workspaceStatus$
                    .pipe(filter(status => status === WorkspaceStatus.SavingTemp))
                    .pipe(withLatestFrom(this.blocklyEditorState.workspaceJSON$, this.appState.selectedRobotType$))
                    .subscribe(([, workspaceXml, robotType]) => {
                        if (CodeEditorType.CPP == this.appState.getCurrentEditor() || CodeEditorType.Python == this.appState.getCurrentEditor()) {
                            this.send('save-workspace-temp', { data: workspaceXml, extension: robotType.id, type: 'advanced' });
                        } else {
                            this.send('save-workspace-temp', { data: workspaceXml, extension: robotType.id });
                        }

                    });

                // When the user clicks help, open the default OS browser with the leaphy Forum
                this.appState.showHelpPage$
                    .pipe(filter(show => !!show))
                    .subscribe(() => window.open("https://discord.com/invite/Yeg7Kkrq5W", '_blank').focus());
                // When the user clicks to view the log, relay to backend to open the file in default text editor
                this.backEndState.isViewLogClicked$
                    .pipe(filter(isClicked => !!isClicked))
                    .subscribe(() => this.send('open-log-file'));
            });
    }


    public async send(channel: string, ...args): Promise<void> {
        switch (channel) {
            case 'save-workspace-as':
                let onPythonRobot = false;
                if (this.appState.getCurrentEditor() == CodeEditorType.Python) {
                    const result = await this.dialog.open(LocationSelectDialog, {
                        width: '75vw', disableClose: true,
                        data: {options: ["THIS_COMPUTER", "MICROCONTROLLER"]}
                    }).afterClosed().toPromise();

                    if (result) {
                        if (result == "Robot") {
                            onPythonRobot = true;
                        }
                    }
                }

                const fileNamesDialogRef = this.dialog.open(NameFileDialog, {
                    width: '450px', disableClose: true,
                });

                fileNamesDialogRef.afterClosed().subscribe((name: string) => {
                    if (name == null)
                        return
                    if (this.appState.getCurrentEditor() == CodeEditorType.Beginner) {
                        const data = this.blocklyEditorState.workspaceJSON;
                        const blob = new Blob([data], { type: 'text/plain' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = name + '.' + args[0].extension;

                        a.click();
                        window.URL.revokeObjectURL(url);
                        a.remove();
                    } else if (this.appState.getCurrentEditor() == CodeEditorType.CPP) {
                        const data = this.codeEditorState.getCode();
                        const blob = new Blob([data], { type: 'text/plain' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = name + '.ino';

                        a.click();
                        window.URL.revokeObjectURL(url);
                        // delete a after it is clicked
                        a.remove();
                    } else if (this.appState.getCurrentEditor() == CodeEditorType.Python) {
                        if (onPythonRobot) {
                            if (!this.robotWiredState.getSerialPort()) {
                                this.uploaderService.connect().then(() => {
                                    this.uploaderService.runFileSystemCommand('put', name + '.py', this.codeEditorState.getCode());
                                });
                            } else {
                                this.uploaderService.runFileSystemCommand('put', name + '.py', this.codeEditorState.getCode());
                            }
                        } else {
                            const data = this.codeEditorState.getCode();
                            const blob = new Blob([data], {type: 'text/plain'});
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = name + '.py';

                            a.click();
                            window.URL.revokeObjectURL(url);
                            // delete a after it is clicked
                            a.remove();
                        }
                    }
                })
                break;
            case 'compile':
                const source_code = this.codeEditorState.getCode();
                const libraries = args[0].libs;
                const board = args[0].fqbn;

                try {
                    if (this.appState.getCurrentEditor() == CodeEditorType.Python) {
                        await this.uploaderService.runCode(source_code)
                    } else {
                        this.dialog.open(UploadDialog, {
                            width: '450px', disableClose: true,
                            data: {source_code: source_code, libraries: libraries, board: board}
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

                break;
            case 'open-log-file':
                // Open a module to view the log file so .op
                this.dialog.open(DebugInformationDialog, {
                    disableClose: false,
                });
                break;
            case 'restore-workspace':
                if (this.appState.getCurrentEditor() == CodeEditorType.Python) {
                    const result = await this.dialog.open(LocationSelectDialog, {
                        width: '75vw', disableClose: true,
                        data: {options: ["THIS_COMPUTER", "MICROCONTROLLER"]}
                    }).afterClosed().toPromise();

                    if (result) {
                        if (result == "Robot") {
                            this.send('restore-workspace-code');
                            return;
                        }
                    }
                }
                // @ts-ignore
                const response = await window.showOpenFilePicker();
                const file: FileSystemFileHandle = await response[0];
                let content : any = await file.getFile();
                content = await content.text();

                if (!fileExtensions.includes(file.name.substring(file.name.lastIndexOf('.'))))
                    return;

                if (file.name.endsWith('.ino')) {
                    this.backEndState.setBackendMessage({
                        event: 'WORKSPACE_RESTORING',
                        message: 'WORKSPACE_RESTORING',
                        payload: {projectFilePath: file, data: content, type: 'advanced'},
                        displayTimeout: 2000
                    });
                } else if (file.name.endsWith('.py')) {
                    this.backEndState.setBackendMessage({
                        event: 'WORKSPACE_RESTORING',
                        message: 'WORKSPACE_RESTORING',
                        payload: { projectFilePath: file, data: content, type: 'python' },
                        displayTimeout: 2000
                    });
                } else {
                    this.backEndState.setBackendMessage({
                        event: 'WORKSPACE_RESTORING',
                        message: 'WORKSPACE_RESTORING',
                        payload: { projectFilePath: file, data: content, type: 'beginner', extension: file.name.substring(file.name.lastIndexOf('.')) },
                        displayTimeout: 2000
                    });
                }

                break;
            case 'save-workspace-temp':
                const data = args[0].data;
                sessionStorage.setItem('workspace', data);
                sessionStorage.setItem('robotType', this.appState.getSelectedRobotType().id);
                if (this.appState.getCurrentEditor() == CodeEditorType.Beginner) {
                    sessionStorage.setItem('type', 'beginner');
                } else if (this.appState.getCurrentEditor() == CodeEditorType.CPP) {
                    sessionStorage.setItem('type', 'advanced');
                } else if (this.appState.getCurrentEditor() == CodeEditorType.Python) {
                    sessionStorage.setItem('type', 'python');
                }
                break;
            case 'restore-workspace-temp':
                const workspaceTemp = sessionStorage.getItem('workspace');
                const robotType = sessionStorage.getItem('robotType');
                const type = sessionStorage.getItem('type');
                this.blocklyState.setProjectFileHandle(null);
                if (type == 'beginner' && this.appState.getCurrentEditor() == CodeEditorType.Beginner) {
                    if (robotType != this.appState.getSelectedRobotType().id) {
                        return;
                    }
                    this.backEndState.setBackendMessage({
                        event: 'WORKSPACE_RESTORING',
                        message: 'WORKSPACE_RESTORING',
                        payload: { projectFilePath: null, data: workspaceTemp, type: 'beginner', extension: robotType },
                        displayTimeout: 1000
                    });
                } else if (type == 'advanced' && this.appState.getCurrentEditor() == CodeEditorType.CPP) {
                    try {
                        this.codeEditorState.getAceEditor().session.setValue(workspaceTemp);
                        this.codeEditorState.setOriginalCode(workspaceTemp);
                        this.codeEditorState.setCode(workspaceTemp);
                    } catch (error) {
                        console.log('Error:', error.message);
                    }
                } else if (type == 'python' && this.appState.getCurrentEditor() == CodeEditorType.Python) {
                    try {
                        this.codeEditorState.getAceEditor().session.setValue(workspaceTemp);
                        this.codeEditorState.setOriginalCode(workspaceTemp);
                        this.codeEditorState.setCode(workspaceTemp);
                    } catch (error) {
                        console.log('Error:', error.message);
                    }
                }

                // remove the entries from session storage
                sessionStorage.removeItem('workspace');
                sessionStorage.removeItem('robotType');
                sessionStorage.removeItem('type');

                break;
            case 'restore-workspace-code':
                if (this.appState.getCurrentEditor() == CodeEditorType.Python) {
                    this.dialog.open(FileExplorerDialog, {
                        width: '75vw', disableClose: true,
                    }).afterClosed().subscribe(async (fileName) =>  {
                        if (fileName) {
                            const content = await this.uploaderService.runFileSystemCommand('get', fileName);
                            this.codeEditorState.getAceEditor().session.setValue(content);
                            this.codeEditorState.setOriginalCode(content);
                            this.codeEditorState.setCode(content);
                            this.blocklyState.setProjectFileHandle(new PythonFile(fileName));
                        }
                    });
                }
                break;
            case 'save-workspace':
                if (this.blocklyState.getProjectFileHandle()) {
                    console.log(this.blocklyState.getProjectFileHandle());
                    const file = this.blocklyState.getProjectFileHandle();
                    if (file instanceof PythonFile) {
                        await this.uploadService.runFileSystemCommand('put', file.path, this.codeEditorState.getCode());
                        return;
                    }
                    const writable = await file.createWritable();
                    if (this.appState.getCurrentEditor() == CodeEditorType.Beginner) {
                        await writable.write({type: 'write', data: this.blocklyState.workspaceJSON, position: 0});
                    } else {
                        await writable.write({type: 'write', data: this.codeEditorState.getCode(), position: 0});
                    }
                    await writable.close();
                } else {
                    await this.send('save-workspace-as', { extension: this.appState.getSelectedRobotType().id });
                }
                break;
            default:
                console.log(channel);
                break;
        }
    }
}
