import { Component } from "@angular/core";
import { CodeEditorState } from "../../../../state/code-editor.state";

@Component({
    selector: "app-code-view",
    templateUrl: "./code-view.component.html",
    styleUrls: ["./code-view.component.scss"],
})
export class CodeViewComponent {
    editorOptions = {
        language: "cpp",
        readOnly: true,
        automaticLayout: true,
    };

    constructor(public codeEditor: CodeEditorState) {}
}
