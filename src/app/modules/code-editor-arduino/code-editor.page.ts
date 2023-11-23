import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { CodeEditorState } from 'src/app/state/code-editor.state';
import {BackendWiredEffects} from "../../effects/backend.wired.effects";
import {CodeEditorEffects} from "../../effects/code-editor.effects";
import {BlocklyEditorState} from "../../state/blockly-editor.state";
import {GlobalVariablesService} from "../../state/global.state";
import {BackEndState} from "../../state/backend.state";

@Component({
    selector: 'app-code-editor-arduino',
    templateUrl: './code-editor.page.html',
    styleUrls: ['./code-editor.page.scss']
})
export class CodeEditorPage implements AfterViewInit {

    @ViewChild("editor") private editor: ElementRef<HTMLElement>;
    private codeEditorEffects: CodeEditorEffects;
    private codeEditorState: CodeEditorState;

    constructor(private backendWiredEffects: BackendWiredEffects, private global: GlobalVariablesService, private blocklyState: BlocklyEditorState, private backEndState: BackEndState) {
        if (this.global.codeEditorEffect) {
            this.global.codeEditorEffect.cleanup();
            this.global.codeEditorEffect = null;
        }
        this.codeEditorState = new CodeEditorState('arduino', global);
        this.global.codeEditorState = this.codeEditorState;
        this.global.langValue = this.codeEditorState.lang;
    }

    ngAfterViewInit(): void {
        this.codeEditorState.setAceElement(this.editor);
        this.global.codeEditorEffect = new CodeEditorEffects(this.global, this.blocklyState, this.backEndState);

        window.addEventListener("beforeunload", () => {
            this.backendWiredEffects.send('save-workspace-temp', {data: this.codeEditorState.getCode()})
        });
    }
}
