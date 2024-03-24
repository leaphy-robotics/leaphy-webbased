import { Injectable } from "@angular/core";
import { BlocklyEditorState } from "../state/blockly-editor.state";
import { filter, withLatestFrom } from "rxjs/operators";
import { AppState } from "../state/app.state";
import { WorkspaceStatus } from "../domain/workspace.status";
import { CodeEditorType } from "../domain/code-editor.type";
import { MatDialog } from "@angular/material/dialog";
import { VariableDialog } from "../modules/core/dialogs/variable/variable.dialog";
import * as Blockly from "blockly/core";
import { WorkspaceService } from "../services/workspace.service";

@Injectable({
    providedIn: "root",
})
export class WorkspaceEffects {
    constructor(
        private appState: AppState,
        private blocklyEditorState: BlocklyEditorState,
        private dialog: MatDialog,
        private workspaceService: WorkspaceService,
    ) {
        // Only set up these effects when we're in Desktop mode
        this.appState.isDesktop$
            .pipe(filter((isDesktop) => !!isDesktop))
            .subscribe(() => {
                try {
                    Blockly.dialog.setPrompt((msg, defaultValue, callback) => {
                        this.dialog
                            .open(VariableDialog, {
                                width: "400px",
                                data: { name: defaultValue },
                            })
                            .afterClosed()
                            .subscribe((result) => {
                                callback(result);
                            });
                    });
                } catch (e) {
                    console.log(e);
                    throw e;
                }

                // When a workspace project is being loaded
                this.blocklyEditorState.workspaceStatus$
                    .pipe(withLatestFrom(this.appState.codeEditor$))
                    .pipe(
                        filter(
                            ([status]) => status === WorkspaceStatus.Finding,
                        ),
                    )
                    .subscribe(([,]) => {
                        workspaceService.restoreWorkspace().then(() => {});
                    });

                // When the workspace is being saved as a new project
                this.blocklyEditorState.workspaceStatus$
                    .pipe(withLatestFrom(this.appState.codeEditor$))
                    .pipe(
                        filter(
                            ([status]) => status === WorkspaceStatus.SavingAs,
                        ),
                    )
                    .pipe(withLatestFrom(this.appState.selectedRobotType$))
                    .subscribe(([, robotType]) => {
                        workspaceService
                            .saveWorkspaceAs(robotType.id)
                            .then(() => {});
                    });

                this.blocklyEditorState.workspaceStatus$
                    .pipe(withLatestFrom(this.appState.codeEditor$))
                    .pipe(
                        filter(([status]) => status === WorkspaceStatus.Saving),
                    )
                    .subscribe(() => {
                        workspaceService.saveWorkspace().then(() => {});
                    });

                // When the workspace is being temporarily saved
                this.blocklyEditorState.workspaceStatus$
                    .pipe(
                        filter(
                            (status) => status === WorkspaceStatus.SavingTemp,
                        ),
                    )
                    .pipe(
                        withLatestFrom(
                            this.blocklyEditorState.workspaceJSON$,
                            this.appState.selectedRobotType$,
                        ),
                    )
                    .subscribe(([, workspaceXml]) => {
                        if (
                            CodeEditorType.CPP ==
                                this.appState.getCurrentEditor() ||
                            CodeEditorType.Python ==
                                this.appState.getCurrentEditor()
                        ) {
                            this.workspaceService
                                .saveWorkspaceTemp(workspaceXml)
                                .then(() => {});
                        } else {
                            this.workspaceService
                                .saveWorkspaceTemp(workspaceXml)
                                .then(() => {});
                        }
                    });
            });
    }
}
