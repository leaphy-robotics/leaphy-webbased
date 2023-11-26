import {Injectable} from "@angular/core";
import {filter, withLatestFrom} from "rxjs/operators";
import {BlocklyEditorState} from "../state/blockly-editor.state";
import * as ace from "ace-builds";
import {BackEndState} from "../state/backend.state";
import {CodeEditorState} from "../state/code-editor.state";
import {AppState} from "../state/app.state";
import {CodeEditorType} from "../domain/code-editor.type";

@Injectable({
    providedIn: 'root',
})

// Defines the effects on the Editor that different state changes have
export class CodeEditorEffects {

    constructor(private blocklyState: BlocklyEditorState, private backEndState: BackEndState, private codeEditorState: CodeEditorState, private appState: AppState) {

        this.codeEditorState.aceElement$
            .pipe(
                filter(element => !!element))
            .subscribe(element => {
                console.log("CodeEditorEffects:aceElement$");
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
        const aceEditorSubscription = this.codeEditorState.aceEditor$
            .pipe(filter(aceEditor => !!aceEditor))
            .pipe(withLatestFrom(this.blocklyState.code$, this.codeEditorState.code$))
            .subscribe(([aceEditor, blocklyCode, editorCode]) => {
                const startingCode = this.codeEditorState.getCode();
                aceEditor.session.setValue(startingCode);
                this.codeEditorState.setOriginalCode(startingCode);
                this.codeEditorState.setCode(startingCode);

                aceEditor.on("change", () => {
                    const changedCode = aceEditor.getValue();
                    this.codeEditorState.setCode(changedCode)
                    this.blocklyState.setCode(changedCode);
                });
            });
        // React to the backend message and set the ACE Editor code
        // React to messages received from the Backend
        this.backEndState.backEndMessages$
            .pipe(withLatestFrom(this.codeEditorState.aceEditor$))
            .pipe(filter(([message,]) => !!message))
            .subscribe(([message, aceEditor]) => {
                switch (message.event) {
                    case 'WORKSPACE_CODE_RESTORING':
                        const code = message.payload.data as string;
                        aceEditor.session.setValue(code);
                        this.codeEditorState.setOriginalCode(code);
                        this.codeEditorState.setCode(code);
                        break;
                    case 'WORKSPACE_SAVED':
                        const savedCode = aceEditor.getValue();
                        this.codeEditorState.setOriginalCode(savedCode);
                        this.codeEditorState.setCode(savedCode);
                        break;
                    default:
                        break;
                }
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
