import {
    AfterViewInit,
    ChangeDetectorRef,
    Component,
    OnInit,
} from "@angular/core";
import { CodeEditorState } from "../../../../state/code-editor.state";
import { editor } from "monaco-editor";
import IStandaloneEditorConstructionOptions = editor.IStandaloneEditorConstructionOptions;
import { AppState } from "../../../../state/app.state";

@Component({
    selector: "app-code-view",
    templateUrl: "./code-view.component.html",
    styleUrls: ["./code-view.component.scss"],
})
export class CodeViewComponent {
    editorOptions: IStandaloneEditorConstructionOptions = {
        language: "cpp",
        readOnly: true,
        automaticLayout: true,
        theme: "vs",
    };

    constructor(
        private cdr: ChangeDetectorRef,
        public codeEditor: CodeEditorState,
        private appState: AppState,
    ) {
        // check if we are currently in dark mode
        const isDarkMode = this.appState.selectedTheme === "dark";
        if (isDarkMode) {
            this.editorOptions.theme = "vs-dark";
        }
    }
}
