import {Component} from '@angular/core';
import { BlocklyEditorState } from 'src/app/state/blockly-editor.state';
import { DialogState } from 'src/app/state/dialog.state';
import {BackendWiredEffects} from "../../effects/backend.wired.effects";
import {CommonModule} from "@angular/common";
import {SharedModule} from "../shared/shared.module";
import {BlocklyEditorModule} from "./blockly-editor.module";

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
        public dialogState: DialogState,
        private backendWiredEffects: BackendWiredEffects,
        private blocklyEditorState: BlocklyEditorState
    ) {
        window.addEventListener("beforeunload", () => {
            this.backendWiredEffects.send('save-workspace-temp', {data: this.blocklyEditorState.workspaceXml})
        });
    }
}
