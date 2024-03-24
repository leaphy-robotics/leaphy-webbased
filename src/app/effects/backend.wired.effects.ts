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
import {WorkspaceService} from "../services/workspace.service";




@Injectable({
    providedIn: 'root',
})

// Defines the effects on the Electron environment that different state changes have
export class BackendWiredEffects {

    constructor(
        private router: Router,
        private backEndState: BackEndState,
        private appState: AppState,
        private blocklyEditorState: BlocklyEditorState,
        private dialog: MatDialog,
        private codeEditorState: CodeEditorState,
        private uploaderService: PythonUploaderService,
        private workspaceService: WorkspaceService
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
                                this.send('upload', payload);
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
                        workspaceService.restoreWorkspace();
                    });

                // When the workspace is being saved as a new project, relay the command to Electron
                this.blocklyEditorState.workspaceStatus$
                    .pipe(withLatestFrom(this.appState.codeEditor$))
                    .pipe(filter(([status]) => status === WorkspaceStatus.SavingAs))
                    .pipe(withLatestFrom(this.appState.selectedRobotType$))
                    .subscribe(([, robotType]) => {
                        workspaceService.saveWorkspaceAs(robotType.id);
                    });

                this.blocklyEditorState.workspaceStatus$
                    .pipe(withLatestFrom(this.appState.codeEditor$))
                    .pipe(filter(([status]) => status === WorkspaceStatus.Saving))
                    .subscribe(() => {
                        workspaceService.saveWorkspace();
                    });

                // When the workspace is being temporarily saved, relay the command to Electron
                this.blocklyEditorState.workspaceStatus$
                    .pipe(filter(status => status === WorkspaceStatus.SavingTemp))
                    .pipe(withLatestFrom(this.blocklyEditorState.workspaceJSON$, this.appState.selectedRobotType$))
                    .subscribe(([, workspaceXml, robotType]) => {
                        if (CodeEditorType.CPP == this.appState.getCurrentEditor() || CodeEditorType.Python == this.appState.getCurrentEditor()) {
                            this.workspaceService.saveWorkspaceTemp(workspaceXml);
                        } else {
                            this.workspaceService.saveWorkspaceTemp(workspaceXml);
                        }
                    });

                // When the user clicks to view the log, relay to backend to open the file in default text editor
                this.backEndState.isViewLogClicked$
                    .pipe(filter(isClicked => !!isClicked))
                    .subscribe(() => {
                        this.dialog.open(DebugInformationDialog, {
                            disableClose: false,
                        });
                    });
            });
    }


    public async send(channel: string, ...args): Promise<void> {
        switch (channel) {
            case 'upload':
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
            default:
                console.log(channel);
                break;
        }
    }
}
