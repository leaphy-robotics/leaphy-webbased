import { AfterViewInit, Component, ElementRef, ViewChild } from "@angular/core";
import { CodeEditorState } from "src/app/state/code-editor.state";
import { CommonModule } from "@angular/common";
import { SharedModule } from "../shared/shared.module";
import { CoreModule } from "../core/core.module";
import { WorkspaceService } from "../../services/workspace.service";
import { MonacoEditorModule } from "ngx-monaco-editor-v2";

@Component({
    selector: "app-code-editor-python",
    standalone: true,
    templateUrl: "./code-editor-python.page.html",
    styleUrls: ["./code-editor-python.page.scss"],
    imports: [CommonModule, SharedModule, CoreModule, MonacoEditorModule],
})
export class CodeEditorPythonPage implements AfterViewInit {
    editorOptions = {
        language: "python",
        automaticLayout: true,
    };

    constructor(
        public codeEditorState: CodeEditorState,
        private workspaceService: WorkspaceService,
    ) {}

    ngAfterViewInit(): void {
        window.addEventListener("beforeunload", async () => {
            await this.workspaceService.saveWorkspaceTemp(
                this.codeEditorState.code,
            );
        });
    }
}
