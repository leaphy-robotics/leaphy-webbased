import {Injectable} from "@angular/core";
import {CodeEditorState} from "../state/code-editor.state";
import {AppState} from "../state/app.state";
import {CodeEditorType} from "../domain/code-editor.type";
import {genericRobotType} from "../domain/robots";


@Injectable({
    providedIn: 'root',
})

// Defines the effects on the Editor that different state changes have
export class CodeEditorEffects {

    constructor(
        private codeEditorState: CodeEditorState,
        private appState: AppState,
    ) {
        this.appState.codeEditor$
            .subscribe(codeEditor => {
                console.log('codeEditor', codeEditor);
                if (codeEditor == CodeEditorType.Python) {
                    this.codeEditorState.code = `from leaphymicropython.utils.pins import set_pwm`;
                } else if (codeEditor == CodeEditorType.CPP && this.appState.selectedRobotType == genericRobotType) {
                    this.codeEditorState.code = this.codeEditorState.code = `void leaphyProgram() {
}

void setup() {
    leaphyProgram();
}

void loop() {

}`;
                }
            });
    }
}
