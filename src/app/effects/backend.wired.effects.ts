import { Injectable } from '@angular/core';
import { BlocklyEditorState } from '../state/blockly-editor.state';
import { filter, withLatestFrom } from 'rxjs/operators';
import { BackEndState } from '../state/backend.state';
import { SketchStatus } from '../domain/sketch.status';
import { AppState } from '../state/app.state';
import { WorkspaceStatus } from '../domain/workspace.status';
import { CodeEditorType } from '../domain/code-editor.type';
import { NameFileDialog } from "../modules/core/dialogs/name-file/name-file.dialog";
import { MatDialog } from "@angular/material/dialog";
import { VariableDialog } from "../modules/core/dialogs/variable/variable.dialog";
import { UploadDialog } from "../modules/core/dialogs/upload/upload.dialog";
import { Router } from "@angular/router";
import { DebugInformationDialog } from "../modules/core/dialogs/debug-information/debug-information.dialog";
import * as Blockly from 'blockly/core';
import {ConnectPythonDialog} from "../modules/core/dialogs/connect-python/connect-python.dialog";
import {FileExplorerDialog} from "../modules/core/dialogs/file-explorer/file-explorer.dialog";
import {CodeEditorState} from "../state/code-editor.state";
import {PythonUploaderService} from "../services/python-uploader/PythonUploader.service";


const fileExtensions = [
    ".l_flitz_uno",
    ".l_flitz_nano",
    ".l_original_uno",
    ".l_click",
    ".l_uno",
    ".l_nano",
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
					.pipe(withLatestFrom(this.blocklyEditorState.code$, this.appState.selectedRobotType$))
					.pipe(filter(([, , robotType,]) => !!robotType && !!robotType.isWired))
					.subscribe(([status, code, robotType]) => {
						switch (status) {
							case SketchStatus.Sending:
                                const libraries = [...robotType.libs];
                                libraries.push(...codeEditorState.getInstalledLibraries().map(lib => `${lib.name}@${lib.version}`));

								const payload = {
									code,
									fqbn: robotType.fqbn,
									ext: robotType.ext,
									core: robotType.core,
									name: robotType.name,
									board: robotType.board,
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
					.subscribe(() => {
						this.send('save-workspace-as');
					});

				// When the workspace is being temporarily saved, relay the command to Electron
				this.blocklyEditorState.workspaceStatus$
					.pipe(filter(status => status === WorkspaceStatus.SavingTemp))
					.pipe(withLatestFrom(this.blocklyEditorState.workspaceXml$, this.appState.selectedRobotType$))
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
					.subscribe(() => this.send('open-browser-page', "https://discord.com/invite/Yeg7Kkrq5W"));

				// When the user clicks to view the log, relay to backend to open the file in default text editor
				this.backEndState.isViewLogClicked$
					.pipe(filter(isClicked => !!isClicked))
					.subscribe(() => this.send('open-log-file'));
			});
	}


	public async send(channel: string, ...args): Promise<void> {
		switch (channel) {
			case 'save-workspace-as':
				const fileNamesDialogRef = this.dialog.open(NameFileDialog, {
					width: '450px', disableClose: true,
				});

				fileNamesDialogRef.afterClosed().subscribe((name: string) => {
					if (name == null)
						return
					if (this.appState.getCurrentEditor() == CodeEditorType.Beginner) {
						const data = this.blocklyEditorState.workspaceXml;
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
                        const data = this.codeEditorState.getCode();
                        const blob = new Blob([data], { type: 'text/plain' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = name + '.py';

                        a.click();
                        window.URL.revokeObjectURL(url);
                        // delete a after it is clicked
                        a.remove();
                    }
				})
				break;
			case 'compile':
				const source_code = (this.appState.getCurrentEditor() == CodeEditorType.Beginner) ? this.blocklyEditorState.code : this.codeEditorState.getCode();
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
					width: '450px', disableClose: false,
				});
				break;
			case 'restore-workspace':
                const input = document.createElement('input');
                input.type = 'file';
				// add a list of extensions to accept
				input.accept = fileExtensions.join(',');

				input.onchange = e => {
					// @ts-ignore
                    const file = e.target.files[0];

                    const reader = new FileReader();
                    reader.readAsText(file, 'UTF-8');

					reader.onload = readerEvent => {
						const data = readerEvent.target.result; // this is the content!
						if (!fileExtensions.includes(file.name.substring(file.name.lastIndexOf('.'))))
							return;

						if (file.name.endsWith('.ino')) {
                            this.backEndState.setBackendMessage({
                                event: 'WORKSPACE_RESTORING',
                                message: 'WORKSPACE_RESTORING',
                                payload: {projectFilePath: file.path, data, type: 'advanced'},
                                displayTimeout: 2000
                            });
                        } else if (file.name.endsWith('.py')) {
                            this.backEndState.setBackendMessage({
                                event: 'WORKSPACE_RESTORING',
                                message: 'WORKSPACE_RESTORING',
                                payload: { projectFilePath: file.path, data, type: 'python' },
                                displayTimeout: 2000
                            });
						} else {
							this.backEndState.setBackendMessage({
								event: 'WORKSPACE_RESTORING',
								message: 'WORKSPACE_RESTORING',
								payload: { projectFilePath: file.path, data, type: 'beginner', extension: file.name.substring(file.name.lastIndexOf('.')) },
								displayTimeout: 2000
							});
						}
					}

				}

				input.click();

				break;
			case 'open-browser-page':
				const url = args[0];
				window.open(url, '_blank').focus();
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
				if (type == 'beginner' && this.appState.getCurrentEditor() == CodeEditorType.Beginner) {
					if (robotType != this.appState.getSelectedRobotType().id) {
						return;
					}
					try {
						this.blocklyState.setWorkspaceXml(workspaceTemp);
						this.blocklyState.setProjectFilePath('');
						this.blocklyState.setWorkspaceStatus(WorkspaceStatus.Restoring);
					} catch (error) {
						console.log('Error:', error.message);
					}
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
				break;
			case 'restore-workspace-code':
				if (this.appState.getCurrentEditor() == CodeEditorType.Python) {
					this.dialog.open(FileExplorerDialog, {
                        width: '75vw', disableClose: true,
                    }).afterClosed().subscribe((result) => {
                        if (result) {
                            console.log(this.codeEditorState.getAceEditor());
                            console.log(this.codeEditorState.getAceEditor().session);
                            this.codeEditorState.getAceEditor().session.setValue(result);
                            this.codeEditorState.setOriginalCode(result);
                            this.codeEditorState.setCode(result);
                            console.log("result: " + result);
                        }
                    });
				}
				break;
			default:
				console.log(channel);
				break;
		}
	}
}
