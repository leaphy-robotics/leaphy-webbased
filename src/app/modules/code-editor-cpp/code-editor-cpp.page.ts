import { AfterViewInit, Component, ElementRef, ViewChild } from "@angular/core";
import { CodeEditorState } from "src/app/state/code-editor.state";
import { CommonModule } from "@angular/common";
import { SharedModule } from "../shared/shared.module";
import { CoreModule } from "../core/core.module";
import { WorkspaceService } from "../../services/workspace.service";
import { MonacoEditorModule } from "ngx-monaco-editor-v2";

@Component({
    standalone: true,
    selector: "app-code-editor-cpp",
    templateUrl: "./code-editor-cpp.page.html",
    styleUrls: ["./code-editor-cpp.page.scss"],
    imports: [CommonModule, SharedModule, CoreModule, MonacoEditorModule],
})
export class CodeEditorCppPage implements AfterViewInit {
    editorOptions: any = {
        language: "cpp",
        automaticLayout: true,
    };

    constructor(
        public codeEditorState: CodeEditorState,
        private workspaceService: WorkspaceService,
    ) {
        // check if we are currently in dark mode
        const isDarkMode = document.getElementsByTagName('body')[0].getAttribute('data-theme') === 'dark';
        if (isDarkMode) {
            this.editorOptions = {
                ...this.editorOptions,
                theme: "vs-dark",
            };
        }
    }

    ngAfterViewInit(): void {
        window.addEventListener("beforeunload", async () => {
            await this.workspaceService.saveWorkspaceTemp(
                this.codeEditorState.code,
            );
        });
    }
}
