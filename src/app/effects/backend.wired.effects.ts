import {Injectable, NgZone} from '@angular/core';
import {BlocklyEditorState} from '../state/blockly-editor.state';
import {filter, withLatestFrom} from 'rxjs/operators';
import {BackEndState} from '../state/backend.state';
import {SketchStatus} from '../domain/sketch.status';
import {BackEndMessage} from '../domain/backend.message';
import {ConnectionStatus} from '../domain/connection.status';
import {AppState} from '../state/app.state';
import {RobotWiredState} from '../state/robot.wired.state';
import {WorkspaceStatus} from '../domain/workspace.status';
import {DialogState} from '../state/dialog.state';
import {CodeEditorType} from '../domain/code-editor.type';
import {NameFileDialog} from "../modules/core/dialogs/name-file/name-file.dialog";
import {MatDialog} from "@angular/material/dialog";
import {VariableDialog} from "../modules/core/dialogs/variable/variable.dialog";
import {UploadDialog} from "../modules/core/dialogs/upload/upload.dialog";
import {Router} from "@angular/router";
import {CodeEditorState} from "../state/code-editor.state";
import {DebugInformationDialog} from "../modules/core/dialogs/debug-information/debug-information.dialog";

declare var Blockly: any;

const fileExtensions = [
  ".l_flitz",
  ".l_original",
  ".l_click",
  ".l_uno",
  ".l_wifi",
  ".ino",
]

@Injectable({
  providedIn: 'root',
})

// Defines the effects on the Electron environment that different state changes have
export class BackendWiredEffects {

