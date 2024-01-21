import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { CodeEditorState } from 'src/app/state/code-editor.state';
import {BackendWiredEffects} from "../../effects/backend.wired.effects";
import {CommonModule} from "@angular/common";
import {SharedModule} from "../shared/shared.module";
import {CoreModule} from "../core/core.module";


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

    constructor(private backendWiredEffects: BackendWiredEffects, private codeEditorState: CodeEditorState) {}

    ngAfterViewInit(): void {
        this.codeEditorState.setAceElement(this.editor);

        window.addEventListener("beforeunload", () => {
            this.backendWiredEffects.send('save-workspace-temp', {data: this.codeEditorState.getCode()})
        });
    }
}
