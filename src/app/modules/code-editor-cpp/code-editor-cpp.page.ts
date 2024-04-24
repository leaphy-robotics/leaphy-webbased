import { AfterViewInit, Component, ElementRef, ViewChild } from "@angular/core";
import { CodeEditorState } from "src/app/state/code-editor.state";
import { CommonModule } from "@angular/common";
import { SharedModule } from "../shared/shared.module";
import { CoreModule } from "../core/core.module";
import { WorkspaceService } from "../../services/workspace.service";
import { MonacoEditorModule } from "ngx-monaco-editor-v2";
import { AppState } from "../../state/app.state";

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
        private appState: AppState,
    ) {
        // check if we are currently in dark mode
        const isDarkMode = appState.selectedTheme === "dark";
        if (isDarkMode) {
            this.editorOptions = {
                ...this.editorOptions,
                theme: "vs-dark",
            };
        }

        appState.selectedTheme$.subscribe((theme) => {
            if (theme === "dark") {
                this.editorOptions = {
                    ...this.editorOptions,
                    theme: "vs-dark",
                };
            } else {
                this.editorOptions = {
                    ...this.editorOptions,
                    theme: "vs",
                };
            }
        });
    }

    ngAfterViewInit(): void {
        window.addEventListener("beforeunload", async () => {
            await this.workspaceService.saveWorkspaceTemp(
                this.codeEditorState.code,
            );
        });
    }
}
