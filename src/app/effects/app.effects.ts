import { Injectable } from '@angular/core';
import { AppState } from '../state/app.state';
import { TranslateService } from '@ngx-translate/core';
import { BackEndState } from '../state/backend.state';
import { filter, withLatestFrom } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StatusMessageDialog } from '../modules/core/dialogs/status-message/status-message.dialog';
import { Router } from '@angular/router';
import { CodeEditorType } from '../domain/code-editor.type';

@Injectable({
    providedIn: 'root',
})

export class AppEffects {

    constructor(
        private appState: AppState,
        private translate: TranslateService,
        private backEndState: BackEndState,
        private snackBar: MatSnackBar,
        private router: Router) {

        // Use the current language to translate the angular strings
        this.appState.currentLanguage$
            .pipe(filter(language => !!language))
            .subscribe(language => this.translate.use(language.code));


        // When the editor change has been confirmed, toggle the code-editor
        this.appState.isCodeEditorToggleConfirmed$
            .pipe(filter(isToggled => !!isToggled), withLatestFrom(this.appState.codeEditor$))
            .subscribe(([, codeEditorType]) => {
                if (codeEditorType == CodeEditorType.Beginner) {
                    this.appState.setSelectedCodeEditor(CodeEditorType.CPP);
                } else if (codeEditorType == CodeEditorType.CPP) {
                    this.appState.setSelectedCodeEditor(CodeEditorType.Beginner);
                }
            });

        // When the code editor changes, route to the correct screen
        this.appState.codeEditor$
            .pipe(filter(codeEditor => !!codeEditor))
            .subscribe(async codeEditor => {
                switch (codeEditor) {
                    case CodeEditorType.Beginner:
                        await this.router.navigate(['/blocks'], { skipLocationChange: true });
                        break;
                    case CodeEditorType.CPP:
                        await this.router.navigate(['/cppEditor'], { skipLocationChange: true });
                        break;
                    case CodeEditorType.Python:
                        await this.router.navigate(['/pythonEditor'], { skipLocationChange: true });
                        break;
                    default:
                        break;
                }
                this.appState.setIsCodeEditorToggleConfirmed(false);
            });

        // Show snackbar based on messages received from the Backend
        this.backEndState.backEndMessages$
            .pipe(filter(message => !!message && message.displayTimeout >= 0))
            .subscribe(message => {
                this.snackBar.openFromComponent(StatusMessageDialog, {
                    duration: message.displayTimeout,
                    horizontalPosition: 'center',
                    verticalPosition: 'bottom',
                    data: message
                })
            });
    }
}
