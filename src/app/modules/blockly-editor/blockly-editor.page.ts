import {Component} from '@angular/core';
import {BlocklyEditorState} from 'src/app/state/blockly-editor.state';
import {CommonModule} from "@angular/common";
import {SharedModule} from "../shared/shared.module";
import {BlocklyEditorModule} from "./blockly-editor.module";
import {WorkspaceService} from "../../services/workspace.service";

@Component({
    standalone: true,
    selector: 'app-blockly-editor',
    templateUrl: './blockly-editor.page.html',
    styleUrls: ['./blockly-editor.page.scss'],
    imports: [
        CommonModule,
        SharedModule,
        BlocklyEditorModule
    ],
})

export class BlocklyEditorPage {
    constructor(
        public blocklyState: BlocklyEditorState,
        private blocklyEditorState: BlocklyEditorState,
        private workspaceService: WorkspaceService
    ) {
        window.addEventListener("beforeunload", async (event) => {
            this.workspaceService.saveWorkspaceTemp(this.blocklyEditorState.workspaceJSON);
        });
    }
}
