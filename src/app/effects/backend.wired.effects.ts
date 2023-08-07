import {Injectable, NgZone} from '@angular/core';
import {BlocklyEditorState} from '../state/blockly-editor.state';
import {filter, withLatestFrom} from 'rxjs/operators';
import {BackEndState} from '../state/backend.state';
//import { IpcRenderer } from 'electron';
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
import {UploadService} from "../services/upload.service";

declare var Blockly: any;

@Injectable({
  providedIn: 'root',
})

// Defines the effects on the Electron environment that different state changes have
export class BackendWiredEffects {

  //private ipc: IpcRenderer | undefined;
  private upload: UploadService = new UploadService();

  constructor(private backEndState: BackEndState, private appState: AppState, private blocklyEditorState: BlocklyEditorState, private robotWiredState: RobotWiredState, private dialogState: DialogState, private zone: NgZone, private dialog: MatDialog) {
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
            // TODO: This is a hack to get around the fact that the Electron prompt doesn't work
            //electronPrompt
            //    ({
            //        title: 'Variable',
            //        label: msg,
            //        type: 'input',
            //        height: 180
            //    })
            //    .then(name => {
            //        callback(name);
            //    })
          }
        } catch (e) {
          console.log(e);
          throw e;
        }

        // If that worked, set the backend Connection status
        this.backEndState.setconnectionStatus(ConnectionStatus.ConnectedToBackend);

        // If the focus is set on an open window, relay to backend
        this.dialogState.isSerialOutputFocus$
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
            this.send('restore-workspace-code', appState.genericRobotType.id);
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
            const payload = {projectFilePath, data: code, extension: appState.genericRobotType.id};
            this.send('save-workspace-as', payload);
          });

        // When the workspace is being temporarily saved, relay the command to Electron
        this.blocklyEditorState.workspaceStatus$
          .pipe(filter(status => status === WorkspaceStatus.SavingTemp))
          .pipe(withLatestFrom(this.blocklyEditorState.workspaceXml$, this.appState.selectedRobotType$))
          .subscribe(([, workspaceXml, robotType]) => {
            const payload = {data: workspaceXml, extension: robotType.id};
            this.send('save-workspace-temp', payload);
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
        })
      case 'compile':
        console.log('compiling');
        const source_code = this.blocklyEditorState.code;
        const libraries = args[0].libs;
        const board = args[0].fqbn;

        // make a request to the backend to compile the code
        function makeRequest(source_code, board, libraries) {
            return new Promise((resolve, reject) => {
              const xhr = new XMLHttpRequest();
              xhr.open('POST', 'https://webservice.leaphyeasybloqs.com/compile/cpp', true);
              xhr.setRequestHeader('Content-Type', 'application/json');

              xhr.onload = () => {
                if (xhr.status === 200) {
                  resolve(xhr.response);
                } else {
                  reject(new Error('Request failed: ' + xhr.status));
                }
                xhr.abort();
              };

              xhr.onerror = () => {
                reject(new Error('Network error'));
              };

              xhr.responseType = 'json'; // Change the responseType to 'json'
              xhr.send(JSON.stringify({source_code, board, libraries}));
            });
        }

        try {
          const response = await makeRequest(source_code, board, libraries);
          const hex = response['hex']; // Extract the "hex" property from the response

          console.log('Success!', hex);
          if ('serial' in navigator) {
              // @ts-ignore
            await this.upload.upload(hex);
          } else {
            console.log('Web serial doesn\'t seem to be enabled in your browser. Try enabling it by visiting:');
            console.log('chrome://flags/#enable-experimental-web-platform-features');
          }

        } catch (error) {
          console.log('Error:', error.message);
        }

        break;
      default:
        console.log(channel);
    }
  }
}
