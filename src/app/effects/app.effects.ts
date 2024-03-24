import { Injectable } from '@angular/core';
import { AppState } from '../state/app.state';
import { TranslateService } from '@ngx-translate/core';
import { BackEndState } from '../state/backend.state';
import { filter, withLatestFrom } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StatusMessageDialog } from '../modules/core/dialogs/status-message/status-message.dialog';
import { Router } from '@angular/router';
import { CodeEditorType } from '../domain/code-editor.type';
import {LocalStorageService} from "../services/localstorage.service";
import {MatDialog} from "@angular/material/dialog";
import {ChangeLogDialog} from "../modules/core/dialogs/change-log/change-log.dialog";
import showdown from "showdown";

@Injectable({
    providedIn: 'root',
})

export class AppEffects {

    constructor(
        private appState: AppState,
        private translate: TranslateService,
        private backEndState: BackEndState,
        private snackBar: MatSnackBar,
        private router: Router,
        private localStorage: LocalStorageService,
        private dialog: MatDialog
    ) {

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
        this.backEndState.applicationMessage$
            .pipe(filter(message => !!message && message.displayTimeout >= 0))
            .subscribe(message => {
                this.snackBar.openFromComponent(StatusMessageDialog, {
                    duration: message.displayTimeout,
                    horizontalPosition: 'center',
                    verticalPosition: 'bottom',
                    data: message
                })
            });


        this.appState.releaseInfo$
            .pipe(filter(releaseInfo => !!releaseInfo))
            .subscribe(releaseInfo => {
                const releaseVersion = this.appState.getReleaseVersion();
                if (!releaseVersion) {
                    return;
                }
                try {
                    this.localStorage.fetch('releaseVersion');
                } catch (e) {
                    this.localStorage.store('releaseVersion', '');
                }

                if (releaseVersion != this.localStorage.fetch('releaseVersion')) {
                    let releaseNotes = releaseInfo["body"]
                    // convert all the urls to links
                    // first find the urls
                    let urls = releaseNotes.match(/(https?:\/\/[^\s]+)/g);
                    // then replace them with links
                    if (urls) {
                        // to prevent infinite loops we want to know the index of the last url we replaced
                        let lastUrlIndex = 0;
                        urls.forEach(url => {
                            const link = `<a href="${url}" target="_blank">${url}</a>`;
                            releaseNotes = releaseNotes.substring(0, releaseNotes.indexOf(url, lastUrlIndex)) + link + releaseNotes.substring(releaseNotes.indexOf(url, lastUrlIndex) + url.length);
                            lastUrlIndex = releaseNotes.indexOf(link, lastUrlIndex) + link.length;
                        });
                    }
                    // turn the @mentions into links
                    // first find the @mentions
                    let mentions = releaseNotes.match(/@(\w+)/g);
                    // then replace them with links
                    if (mentions) {
                        mentions.forEach(mention => {
                            const username = mention.substring(1);
                            releaseNotes = releaseNotes.replaceAll(mention, `<a href="https://github.com/${username}" target="_blank">${mention}</a>`);
                        });
                    }

                    // convert markdown to html
                    const converter = new showdown.Converter();
                    releaseNotes = converter.makeHtml(releaseNotes);

                    this.dialog.open(ChangeLogDialog, {
                        data: {
                            title: releaseVersion,
                            message: releaseNotes,
                            type: 'info'
                        }
                    });

                }
                this.localStorage.store('releaseVersion', releaseVersion);
            })
    }
}
