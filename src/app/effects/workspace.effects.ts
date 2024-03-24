import {Injectable} from '@angular/core';
import {BlocklyEditorState} from '../state/blockly-editor.state';
import {filter, withLatestFrom} from 'rxjs/operators';
import {AppState} from '../state/app.state';
import {WorkspaceStatus} from '../domain/workspace.status';
import {CodeEditorType} from '../domain/code-editor.type';
import {MatDialog} from "@angular/material/dialog";
import {VariableDialog} from "../modules/core/dialogs/variable/variable.dialog";
import * as Blockly from 'blockly/core';
import {WorkspaceService} from "../services/workspace.service";


@Injectable({
    providedIn: 'root',
})
export class WorkspaceEffects {

    constructor(
        private appState: AppState,
        private blocklyEditorState: BlocklyEditorState,
        private dialog: MatDialog,
    ) {
        // Only set up these effects when we're in Desktop mode
        this.appState.isDesktop$
            .pipe(filter(isDesktop => !!isDesktop))
            .subscribe(() => {
                try {
                    Blockly.dialog.setPrompt((msg, defaultValue, callback) => {
                        this.dialog.open(VariableDialog, {
                            width: '400px',
                            data: { name: defaultValue }
                        }).afterClosed().subscribe(result => {
                            callback(result);
                        });
                    });
                } catch (e) {
                    console.log(e);
                    throw e;
                }
            });
    }
}
