import { MatDialogRef } from "@angular/material/dialog";
import { Component } from "@angular/core";
import examples, { Board, Example } from "src/examples";
import { AppState } from "../../../../state/app.state";
import { WorkspaceService } from "../../../../services/workspace.service";

@Component({
    selector: "app-examples",
    templateUrl: "./examples-dialog.component.html",
    styleUrls: ["./examples-dialog.component.scss"],
})
export class ExamplesDialog {
    public examples: Example[];
    public filtered: Example[];

    constructor(
        public appState: AppState,
        private dialog: MatDialogRef<ExamplesDialog>,
        private workspaceService: WorkspaceService,
    ) {
        this.examples = this.getExamplesForRobot(
            this.appState.getSelectedRobotType().id,
        );
        this.filtered = this.examples;
    }

    private getExamplesForRobot(id: string): Example[] {
        return examples.filter((example) => {
            if (example.boards.includes(Board.ALL)) return true;
            if (
                example.boards.includes(Board.L_ORIGINAL_ALL) &&
                id.startsWith("l_original")
            )
                return true;
            if (
                example.boards.includes(Board.L_ORIGINAL_NANO_ALL) &&
                id.startsWith("l_original_nano")
            )
                return true;
            if (
                example.boards.includes(Board.L_FLITZ_ALL) &&
                id.startsWith("l_flitz")
            )
                return true;
            if (
                example.boards.includes(Board.L_NANO_ALL) &&
                id.startsWith("l_nano")
            )
                return true;
            if (
                example.boards.includes(Board.L_ARDUINO) &&
                [
                    "l_nano",
                    "l_nano_esp32",
                    "l_nano_rp2040",
                    "l_uno",
                    "l_mega",
                ].includes(id)
            )
                return true;

            return example.boards.map((board) => board as string).includes(id);
        });
    }

    public filter(filter = "") {
        this.filtered = this.examples.filter(({ name }) =>
            name.toUpperCase().includes(filter.toUpperCase()),
        );
    }

    public async open(example: Example) {
        const sketch = await fetch(`examples/${example.sketch}`).then((res) =>
            res.text(),
        );

        this.workspaceService.restoreWorkspaceFromMessage({
            payload: {
                data: sketch,
                type: "beginner",
                extension: this.appState.getSelectedRobotType().id,
            },
            displayTimeout: 2000,
        });
        this.close();
    }

    public close() {
        this.dialog.close();
    }
}
