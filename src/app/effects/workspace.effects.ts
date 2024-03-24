import {Injectable} from '@angular/core';
import {BlocklyEditorState} from '../state/blockly-editor.state';
import {filter, withLatestFrom} from 'rxjs/operators';
import {BackEndState} from '../state/backend.state';
import {SketchStatus} from '../domain/sketch.status';
import {AppState} from '../state/app.state';
import {WorkspaceStatus} from '../domain/workspace.status';
import {CodeEditorType} from '../domain/code-editor.type';
import {MatDialog} from "@angular/material/dialog";
import {VariableDialog} from "../modules/core/dialogs/variable/variable.dialog";
import {UploadDialog} from "../modules/core/dialogs/upload/upload.dialog";
import {Router} from "@angular/router";
import {DebugInformationDialog} from "../modules/core/dialogs/debug-information/debug-information.dialog";
import * as Blockly from 'blockly/core';
import {ConnectPythonDialog} from "../modules/core/dialogs/connect-python/connect-python.dialog";
import {CodeEditorState} from "../state/code-editor.state";
import {PythonUploaderService} from "../services/python-uploader/PythonUploader.service";
import {WorkspaceService} from "../services/workspace.service";




@Injectable({
    providedIn: 'root',
})

// Defines the effects on the Electron environment that different state changes have
export class WorkspaceEffects {

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

                // When the sketch status is set to sending
                this.blocklyEditorState.sketchStatus$
                    .pipe(withLatestFrom(this.codeEditorState.code$, this.appState.selectedRobotType$))
                    .pipe(filter(([, , robotType,]) => !!robotType))
                    .subscribe(async ([status, code, robotType]) => {
                        switch (status) {
                            case SketchStatus.Sending:
                                const libraries = [...robotType.libs];
                                libraries.push(...codeEditorState.getInstalledLibraries().map(lib => `${lib.name}@${lib.version}`));
                                const board = robotType.fqbn;

                                try {
                                    if (this.appState.getCurrentEditor() == CodeEditorType.Python) {
                                        await this.uploaderService.runCode(code)
                                    } else {
                                        this.dialog.open(UploadDialog, {
                                            width: '450px', disableClose: true,
                                            data: {source_code: code, libraries: libraries, board: board}
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
                            case SketchStatus.ReadyToSend:
                                this.dialog.open(ConnectPythonDialog, {
                                    width: '600px', disableClose: true,
                                }).afterClosed().subscribe((result) => {
                                    if (result) {
                                        if (result == "HELP_ENVIRONMENT") {
                                            const langcode = this.appState.getCurrentLanguageCode();
                                            this.router.navigateByUrl('/' + langcode + '/driverissues', {skipLocationChange: true});
                                        }
                                    }
                                });
                                break;
                            default:
                                break;
                        }
                    });

                // When a workspace project is being loaded
                this.blocklyEditorState.workspaceStatus$
                    .pipe(withLatestFrom(this.appState.codeEditor$))
                    .pipe(filter(([status]) => status === WorkspaceStatus.Finding))
                    .subscribe(([,]) => {
                        workspaceService.restoreWorkspace();
                    });

                // When the workspace is being saved as a new project
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

                // When the workspace is being temporarily saved
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
            });
    }
}
