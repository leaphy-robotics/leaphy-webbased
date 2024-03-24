import { Injectable } from '@angular/core';
import {CodeEditorType} from "../domain/code-editor.type";
import {LocationSelectDialog} from "../modules/core/dialogs/location-select/location-select.dialog";
import {NameFileDialog} from "../modules/core/dialogs/name-file/name-file.dialog";
import {MatDialog} from "@angular/material/dialog";
import {genericRobotType} from "../domain/robot.type";
import {BlocklyEditorState} from "../state/blockly-editor.state";
import {CodeEditorState} from "../state/code-editor.state";
import {RobotWiredState} from "../state/robot.wired.state";
import {AppState} from "../state/app.state";
import {PythonUploaderService} from "./python-uploader/PythonUploader.service";
import {PythonFile} from "../domain/python-file.type";
import {FileExplorerDialog} from "../modules/core/dialogs/file-explorer/file-explorer.dialog";
import {WorkspaceStatus} from "../domain/workspace.status";
import {StatusMessageDialog} from "../modules/core/dialogs/status-message/status-message.dialog";
import {MatSnackBar} from "@angular/material/snack-bar";

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
    providedIn: 'root'
})
export class WorkspaceService {



    constructor(private dialog: MatDialog,
                private appState: AppState,
                private blocklyEditorState: BlocklyEditorState,
                private codeEditorState: CodeEditorState,
                private robotWiredState: RobotWiredState,
                private uploaderService: PythonUploaderService,
                private blocklyState: BlocklyEditorState,
                private snackBar: MatSnackBar
    ) {}

    /*
    * Centralized to restore workspace from data
     */
    public async restoreWorkspaceFromMessage(message: any) {
        this.snackBar.openFromComponent(StatusMessageDialog, {
            duration: message.displayTimeout,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
            data: {message: 'WORKSPACE_RESTORING'}
        })
        if (message.payload.type == 'advanced' || message.payload.type == 'python') {
            this.codeEditorState.getAceEditor().session.setValue(message.payload.data as string);
            this.codeEditorState.setOriginalCode(message.payload.data as string);
            this.codeEditorState.setCode(message.payload.data as string);
            if (message.payload.type == 'advanced') {
                this.appState.setSelectedCodeEditor(CodeEditorType.CPP);
            } else if (message.payload.type == 'python') {
                this.appState.setSelectedCodeEditor(CodeEditorType.Python);
            }
            this.blocklyState.setProjectFileHandle(message.payload.projectFilePath);
            this.blocklyState.setWorkspaceStatus(WorkspaceStatus.Restoring);
            this.appState.setSelectedRobotType(genericRobotType, true);
            return;
        }
        this.appState.setSelectedRobotType(AppState.idToRobotType[message.payload.extension.replace('.', '')], true);
        this.blocklyState.setWorkspaceJSON(message.payload.data as string);
        this.blocklyState.setProjectFileHandle(message.payload.projectFilePath);
        this.blocklyState.setWorkspaceStatus(WorkspaceStatus.Restoring);
    }

    /*
    * Save workspace section
     */

    /*
    * Save workspace to a specific file
    * @param robotExtension: The extension of the file
     */
    public async saveWorkspaceAs(robotExtension: string)
    {
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
                a.download = name + '.' + robotExtension;

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
    }

    /*
    * Save the workspace to the file system
     */
    public async saveWorkspace()
    {
        if (this.blocklyState.getProjectFileHandle()) {
            console.log(this.blocklyState.getProjectFileHandle());
            const file = this.blocklyState.getProjectFileHandle();
            if (file instanceof PythonFile) {
                await this.uploaderService.runFileSystemCommand('put', file.path, this.codeEditorState.getCode());
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
            await this.saveWorkspaceAs(this.appState.getSelectedRobotType().id);
        }
    }

    public async saveWorkspaceTemp(data) {
        sessionStorage.setItem('workspace', data);
        sessionStorage.setItem('robotType', this.appState.getSelectedRobotType().id);
        if (this.appState.getCurrentEditor() == CodeEditorType.Beginner) {
            sessionStorage.setItem('type', 'beginner');
        } else if (this.appState.getCurrentEditor() == CodeEditorType.CPP) {
            sessionStorage.setItem('type', 'advanced');
        } else if (this.appState.getCurrentEditor() == CodeEditorType.Python) {
            sessionStorage.setItem('type', 'python');
        }
    }

    /*
    * Restore workspace section
     */

    /*
    * Restore the workspace from a file
     */
    public async restoreWorkspace() {
        if (this.appState.getCurrentEditor() == CodeEditorType.Python) {
            const result = await this.dialog.open(LocationSelectDialog, {
                width: '75vw', disableClose: true,
                data: {options: ["THIS_COMPUTER", "MICROCONTROLLER"]}
            }).afterClosed().toPromise();

            if (result) {
                if (result == "Robot") {
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
            this.restoreWorkspaceFromMessage({
                payload: {projectFilePath: file, data: content, type: 'advanced'},
                displayTimeout: 2000
            });
        } else if (file.name.endsWith('.py')) {
            this.restoreWorkspaceFromMessage({
                payload: { projectFilePath: file, data: content, type: 'python' },
                displayTimeout: 2000
            })
        } else {
            this.restoreWorkspaceFromMessage({
                payload: {projectFilePath: file, data: content, type: 'beginner', extension: file.name.substring(file.name.lastIndexOf('.'))},
                displayTimeout: 2000
            })
        }
    }

    /*
    * Restore the workspace from the session storage
     */
    public async restoreWorkspaceTemp() {
        const workspaceTemp = sessionStorage.getItem('workspace');
        const robotType = sessionStorage.getItem('robotType');
        const type = sessionStorage.getItem('type');
        this.blocklyState.setProjectFileHandle(null);
        if (type == 'beginner' && this.appState.getCurrentEditor() == CodeEditorType.Beginner) {
            if (robotType != this.appState.getSelectedRobotType().id) {
                return;
            }
            this.restoreWorkspaceFromMessage({
                payload: {projectFilePath: null, data: workspaceTemp, type: 'beginner', extension: robotType},
                displayTimeout: 1000
            })
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
    }
}
