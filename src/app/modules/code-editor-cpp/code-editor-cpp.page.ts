import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { CodeEditorState } from 'src/app/state/code-editor.state';
import {BackendWiredEffects} from "../../effects/backend.wired.effects";
import {CommonModule} from "@angular/common";
import {SharedModule} from "../shared/shared.module";
import {CoreModule} from "../core/core.module";
import {PythonFile} from "../../domain/python-file.type";
import {BlocklyEditorState} from "../../state/blockly-editor.state";


@Component({
    standalone: true,
    selector: 'app-code-editor-cpp',
    templateUrl: './code-editor-cpp.page.html',
    styleUrls: ['./code-editor-cpp.page.scss'],
    imports: [
        CommonModule,
        SharedModule,
        CoreModule
    ]
})
export class CodeEditorCppPage implements AfterViewInit {

    @ViewChild("editor") private editor: ElementRef<HTMLElement>;

    constructor(
        private backendWiredEffects: BackendWiredEffects,
        private codeEditorState: CodeEditorState,
        private blocklyState: BlocklyEditorState
    ) {}

    ngAfterViewInit(): void {
        this.codeEditorState.setAceElement(this.editor);

        window.addEventListener("beforeunload", async () => {
            if (this.blocklyState.getProjectFileHandle()) {
                const file = this.blocklyState.getProjectFileHandle();
                if (!(file instanceof PythonFile)) {
                    const currentContent = await (await file.getFile()).text();
                    if (currentContent == this.codeEditorState.getCode()) {
                        return;
                    }
                    this.backendWiredEffects.send('save-workspace', {data: this.codeEditorState.getCode()});
                }
            } else {
                this.backendWiredEffects.send('save-workspace-temp', {data: this.codeEditorState.getCode()});
            }
        });
    }
}
