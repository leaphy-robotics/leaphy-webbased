import {AfterViewInit, Component, ElementRef, ViewChild} from '@angular/core';
import {CodeEditorState} from 'src/app/state/code-editor.state';
import {CommonModule} from "@angular/common";
import {SharedModule} from "../shared/shared.module";
import {CoreModule} from "../core/core.module";
import {WorkspaceService} from "../../services/workspace.service";


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
        private codeEditorState: CodeEditorState,
        private workspaceService: WorkspaceService
    ) {}

    ngAfterViewInit(): void {
        this.codeEditorState.setAceElement(this.editor);

        window.addEventListener("beforeunload", async () => {
            this.workspaceService.saveWorkspaceTemp(this.codeEditorState.getCode());
        });
    }
}
