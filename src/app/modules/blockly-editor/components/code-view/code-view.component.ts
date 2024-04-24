import { Component } from "@angular/core";
import { CodeEditorState } from "../../../../state/code-editor.state";
import {editor} from "monaco-editor";
import IStandaloneEditorConstructionOptions = editor.IStandaloneEditorConstructionOptions;

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
    };

    constructor(public codeEditor: CodeEditorState) {
        // check if we are currently in dark mode
        const isDarkMode =
            document
                .getElementsByTagName("body")[0]
                .getAttribute("data-theme") === "dark";
        if (isDarkMode) {
            this.editorOptions = {
                ...this.editorOptions,
                theme: "vs-dark",
            };
        }
    }
}
