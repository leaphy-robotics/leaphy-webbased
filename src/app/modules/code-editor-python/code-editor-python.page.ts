import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { CodeEditorEffects } from 'src/app/effects/code-editor.effects';
import { BackEndState } from 'src/app/state/backend.state';
import { BlocklyEditorState } from 'src/app/state/blockly-editor.state';
import { CodeEditorState } from 'src/app/state/code-editor.state';
import { GlobalVariablesService } from 'src/app/state/global.state';
import {BackendWiredEffects} from "../../effects/backend.wired.effects";


@Component({
    selector: 'app-code-editor-python',
    templateUrl: './code-editor-python.page.html',
    styleUrls: ['./code-editor-python.page.scss']
})
export class CodeEditorPythonPage implements AfterViewInit {

    @ViewChild("editor") private editor: ElementRef<HTMLElement>;
    private codeEditorEffects: CodeEditorEffects;
    private codeEditorState: CodeEditorState;

    constructor(private backendWiredEffects: BackendWiredEffects, private global: GlobalVariablesService, private blocklyState: BlocklyEditorState, private backEndState: BackEndState) {
        if (this.global.codeEditorEffect) {
            this.global.codeEditorEffect.cleanup();
            this.global.codeEditorEffect = null;
        }
        this.codeEditorState = new CodeEditorState('python', global);
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
