import {Injectable} from "@angular/core";
import {filter, withLatestFrom} from "rxjs/operators";
import * as ace from "ace-builds";
import {CodeEditorState} from "../state/code-editor.state";
import {AppState} from "../state/app.state";
import {CodeEditorType} from "../domain/code-editor.type";
import {WorkspaceService} from "../services/workspace.service";


@Injectable({
    providedIn: 'root',
})

// Defines the effects on the Editor that different state changes have
export class CodeEditorEffects {

    constructor(
        private codeEditorState: CodeEditorState,
        private appState: AppState,
        private workspaceService: WorkspaceService
    ) {

        this.codeEditorState.aceElement$
            .pipe(
                filter(element => !!element))
            .subscribe(element => {
                ace.config.set("fontSize", "14px");
                //ace.config.set('basePath', 'https://unpkg.com/ace-builds@1.4.12/src-noconflict');
                const aceEditor = ace.edit(element.nativeElement);
                aceEditor.setTheme('ace/theme/solarized_light');
                if (this.appState.getCurrentEditor() == CodeEditorType.Python) {
                    aceEditor.session.setMode('ace/mode/python');
                } else if (this.appState.getCurrentEditor() == CodeEditorType.CPP) {
                    aceEditor.session.setMode('ace/mode/c_cpp');
                }
                aceEditor.setOptions({
                    enableBasicAutocompletion: true,
                    enableLiveAutocompletion: true
                });
                this.codeEditorState.setAceEditor(aceEditor);
            });


        // When the Ace Editor is set, set it with the code, and update the blockly code with changes
        this.codeEditorState.aceEditor$
            .pipe(filter(aceEditor => !!aceEditor))
            .pipe(withLatestFrom(this.codeEditorState.code$))
            .subscribe(([aceEditor]) => {

                const startingCode = this.codeEditorState.getCode();
                aceEditor.session.setValue(startingCode);
                this.codeEditorState.setOriginalCode(startingCode);
                this.codeEditorState.setCode(startingCode);
                this.workspaceService.restoreWorkspaceTemp().then(() => {});

                aceEditor.on("change", () => {
                    const changedCode = aceEditor.getValue();
                    this.codeEditorState.setCode(changedCode)
                });
            });

        this.appState.codeEditor$
            .subscribe(codeEditor => {
                if (codeEditor == CodeEditorType.Python) {
                    this.codeEditorState.setCode(this.codeEditorState.pythonProgram);
                } else if (codeEditor == CodeEditorType.CPP) {
                    this.codeEditorState.setCode(this.codeEditorState.originalProgram);
                }
            });
    }
}