  constructor(private codeEditorState: CodeEditorState, private blocklyState: BlocklyEditorState, private router: Router, private backEndState: BackEndState, private appState: AppState, private blocklyEditorState: BlocklyEditorState, private robotWiredState: RobotWiredState, private dialogState: DialogState, private zone: NgZone, private dialog: MatDialog) {
    // Only set up these effects when we're in Desktop mode
    this.appState.isDesktop$
      .pipe(filter(isDesktop => !!isDesktop))
      .subscribe(() => {
        try {
          // Open communications to the Electron process
          //this.ipc = window.require('electron').ipcRenderer;
          // Replace the Prompt used by Blockly Variables with something that works in Electron
          //const electronPrompt = window.require('electron-prompt')
          Blockly.prompt = (msg, defaultValue, callback) => {
            this.dialog.open(VariableDialog, {
              width: '400px',
              data: {name: defaultValue}
            }).afterClosed().subscribe(result => {
              callback(result);
            });
          }
        } catch (e) {
          console.log(e);
          throw e;
        }

        // If that worked, set the backend Connection status
        this.backEndState.setconnectionStatus(ConnectionStatus.ConnectedToBackend);

        // If the focus is set on an open window, relay to backend
        this.dialogState.isSerialOutputListening$
          .pipe(withLatestFrom(this.dialogState.isSerialOutputWindowOpen$))
          .pipe(filter(([isFocus, isOpen]) => isFocus && isOpen))
          .subscribe(() => {
            this.send('focus-serial');
          });

        // Relay messages from Electron to the Backend State
        this.on('backend-message', (event: any, message: BackEndMessage) => {
          // This is needed to trigger UI refresh from IPC events
          this.zone.run(() => {
            this.backEndState.setBackendMessage(message);
          });
        });

        // When a reload is requested and we are done saving the temp workspace, relay to Electron backend
        this.blocklyEditorState.workspaceStatus$
          .pipe(filter(status => status === WorkspaceStatus.Clean), withLatestFrom(this.appState.isReloadRequested$))
          .pipe(filter(([, isRequested]) => !!isRequested))
          .subscribe(() => {
            this.send('restart-app');
          });

        // When the sketch status is set to sending, send a compile request to backend
        this.blocklyEditorState.sketchStatus$
          .pipe(withLatestFrom(this.blocklyEditorState.code$, this.appState.selectedRobotType$))
          .pipe(filter(([, , robotType,]) => !!robotType && !!robotType.isWired))
          .subscribe(([status, code, robotType]) => {
            switch (status) {
              case SketchStatus.Sending:
                const payload = {
                  code,
                  fqbn: robotType.fqbn,
                  ext: robotType.ext,
                  core: robotType.core,
                  name: robotType.name,
                  board: robotType.board,
                  libs: robotType.libs
                };
                this.send('compile', payload);
                break;
              default:
                break;
            }
          });

        // When a workspace project is being loaded, relay the command to Electron
        this.blocklyEditorState.workspaceStatus$
          .pipe(withLatestFrom(this.appState.codeEditorType$))
          .pipe(filter(([status, codeEditorType]) => status === WorkspaceStatus.Finding && codeEditorType === CodeEditorType.Beginner))
          .pipe(withLatestFrom(this.appState.selectedRobotType$))
          .subscribe(([, robotType]) => {
            this.send('restore-workspace', robotType.id);
          });

        // When a code project is being loaded, relay the command to Electron
        this.blocklyEditorState.workspaceStatus$
          .pipe(withLatestFrom(this.appState.codeEditorType$))
          .pipe(filter(([status, codeEditorType]) => status === WorkspaceStatus.Finding && codeEditorType === CodeEditorType.Advanced))
          .subscribe(() => {
            this.send('restore-workspace-code', AppState.genericRobotType.id);
          });

        // When the temp workspace is being loaded, relay the command to Electron
        this.blocklyEditorState.workspaceStatus$
          .pipe(filter(status => status === WorkspaceStatus.FindingTemp))
          .pipe(withLatestFrom(this.appState.selectedRobotType$))
          .subscribe(([, robotType]) => {
            this.send('restore-workspace-temp', robotType.id);
          });

        // When an existing project's workspace is being saved, relay the command to Electron
        this.blocklyEditorState.workspaceStatus$
          .pipe(withLatestFrom(this.appState.codeEditorType$))
          .pipe(filter(([status, codeEditorType]) => status === WorkspaceStatus.Saving && codeEditorType === CodeEditorType.Beginner))
          .pipe(withLatestFrom(this.blocklyEditorState.projectFilePath$, this.blocklyEditorState.workspaceXml$))
          .pipe(filter(([, projectFilePath,]) => !!projectFilePath))
          .subscribe(([, projectFilePath, workspaceXml,]) => {
            const payload = {projectFilePath, data: workspaceXml};
            this.send('save-workspace', payload);
          });

        // When an existing project's code is being saved, relay the command to Electron
        this.blocklyEditorState.workspaceStatus$
          .pipe(withLatestFrom(this.appState.codeEditorType$))
          .pipe(filter(([status, codeEditorType]) => status === WorkspaceStatus.Saving && codeEditorType === CodeEditorType.Advanced))
          .pipe(withLatestFrom(this.blocklyEditorState.projectFilePath$, this.blocklyEditorState.code$))
          .pipe(filter(([, projectFilePath,]) => !!projectFilePath))
          .subscribe(([, projectFilePath, code]) => {
            const payload = {projectFilePath, data: code};
            this.send('save-workspace', payload);
          });

        // When the workspace is being saved as a new project, relay the command to Electron
        this.blocklyEditorState.workspaceStatus$
          .pipe(withLatestFrom(this.appState.codeEditorType$))
          .pipe(filter(([status, codeEditorType]) => status === WorkspaceStatus.SavingAs && codeEditorType === CodeEditorType.Beginner))
          .pipe(withLatestFrom(this.blocklyEditorState.projectFilePath$, this.blocklyEditorState.workspaceXml$, this.appState.selectedRobotType$))
          .subscribe(([, projectFilePath, workspaceXml, robotType]) => {
            const payload = {projectFilePath, data: workspaceXml, extension: robotType.id};
            this.send('save-workspace-as', payload);
          });

        // When the code is being saved as a new project, relay the command to Electron
        this.blocklyEditorState.workspaceStatus$
          .pipe(withLatestFrom(this.appState.codeEditorType$))
          .pipe(filter(([status, codeEditorType]) => status === WorkspaceStatus.SavingAs && codeEditorType === CodeEditorType.Advanced))
          .pipe(withLatestFrom(this.blocklyEditorState.projectFilePath$, this.blocklyEditorState.code$))
          .subscribe(([, projectFilePath, code]) => {
            const payload = {projectFilePath, data: code, extension: AppState.genericRobotType.id};
            this.send('save-workspace-as', payload);
          });

        // When the workspace is being temporarily saved, relay the command to Electron
        this.blocklyEditorState.workspaceStatus$
          .pipe(filter(status => status === WorkspaceStatus.SavingTemp))
          .pipe(withLatestFrom(this.blocklyEditorState.workspaceXml$, this.appState.selectedRobotType$))
          .subscribe(([, workspaceXml, robotType]) => {
            if (CodeEditorType.Advanced == this.appState.getCurrentEditor()) {
              this.send('save-workspace-temp', {data: workspaceXml, extension: robotType.id, type: 'advanced'});
            } else {
              this.send('save-workspace-temp', {data: workspaceXml, extension: robotType.id});
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

  public on(channel: string, listener: (event: any, data: any) => void): void {
    //if (!this.ipc) {
    //    return;
    //}
    //this.ipc.on(channel, listener);
  }

  public async send(channel: string, ...args): Promise<void> {
    switch (channel) {
      case 'save-workspace-as':
        // make a popup asking for the file name
        const fileNamesDialogComponent = NameFileDialog;
        const fileNamesDialogRef = this.dialog.open(fileNamesDialogComponent, {
          width: '450px', disableClose: true,
        });

        fileNamesDialogRef.afterClosed().subscribe((name: string) => {
          if (this.appState.getCurrentEditor() == CodeEditorType.Beginner) {
            const data = this.blocklyEditorState.workspaceXml;
            const blob = new Blob([data], {type: 'text/plain'});
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = name + '.' + args[0].extension;

            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
          } else {
            const data = this.blocklyEditorState.code;
            const blob = new Blob([data], {type: 'text/plain'});
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = name + '.ino';

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
          this.dialog.open(UploadDialog, {
            width: '450px', disableClose: true,
            data: {source_code: source_code, libraries: libraries, board: board}
          }).afterClosed().subscribe((result) => {
            console.log(result);
            if (result) {
              if (result == "HELP_ENVIRONMENT") {
                const langcode = this.appState.getCurrentLanguageCode();
                console.log(langcode);
                this.router.navigateByUrl('/' + langcode + '/driverissues', { skipLocationChange: true });
              }
            }
          });


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
        var input = document.createElement('input');
        input.type = 'file';
        // add a list of extensions to accept
        input.accept = fileExtensions.join(',');

        input.onchange = e => {
          // @ts-ignore
          var file = e.target.files[0];

          var reader = new FileReader();
          reader.readAsText(file,'UTF-8');

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
            } else {
              this.backEndState.setBackendMessage({
                event: 'WORKSPACE_RESTORING',
                message: 'WORKSPACE_RESTORING',
                payload: {projectFilePath: file.path, data, type: 'beginner', extension: file.name.substring(file.name.lastIndexOf('.'))},
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
        } else {
          sessionStorage.setItem('type', 'advanced');
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
        } else if (type == 'advanced' && this.appState.getCurrentEditor() == CodeEditorType.Advanced) {
          try {
            this.codeEditorState.setCode(workspaceTemp);
            this.blocklyEditorState.setWorkspaceStatus(WorkspaceStatus.Restoring);
          } catch (error) {
            console.log('Error:', error.message);
          }
        }
        break;
      default:
        console.log(channel);
        break;
    }
  }


}
