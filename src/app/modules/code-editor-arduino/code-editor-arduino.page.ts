import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { CodeEditorState } from 'src/app/state/code-editor.state';
import {BackendWiredEffects} from "../../effects/backend.wired.effects";
import {CodeEditorEffects} from "../../effects/code-editor.effects";
import {BlocklyEditorState} from "../../state/blockly-editor.state";
import {BackEndState} from "../../state/backend.state";

@Component({
    selector: 'app-code-editor-arduino',
    templateUrl: './code-editor-arduino.page.html',
    styleUrls: ['./code-editor-arduino.page.scss']
})
export class CodeEditorArduinoPage implements AfterViewInit {

    @ViewChild("editor") private editor: ElementRef<HTMLElement>;

    constructor(
        private codeEditorEffect: CodeEditorEffects,
        private backendWiredEffects: BackendWiredEffects,
        private blocklyState: BlocklyEditorState,
        backEndState: BackEndState
    ) {
        if (this.codeEditorEffect) {
            this.codeEditorEffect.cleanup();
        }
    }

    ngAfterViewInit(): void {
        this.codeEditorEffect.setAceElement(this.editor);

        window.addEventListener("beforeunload", () => {
            this.backendWiredEffects.send('save-workspace-temp', {data: this.codeEditorEffect.getCode()})
        });
    }
}
