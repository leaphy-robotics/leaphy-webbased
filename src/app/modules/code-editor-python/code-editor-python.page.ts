import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { CodeEditorState } from 'src/app/state/code-editor.state';
import {BackendWiredEffects} from "../../effects/backend.wired.effects";
import {CommonModule} from "@angular/common";
import {SharedModule} from "../shared/shared.module";
import {CoreModule} from "../core/core.module";


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

    constructor(private backendWiredEffects: BackendWiredEffects, private codeEditorState: CodeEditorState) {}

    ngAfterViewInit(): void {
        this.codeEditorState.setAceElement(this.editor);

        window.addEventListener("beforeunload", () => {
            this.backendWiredEffects.send('save-workspace-temp', {data: this.codeEditorState.getCode()})
        });
    }
}
