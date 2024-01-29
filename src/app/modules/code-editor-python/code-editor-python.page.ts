import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { CodeEditorState } from 'src/app/state/code-editor.state';
import {BackendWiredEffects} from "../../effects/backend.wired.effects";
import {CommonModule} from "@angular/common";
import {SharedModule} from "../shared/shared.module";
import {CoreModule} from "../core/core.module";
import {BlocklyEditorState} from "../../state/blockly-editor.state";
import {PythonFile} from "../../domain/python-file.type";
import {PythonUploaderService} from "../../services/python-uploader/PythonUploader.service";


@Component({
    selector: 'app-code-editor-python',
    standalone: true,
    templateUrl: './code-editor-python.page.html',
    styleUrls: ['./code-editor-python.page.scss'],
    imports: [
        CommonModule,
        SharedModule,
        CoreModule
    ]
})
export class CodeEditorPythonPage implements AfterViewInit {

    @ViewChild("editor") private editor: ElementRef<HTMLElement>;

    constructor(
        private backendWiredEffects: BackendWiredEffects,
        private codeEditorState: CodeEditorState,
        private blocklyState: BlocklyEditorState,
        private pythonUploaderService: PythonUploaderService
    ) {}

    ngAfterViewInit(): void {
        this.codeEditorState.setAceElement(this.editor);

        window.addEventListener("beforeunload", async (event) => {
            if (this.blocklyState.getProjectFileHandle()) {
                // buy some time for the backend to save the file
                const file = this.blocklyState.getProjectFileHandle();
                if (file instanceof PythonFile) {
                    this.pythonUploaderService.runFileSystemCommand('put', file.path, this.codeEditorState.getCode());
                } else {
                    this.backendWiredEffects.send('save-workspace', {data: this.codeEditorState.getCode()});
                }
            } else {
                this.backendWiredEffects.send('save-workspace-temp', {data: this.codeEditorState.getCode()});
            }
        });
    }
}
