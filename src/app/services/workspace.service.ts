import { Injectable } from "@angular/core";
import { CodeEditorType } from "../domain/code-editor.type";
import { LocationSelectDialog } from "../modules/core/dialogs/location-select/location-select.dialog";
import { NameFileDialog } from "../modules/core/dialogs/name-file/name-file.dialog";
import { MatDialog } from "@angular/material/dialog";
import { genericRobotType } from "../domain/robots";
import { BlocklyEditorState } from "../state/blockly-editor.state";
import { CodeEditorState } from "../state/code-editor.state";
import { RobotWiredState } from "../state/robot.wired.state";
import { AppState } from "../state/app.state";
import { PythonUploaderService } from "./python-uploader/PythonUploader.service";
import { PythonFile } from "../domain/python-file.type";
import { FileExplorerDialog } from "../modules/core/dialogs/file-explorer/file-explorer.dialog";
import { StatusMessageDialog } from "../modules/core/dialogs/status-message/status-message.dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import * as Blockly from "blockly/core";
import { firstValueFrom } from "rxjs";
import { ConfirmEditorDialog } from "../modules/core/dialogs/confirm-editor/confirm-editor.dialog";

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
];

function isJSON(data: string) {
    try {
        JSON.parse(data);
        return true;
    } catch (e) {
        return false;
    }
}

@Injectable({
    providedIn: "root",
})
export class WorkspaceService {
    constructor(
        private dialog: MatDialog,
        private appState: AppState,
        private codeEditorState: CodeEditorState,
        private robotWiredState: RobotWiredState,
        private uploaderService: PythonUploaderService,
        private blocklyState: BlocklyEditorState,
        private snackBar: MatSnackBar,
    ) {}

    /*
     * Centralized to restore workspace from data
     */
    public async restoreWorkspaceFromMessage(message: any) {
        this.snackBar.openFromComponent(StatusMessageDialog, {
            duration: message.displayTimeout,
            horizontalPosition: "center",
            verticalPosition: "bottom",
            data: { message: "WORKSPACE_RESTORING" },
        });
        if (
            message.payload.type == "advanced" ||
            message.payload.type == "python"
        ) {
            this.codeEditorState.code = message.payload.data as string;
            if (message.payload.type == "advanced") {
                this.appState.selectedCodeEditor = CodeEditorType.CPP;
            } else if (message.payload.type == "python") {
                this.appState.selectedCodeEditor = CodeEditorType.Python;
            }
            this.blocklyState.projectFileHandle =
                message.payload.projectFilePath;
            await this.loadWorkspace();
            this.appState.setSelectedRobotType(genericRobotType, true);
            return;
        }
        this.appState.setSelectedRobotType(
            AppState.idToRobotType[message.payload.extension.replace(".", "")],
            true,
        );
        this.blocklyState.workspaceJSON = message.payload.data as string;
        this.blocklyState.projectFileHandle = message.payload.projectFilePath;
        await this.loadWorkspace();
    }

    public async switchCodeEditor() {
        const editor = this.appState.currentEditor;
        if (!this.codeEditorState.saveState && editor === CodeEditorType.CPP) {
            const confirmed = await firstValueFrom(
                this.dialog
                    .open(ConfirmEditorDialog, {
                        width: "300px",
                    })
                    .afterClosed(),
            );
            if (!confirmed) return;
        }

        if (editor === CodeEditorType.Beginner) {
            this.appState.selectedCodeEditor = CodeEditorType.CPP;
            this.codeEditorState.saveState = false;
        } else {
            this.appState.selectedCodeEditor = CodeEditorType.Beginner;
            this.codeEditorState.saveState = true;
        }
    }

    /*
     * Save workspace section
     */

