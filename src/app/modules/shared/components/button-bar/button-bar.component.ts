import { Component } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { BlocklyEditorState } from "src/app/state/blockly-editor.state";
import { AppState } from "src/app/state/app.state";
import { DialogState } from "src/app/state/dialog.state";
import { CodeEditorType } from "../../../../domain/code-editor.type";

@Component({
    selector: "app-button-bar",
    templateUrl: "./button-bar.component.html",
    styleUrls: ["./button-bar.component.scss"],
})
export class ButtonBarComponent {
    constructor(
        public appState: AppState,
        public blocklyState: BlocklyEditorState,
        public dialogState: DialogState,
        public dialog: MatDialog,
    ) {}
    public onSideNavToggled() {
        this.blocklyState.isSideNavOpen = !this.blocklyState.isSideNavOpen;
    }

    public onShowSerialOutputClicked() {
        this.dialogState.isSerialOutputWindowOpen = true;
    }

    public onShowLibraryManagerClicked() {
        this.dialogState.isLibraryManagerWindowOpen = true;
    }

    protected readonly AppState = AppState;
    protected readonly CodeEditorType = CodeEditorType;

    onShowBoardSelectClicked() {

    }
}
