import { Component, HostListener } from "@angular/core";
import { AppState } from "src/app/state/app.state";
import { BlocklyEditorState } from "src/app/state/blockly-editor.state";
import { DialogState } from "src/app/state/dialog.state";
import { Language } from "src/app/domain/language";
import { Router } from "@angular/router";
import { CodeEditorType } from "../../../domain/code-editor.type";
import { RobotWiredState } from "../../../state/robot.wired.state";
import { MatSnackBar } from "@angular/material/snack-bar";
import JSZip from "jszip";
import {
    arduinoUnoRobotType,
    genericRobots,
    microPythonRobotType,
} from "../../../domain/robots";
import { DebugInformationDialog } from "../../core/dialogs/debug-information/debug-information.dialog";
import { MatDialog } from "@angular/material/dialog";
import { UploadDialog } from "../../core/dialogs/upload/upload.dialog";
import { CodeEditorState } from "../../../state/code-editor.state";
import { PythonUploaderService } from "../../../services/python-uploader/PythonUploader.service";
import { ConnectPythonDialog } from "../../core/dialogs/connect-python/connect-python.dialog";
import { StatusMessageDialog } from "../../core/dialogs/status-message/status-message.dialog";
import { WorkspaceService } from "../../../services/workspace.service";
import { MatSelectChange } from "@angular/material/select";
import { RobotType } from "../../../domain/robot.type";

@Component({
    selector: "app-header",
    templateUrl: "./header.component.html",
    styleUrls: ["./header.component.scss"],
})
export class HeaderComponent {
    selectedRobot: string = arduinoUnoRobotType.name;

    constructor(
        public appState: AppState,
        public blocklyState: BlocklyEditorState,
        public dialogState: DialogState,
        public robotWiredState: RobotWiredState,
        private router: Router,
        private snackBar: MatSnackBar,
        private dialog: MatDialog,
        private codeEditorState: CodeEditorState,
        private uploaderService: PythonUploaderService,
        private workspaceService: WorkspaceService,
    ) {}

    public onNewProjectClicked() {
        this.appState.setSelectedRobotType(null);
    }

    public onLoadWorkspaceClicked() {
        this.workspaceService.restoreWorkspace().then(() => {});
    }

    public async onDownloadDriversClicked() {
        // check the GitHub api for what files we need to download with url: https://api.github.com/repos/leaphy-robotics/leaphy-firmware/
        // then download the files with the url: https://raw.githubusercontent.com/leaphy-robotics/leaphy-firmware/master/drivers/
        // then zip the files into one file and download them all
        const url =
            "https://api.github.com/repos/leaphy-robotics/leaphy-firmware/contents/drivers";
        const response = await fetch(url);
        const data = await response.json();
        const files = [];
        for (const file of data) {
            files.push(file.download_url);
        }
        const zip = new JSZip();
        const promises = [];
        for (const file of files) {
            promises.push(
                fetch(file)
                    .then((response) => response.blob())
                    .then((blob) => {
                        zip.file(file.split("/").pop(), blob);
                    }),
            );
        }
        await Promise.all(promises);
        const content = await zip.generateAsync({ type: "blob" });
        const a = document.createElement("a");
        const url2 = URL.createObjectURL(content);
        a.href = url2;
        a.download = "leaphy-drivers.zip";
        a.click();
        URL.revokeObjectURL(url2);
    }

    public async onChooseRobot() {
        const port = await this.robotWiredState.requestSerialPort(true);
        if (port !== this.robotWiredState.serialPort) {
            await port.open({ baudRate: 115200 });
            this.robotWiredState.serialPort = port;
            this.dialogState.isSerialOutputListening = true;
        }

        this.snackBar.openFromComponent(StatusMessageDialog, {
            duration: 2000,
            horizontalPosition: "center",
            verticalPosition: "bottom",
            data: { message: "CONNECTED" },
        });
    }

    public onSaveWorkspaceClicked() {
        this.workspaceService.saveWorkspace().then(() => {});
    }

    // To capture the keyboard shortcut for Saving a project
    @HostListener("window:keydown", ["$event"])
    onCtrlS(event: KeyboardEvent) {
        if ((event.metaKey || event.ctrlKey) && event.key === "s") {
            this.onSaveWorkspaceClicked();
            event.preventDefault();
        }
    }