    /*
     * Save workspace to a specific file
     * @param robotExtension: The extension of the file
     */
    public async saveWorkspaceAs(robotExtension: string) {
        let onPythonRobot = false;
        if (this.appState.currentEditor == CodeEditorType.Python) {
            const result = await this.dialog
                .open(LocationSelectDialog, {
                    width: "75vw",
                    disableClose: true,
                    data: { options: ["THIS_COMPUTER", "MICROCONTROLLER"] },
                })
                .afterClosed()
                .toPromise();

            if (result) {
                if (result == "Robot") {
                    onPythonRobot = true;
                }
            }
        }

        const fileNamesDialogRef = this.dialog.open(NameFileDialog, {
            width: "450px",
            disableClose: true,
        });

        fileNamesDialogRef.afterClosed().subscribe((name: string) => {
            if (name == null) return;
            if (this.appState.currentEditor == CodeEditorType.Beginner) {
                const data = this.blocklyState.workspaceJSON;
                const blob = new Blob([data], { type: "text/plain" });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = name + "." + robotExtension;

                a.click();
                window.URL.revokeObjectURL(url);
                a.remove();
            } else if (this.appState.currentEditor == CodeEditorType.CPP) {
                const data = this.codeEditorState.code;
                const blob = new Blob([data], { type: "text/plain" });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = name + ".ino";

                a.click();
                window.URL.revokeObjectURL(url);
                // delete a after it is clicked
                a.remove();
            } else if (this.appState.currentEditor == CodeEditorType.Python) {
                if (onPythonRobot) {
                    if (!this.robotWiredState.serialPort) {
                        this.uploaderService.connect().then(() => {
                            this.uploaderService.runFileSystemCommand(
                                "put",
                                name + ".py",
                                this.codeEditorState.code,
                            );
                        });
                    } else {
                        this.uploaderService.runFileSystemCommand(
                            "put",
                            name + ".py",
                            this.codeEditorState.code,
                        );
                    }
                } else {
                    const data = this.codeEditorState.code;
                    const blob = new Blob([data], { type: "text/plain" });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = name + ".py";

                    a.click();
                    window.URL.revokeObjectURL(url);
                    // delete a after it is clicked
                    a.remove();
                }
            }

            this.codeEditorState.afterSave();
        });
    }

    /*
     * Save the workspace to the file system
     */
    public async saveWorkspace() {
        if (this.blocklyState.projectFileHandle) {
            console.log(this.blocklyState.projectFileHandle);
            const file = this.blocklyState.projectFileHandle;
            if (file instanceof PythonFile) {
                await this.uploaderService.runFileSystemCommand(
                    "put",
                    file.path,
                    this.codeEditorState.code,
                );
                return;
            }
            const writable = await file.createWritable();
            if (this.appState.currentEditor == CodeEditorType.Beginner) {
                await writable.write({
                    type: "write",
                    data: this.blocklyState.workspaceJSON,
                    position: 0,
                });
            } else {
                await writable.write({
                    type: "write",
                    data: this.codeEditorState.code,
                    position: 0,
                });
            }
            await writable.close();
        } else {
            await this.saveWorkspaceAs(this.appState.selectedRobotType.id);
        }

        this.codeEditorState.afterSave();
    }

    public async saveWorkspaceTemp(data) {
        sessionStorage.setItem("workspace", data);
        sessionStorage.setItem("robotType", this.appState.selectedRobotType.id);
        if (this.appState.currentEditor == CodeEditorType.Beginner) {
            sessionStorage.setItem("type", "beginner");
        } else if (this.appState.currentEditor == CodeEditorType.CPP) {
            sessionStorage.setItem("type", "advanced");
        } else if (this.appState.currentEditor == CodeEditorType.Python) {
            sessionStorage.setItem("type", "python");
        }
    }

    /*
     * Restore workspace section
     */

