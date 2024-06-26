import { Component, Inject } from "@angular/core";
import { MAT_SNACK_BAR_DATA } from "@angular/material/snack-bar";
import { SnackbarMessage } from "src/app/domain/snackbar.message";

@Component({
    selector: "app-status-message",
    templateUrl: "./status-message.dialog.html",
    styleUrls: ["./status-message.dialog.scss"],
})
export class StatusMessageDialog {
    constructor(@Inject(MAT_SNACK_BAR_DATA) public message: SnackbarMessage) {}
}
