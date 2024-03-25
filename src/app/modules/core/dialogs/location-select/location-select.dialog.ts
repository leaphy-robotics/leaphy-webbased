import { Component, Inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { AppState } from 'src/app/state/app.state';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';
import {TranslateService} from "@ngx-translate/core";

@Component({
    selector: 'app-location-select',
    templateUrl: './location-select.dialog.html',
    styleUrls: ['./location-select.dialog.scss']
})
export class LocationSelectDialog {
    constructor(
        @Inject(MAT_DIALOG_DATA) public data: any,
        public dialogRef: MatDialogRef<LocationSelectDialog>,
        public appState: AppState,
        private translate: TranslateService
    ) {
        // loop through the list in the options key and translate and replace the value
        let newOptions = [];
        this.data.options.forEach((option: string) => {
            newOptions.push(this.translate.instant(option));
        });
        this.data.options = newOptions;
    }

    public onOptionSelected(option: String) {
        this.dialogRef.close(option);
    }
}