    /*
     * Restore the workspace from a file
     */
    public async restoreWorkspace() {
        if (this.appState.currentEditor == CodeEditorType.Python) {
            const result = await this.dialog
                .open(LocationSelectDialog, {
                    width: "75vw",
                    disableClose: true,
                    data: { options: ["THIS_COMPUTER", "MICROCONTROLLER"] },
                })
                .afterClosed()
                .toPromise();

            if (result) {
                if (result == "Robot") {
                    this.dialog
                        .open(FileExplorerDialog, {
                            width: "75vw",
                            disableClose: true,
                        })
                        .afterClosed()
                        .subscribe(async (fileName) => {
                            if (fileName) {
                                this.codeEditorState.code =
                                    await this.uploaderService.runFileSystemCommand(
                                        "get",
                                        fileName,
                                    );
                                this.blocklyState.projectFileHandle =
                                    new PythonFile(fileName);
                            }
                        });
                    return;
                }
            }
        }
        // @ts-ignore
        const response = await window.showOpenFilePicker();
        const file: FileSystemFileHandle = await response[0];
        let content: any = await file.getFile();
        content = await content.text();

        if (
            !fileExtensions.includes(
                file.name.substring(file.name.lastIndexOf(".")),
            )
        )
            return;

        if (file.name.endsWith(".ino")) {
            this.restoreWorkspaceFromMessage({
                payload: {
                    projectFilePath: file,
                    data: content,
                    type: "advanced",
                },
                displayTimeout: 2000,
            });
        } else if (file.name.endsWith(".py")) {
            this.restoreWorkspaceFromMessage({
                payload: {
                    projectFilePath: file,
                    data: content,
                    type: "python",
                },
                displayTimeout: 2000,
            });
        } else {
            this.restoreWorkspaceFromMessage({
                payload: {
                    projectFilePath: file,
                    data: content,
                    type: "beginner",
                    extension: file.name.substring(file.name.lastIndexOf(".")),
                },
                displayTimeout: 2000,
            });
        }
    }

    /*
     * Restore the workspace from the session storage
     */
    public async restoreWorkspaceTemp() {
        console.log("Restoring workspace from session storage");
        const workspaceTemp = sessionStorage.getItem("workspace");
        const robotType = sessionStorage.getItem("robotType");
        const type = sessionStorage.getItem("type");
        this.blocklyState.projectFileHandle = null;
        if (
            type == "beginner" &&
            this.appState.currentEditor == CodeEditorType.Beginner
        ) {
            if (robotType != this.appState.selectedRobotType.id) {
                return;
            }
            this.restoreWorkspaceFromMessage({
                payload: {
                    projectFilePath: null,
                    data: workspaceTemp,
                    type: "beginner",
                    extension: robotType,
                },
                displayTimeout: 1000,
            });
        } else if (
            (type == "advanced" &&
                this.appState.currentEditor == CodeEditorType.CPP) ||
            (type == "python" &&
                this.appState.currentEditor == CodeEditorType.Python)
        ) {
            try {
                this.codeEditorState.code = workspaceTemp;
            } catch (error) {
                console.log("Error:", error.message);
            }
        }

        // remove the entries from session storage
        sessionStorage.removeItem("workspace");
        sessionStorage.removeItem("robotType");
        sessionStorage.removeItem("type");
    }

    /*
     * Restore the workspace from the session storage without checking the current editor or the selected robot type
     */
    public async forceRestoreWorkspaceTemp() {
        // restore workspace from session storage but don't care about if we selected the same robot type or the current editor
        const workspaceTemp = sessionStorage.getItem("workspace");
        const robotType = sessionStorage.getItem("robotType");
        const type = sessionStorage.getItem("type");
        this.blocklyState.projectFileHandle = null;
        this.appState.setSelectedRobotType(
            AppState.idToRobotType[robotType],
            true,
        );
        if (type == "beginner") {
            this.appState.selectedCodeEditor = CodeEditorType.Beginner;
            this.restoreWorkspaceFromMessage({
                payload: {
                    projectFilePath: null,
                    data: workspaceTemp,
                    type: "beginner",
                    extension: robotType,
                },
                displayTimeout: 1000,
            });
        } else if (type == "advanced") {
            this.appState.selectedCodeEditor = CodeEditorType.CPP;
            try {
                this.codeEditorState.code = workspaceTemp;
            } catch (error) {
                console.log("Error:", error.message);
            }
        } else if (type == "python") {
            this.appState.selectedCodeEditor = CodeEditorType.Python;
            try {
                this.codeEditorState.code = workspaceTemp;
            } catch (error) {
                console.log("Error:", error.message);
            }
        }
    }

    /*
     * Load workspace
     */
    public async loadWorkspace() {
        const workspace = this.blocklyState.workspace;
        const workspaceXml = this.blocklyState.workspaceJSON;
        if (!workspace) return;
        if (!workspaceXml) return;
        workspace.clear();

        if (isJSON(workspaceXml))
            Blockly.serialization.workspaces.load(
                JSON.parse(workspaceXml),
                workspace,
            );
        else {
            const xml = Blockly.utils.xml.textToDom(workspaceXml);
            Blockly.Xml.domToWorkspace(xml, workspace);
        }
    }
}
