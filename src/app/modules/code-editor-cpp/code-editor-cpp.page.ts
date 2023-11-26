import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { CodeEditorState } from 'src/app/state/code-editor.state';
import {BackendWiredEffects} from "../../effects/backend.wired.effects";
import {CodeEditorEffects} from "../../effects/code-editor.effects";
import {BlocklyEditorState} from "../../state/blockly-editor.state";
import {GlobalState} from "../../state/global.state";
import {BackEndState} from "../../state/backend.state";


@Component({
    selector: 'app-code-editor-cpp',
    templateUrl: './code-editor-cpp.page.html',
    styleUrls: ['./code-editor-cpp.page.scss']
})
export class CodeEditorCppPage implements AfterViewInit {

    @ViewChild("editor") private editor: ElementRef<HTMLElement>;

    constructor(private backendWiredEffects: BackendWiredEffects, private global: GlobalState, private blocklyState: BlocklyEditorState, private backEndState: BackEndState) {
        if (this.global.codeEditorEffect) {
            this.global.codeEditorEffect.cleanup();
            this.global.codeEditorEffect = null;
        }
        this.global.codeEditorState = new CodeEditorState('arduino');
        this.global.langValue = this.global.codeEditorState.lang;
    }

    ngAfterViewInit(): void {
        this.global.codeEditorState.setAceElement(this.editor);
        this.global.codeEditorEffect = new CodeEditorEffects(this.global, this.blocklyState, this.backEndState);

        window.addEventListener("beforeunload", () => {
            this.backendWiredEffects.send('save-workspace-temp', {data: this.global.codeEditorState.getCode()})
        });
    }
}
