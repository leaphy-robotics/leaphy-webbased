import { MatDialogRef } from "@angular/material/dialog";
import { Component } from "@angular/core";
import examples, {
    Board,
    BoardNames,
    BoardNamesArray,
    Example,
} from "src/examples";
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
            this.appState.selectedRobotType.id,
        );
        this.filtered = this.examples;
    }

    private getExamplesForRobot(id: string): Example[] {
        return examples.filter((example) => {
            let allowed = false;
            if (example.boards.includes(Board.ALL)) allowed = true;
            if (
                example.boards.includes(Board.L_ORIGINAL_ALL) &&
                id.startsWith("l_original")
            )
                allowed = true;
            if (
                example.boards.includes(Board.L_ORIGINAL_NANO_ALL) &&
                id.startsWith("l_original_nano")
            )
                allowed = true;
            if (
                example.boards.includes(Board.L_FLITZ_ALL) &&
                id.startsWith("l_flitz")
            )
                allowed = true;
            if (
                example.boards.includes(Board.L_NANO_ALL) &&
                id.startsWith("l_nano")
            )
                allowed = true;
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
                allowed = true;

            // check if there is a negative number in the list
            // @ts-ignore
            if (allowed == true) {
                let negative = [...example.boards].filter((board) => board < 0);
                if (negative.length > 0) {
                    // @ts-ignore
                    if (negative.includes(-BoardNames[id])) {
                        return false;
                    } else {
                        if (example.boards.includes(-Board.ALL)) return false;
                        if (
                            example.boards.includes(-Board.L_ORIGINAL_ALL) &&
                            id.startsWith("l_original")
                        )
                            return false;
                        if (
                            example.boards.includes(
                                -Board.L_ORIGINAL_NANO_ALL,
                            ) &&
                            id.startsWith("l_original_nano")
                        )
                            return false;
                        if (
                            example.boards.includes(-Board.L_FLITZ_ALL) &&
                            id.startsWith("l_flitz")
                        )
                            return false;
                        if (
                            example.boards.includes(-Board.L_NANO_ALL) &&
                            id.startsWith("l_nano")
                        )
                            return false;
                        return !(
                            example.boards.includes(-Board.L_ARDUINO) &&
                            [
                                "l_nano",
                                "l_nano_esp32",
                                "l_nano_rp2040",
                                "l_uno",
                                "l_mega",
                            ].includes(id)
                        );
                    }
                } else {
                    return true;
                }
            }

            return example.boards.includes(BoardNames[id]);
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
                extension: this.appState.selectedRobotType.id,
            },
            displayTimeout: 2000,
        });
        this.close();
    }

    public close() {
        this.dialog.close();
    }
}
