import { Injectable } from "@angular/core";
import { filter, withLatestFrom, tap } from "rxjs/operators";
import { BlocklyEditorState } from "../state/blockly-editor.state";
import * as ace from "ace-builds";
import { BackEndState } from "../state/backend.state";
import {GlobalState} from "../state/global.state";
import { Subscription } from "rxjs/internal/Subscription";

@Injectable({
    providedIn: 'root',
})

// Defines the effects on the Editor that different state changes have
export class CodeEditorEffects {
    private subscriptions: Subscription[] = [];

    constructor(private global: GlobalState, private blocklyState: BlocklyEditorState, private backEndState: BackEndState) {

        const aceElementSubscription = this.global.codeEditorState.aceElement$
            .pipe(
                filter(element => !!element))
            .subscribe(element => {
                ace.config.set("fontSize", "14px");
                //ace.config.set('basePath', 'https://unpkg.com/ace-builds@1.4.12/src-noconflict');
                const aceEditor = ace.edit(element.nativeElement);
                aceEditor.setTheme('ace/theme/solarized_light');
                if (this.global.langValue == 'python') {
                    aceEditor.session.setMode('ace/mode/python');
                } else if (this.global.langValue == 'arduino') {
                    aceEditor.session.setMode('ace/mode/c_cpp');
                }
                aceEditor.setOptions({
                    enableBasicAutocompletion: true,
                    enableLiveAutocompletion: true
                });
                this.global.codeEditorState.setAceEditor(aceEditor);
            });
        this.subscriptions.push(aceElementSubscription);


        // When the Ace Editor is set, set it with the code, and update the blockly code with changes
        const aceEditorSubscription = this.global.codeEditorState.aceEditor$
            .pipe(filter(aceEditor => !!aceEditor))
            .pipe(withLatestFrom(this.blocklyState.code$, this.global.codeEditorState.code$))
            .subscribe(([aceEditor, blocklyCode, editorCode]) => {
                const startingCode = this.global.codeEditorState.getCode();
                aceEditor.session.setValue(startingCode);
                this.global.codeEditorState.setOriginalCode(startingCode);
                this.global.codeEditorState.setCode(startingCode);

                aceEditor.on("change", () => {
                    const changedCode = aceEditor.getValue();
                    this.global.codeEditorState.setCode(changedCode)
                    this.blocklyState.setCode(changedCode);
                });
            });
        this.subscriptions.push(aceEditorSubscription);
        // React to the backend message and set the ACE Editor code
        // React to messages received from the Backend
        const backEndMessagesSubscription = this.backEndState.backEndMessages$
            .pipe(withLatestFrom(this.global.codeEditorState.aceEditor$))
            .pipe(filter(([message,]) => !!message))
            .subscribe(([message, aceEditor]) => {
                switch (message.event) {
                    case 'WORKSPACE_CODE_RESTORING':
                        const code = message.payload.data as string;
                        aceEditor.session.setValue(code);
                        this.global.codeEditorState.setOriginalCode(code);
                        this.global.codeEditorState.setCode(code);
                        break;
                    case 'WORKSPACE_SAVED':
                        const savedCode = aceEditor.getValue();
                        this.global.codeEditorState.setOriginalCode(savedCode);
                        this.global.codeEditorState.setCode(savedCode);
                        break;
                    default:
                        break;
                }
            });
        this.subscriptions.push(backEndMessagesSubscription);
    }

    public cleanup(): void {
        this.subscriptions.forEach(subscription => subscription.unsubscribe());
    }
}