    public async onCodeEditorClicked() {
        await this.workspaceService.switchCodeEditor();
    }

    public onSaveWorkspaceAsClicked() {
        this.workspaceService
            .saveWorkspaceAs(this.appState.selectedRobotType.id)
            .then(() => {});
    }

    public onConnectClicked() {
        this.dialog
            .open(ConnectPythonDialog, {
                width: "600px",
                disableClose: true,
            })
            .afterClosed()
            .subscribe((result) => {
                if (result) {
                    if (result == "HELP_ENVIRONMENT") {
                        const langcode = this.appState.currentLanguageCode;
                        this.router
                            .navigateByUrl("/" + langcode + "/driverissues", {
                                skipLocationChange: true,
                            })
                            .then(() => {});
                    }
                }
            });
    }

    public async onRunClicked() {
        const robotType = this.appState.selectedRobotType;
        const code = this.codeEditorState.code;
        const libraries = [...robotType.libs];
        libraries.push(
            ...this.codeEditorState.installedLibraries.map(
                (lib) => `${lib.name}@${lib.version}`,
            ),
        );
        try {
            if (this.appState.currentEditor == CodeEditorType.Python) {
                await this.uploaderService.runCode(code);
            } else {
                this.dialog
                    .open(UploadDialog, {
                        width: "450px",
                        disableClose: true,
                        data: {
                            source_code: code,
                            libraries: libraries,
                            board: robotType.fqbn,
                        },
                    })
                    .afterClosed()
                    .subscribe((result) => {
                        if (result) {
                            if (result == "HELP_ENVIRONMENT") {
                                const langcode =
                                    this.appState.currentLanguageCode;
                                this.router.navigateByUrl(
                                    "/" + langcode + "/driverissues",
                                    { skipLocationChange: true },
                                );
                            }
                        }
                    });
            }
        } catch (error) {
            console.log("Error:", error.message);
        }
    }

    public onUndoClicked() {
        this.blocklyState.undo = false;
    }

    public onRedoClicked() {
        this.blocklyState.undo = true;
    }

    public onHelpClicked() {
        window.open("https://discord.com/invite/Yeg7Kkrq5W", "_blank").focus();
    }

    public onEmailClicked() {
        // copy email to clipboard
        navigator.clipboard
            .writeText("helpdesk@leaphy.org")
            .then(function () {});
        this.snackBar.open("Email copied to clipboard", "Close", {
            duration: 2000,
        });
    }

    isDriverIssuesUrl(): boolean {
        return !this.router.url.endsWith("driverissues");
    }

    public onShowInfoClicked() {
        this.dialogState.isInfoDialogVisible = true;
    }

    public onViewLogClicked() {
        this.dialog.open(DebugInformationDialog, {
            disableClose: false,
        });
    }

    public onToggleSoundClicked() {
        this.blocklyState.isSoundToggled;
    }

    public onLanguageChanged(language: Language) {
        this.appState.changedLanguage = language;
        window.location.reload();
    }

    public onBackToBlocks() {
        if (this.appState.currentEditor == CodeEditorType.Beginner)
            this.router
                .navigate(["/blocks"], { skipLocationChange: true })
                .then(() => {});
        else if (this.appState.currentEditor == CodeEditorType.CPP)
            this.router
                .navigate(["/cppEditor"], { skipLocationChange: true })
                .then(() => {});
        else if (this.appState.currentEditor == CodeEditorType.Python)
            this.router
                .navigate(["/pythonEditor"], { skipLocationChange: true })
                .then(() => {});
    }

    public onExamplesClicked() {
        this.dialogState.isExamplesDialogVisible = true;
    }

    protected readonly AppState = AppState;
    protected readonly microPythonRobotType = microPythonRobotType;
    protected readonly CodeEditorType = CodeEditorType;

    onRobotSelected($event: MatSelectChange) {
        this.selectedRobot = $event.value;
        for (const robot of this.genericRobots) {
            if (robot.name === this.selectedRobot) {
                this.appState.setSelectedRobotType(robot);
                break;
            }
        }
    }

    protected readonly genericRobots = genericRobots;
}
