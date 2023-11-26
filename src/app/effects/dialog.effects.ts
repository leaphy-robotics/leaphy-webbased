import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { filter, switchMap, withLatestFrom } from 'rxjs/operators';
import { DialogState } from '../state/dialog.state';
import { BackEndState } from '../state/backend.state';
import { ConnectionStatus } from '../domain/connection.status';
import { CreditsDialog } from '../modules/core/dialogs/credits/credits.dialog';
import { InfoDialog } from '../modules/core/dialogs/info/info.dialog';
import { ConfirmEditorDialog } from '../modules/core/dialogs/confirm-editor/confirm-editor.dialog';
import { LanguageSelectDialog } from '../modules/core/dialogs/language-select/language-select.dialog';
import {SerialOutputComponent} from "../modules/shared/components/serial-output/serial-output.component";

@Injectable({
    providedIn: 'root',
})

// Defines the effects on the Dialog that different state changes have
export class DialogEffects {

    constructor(
        private dialogState: DialogState,
        private backEndState: BackEndState,
        private dialog: MatDialog,
    ) {
        // When the info dialog visibility is set to true, open the dialog
        this.dialogState.isInfoDialogVisible$
            .pipe(filter(isVisible => !!isVisible))
            .subscribe(() => {
                this.dialog.open(InfoDialog, {
                    width: "800px",
                    disableClose: true,
                });
            });

        // If the isSerialOutputWindowOpen is set to true open the dialog
        this.dialogState.isSerialOutputWindowOpen$
            .subscribe(() => {
                if (this.dialogState.getIsSerialOutputWindowOpen() !== true)
                    return;
                this.dialog.open(SerialOutputComponent, {
                    width: "800px",
                    disableClose: true,
                    hasBackdrop: false,
                }).afterClosed().subscribe(() => {
                    this.dialogState.setIsSerialOutputWindowOpen(false);
                });
            });


        // When the info dialog visibility is set to true, open the dialog
        this.dialogState.isEditorTypeChangeConfirmationDialogVisible$
            .pipe(filter(isVisible => !!isVisible))
            .subscribe(() => {
                this.dialog.open(ConfirmEditorDialog, {
                    width: "450px",
                    disableClose: true,
                });
            });

        const language = localStorage.getItem('currentLanguage');
        if (language) {
            console.log('Language is set to ' + language);
        } else {
            const languageSelectionDialogComponent = LanguageSelectDialog;

            const languageDialogRef = this.dialog.open(languageSelectionDialogComponent, {
                width: '450px',
                disableClose: true,
            });

            languageDialogRef.afterClosed().subscribe(() => {
                const creditsDialogComponent = CreditsDialog;
                const creditsDialogRef = this.dialog.open(creditsDialogComponent, {
                    width: '800px',
                    disableClose: true,
                });
            });
        }
    }
}
