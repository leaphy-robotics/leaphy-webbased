import { Injectable } from "@angular/core";
import { AppState } from "../state/app.state";
import { TranslateService } from "@ngx-translate/core";
import { filter, withLatestFrom } from "rxjs/operators";
import { Router } from "@angular/router";
import { CodeEditorType } from "../domain/code-editor.type";
import { LocalStorageService } from "../services/localstorage.service";
import { MatDialog } from "@angular/material/dialog";
import { ChangeLogDialog } from "../modules/core/dialogs/change-log/change-log.dialog";
import showdown from "showdown";
import { WorkspaceService } from "../services/workspace.service";
import {BlocklyEditorEffects} from "./blockly-editor.effects";

@Injectable({
    providedIn: "root",
})
export class AppEffects {
    constructor(
        private appState: AppState,
        private translate: TranslateService,
        private router: Router,
        private localStorage: LocalStorageService,
        private dialog: MatDialog,
        private workspaceService: WorkspaceService,
        private blocklyEffects: BlocklyEditorEffects,
    ) {
        this.appState.selectedTheme = localStorage.fetch("theme") || "light";

        this.appState.selectedTheme$
            .pipe(filter((theme) => !!theme))
            .subscribe((theme) => {
                document.getElementsByTagName("body")[0].setAttribute(
                    "data-theme",
                    theme,
                );

                document.getElementsByTagName("body")[0].setAttribute(
                    "data-bs-theme",
                    theme
                );

                localStorage.store("theme", theme);
                if (this.appState.selectedCodeEditor == CodeEditorType.Beginner) {
                    this.blocklyEffects.loadTheme();
                }
            });

        // Use the current language to translate the angular strings
        this.appState.currentLanguage$
            .pipe(filter((language) => !!language))
            .subscribe((language) => this.translate.use(language.code));

        // When the editor change has been confirmed, toggle the code-editor
        this.appState.isCodeEditorToggleConfirmed$
            .pipe(
                filter((isToggled) => !!isToggled),
                withLatestFrom(this.appState.codeEditor$),
            )
            .subscribe(([, codeEditorType]) => {
                if (codeEditorType == CodeEditorType.Beginner) {
                    this.appState.selectedCodeEditor = CodeEditorType.CPP;
                } else if (codeEditorType == CodeEditorType.CPP) {
                    this.appState.selectedCodeEditor = CodeEditorType.Beginner;
                }
            });

        // When the code editor changes, route to the correct screen
        this.appState.codeEditor$
            .pipe(filter((codeEditor) => !!codeEditor))
            .subscribe(async (codeEditor) => {
                switch (codeEditor) {
                    case CodeEditorType.Beginner:
                        await this.router.navigate(["/blocks"], {
                            skipLocationChange: true,
                        });
                        break;
                    case CodeEditorType.CPP:
                        await this.router.navigate(["/cppEditor"], {
                            skipLocationChange: true,
                        });
                        break;
                    case CodeEditorType.Python:
                        await this.router.navigate(["/pythonEditor"], {
                            skipLocationChange: true,
                        });
                        break;
                    default:
                        break;
                }
                this.appState.isCodeEditorToggleConfirmed = false;
            });

        this.appState.releaseInfo$
            .pipe(filter((releaseInfo) => !!releaseInfo))
            .subscribe((releaseInfo) => {
                const releaseVersion = this.appState.releaseVersion;
                if (!releaseVersion) {
                    return;
                }
                try {
                    this.localStorage.fetch("releaseVersion");
                } catch (e) {
                    this.localStorage.store("releaseVersion", "");
                }

                if (
                    releaseVersion != this.localStorage.fetch("releaseVersion")
                ) {
                    let releaseNotes = releaseInfo["body"];
                    // convert all the urls to links
                    // first find the urls
                    let urls = releaseNotes.match(/(https?:\/\/[\S]+)/g);
                    // then replace them with links
                    if (urls) {
                        // to prevent infinite loops we want to know the index of the last url we replaced
                        let lastUrlIndex = 0;
                        urls.forEach((url) => {
                            const link = `<a href="${url}" target="_blank">${url}</a>`;
                            releaseNotes =
                                releaseNotes.substring(
                                    0,
                                    releaseNotes.indexOf(url, lastUrlIndex),
                                ) +
                                link +
                                releaseNotes.substring(
                                    releaseNotes.indexOf(url, lastUrlIndex) +
                                        url.length,
                                );
                            lastUrlIndex =
                                releaseNotes.indexOf(link, lastUrlIndex) +
                                link.length;
                        });
                    }
                    // turn the @mentions into links
                    // first find the @mentions
                    let mentions = releaseNotes.match(/@(\w+)/g);
                    // then replace them with links
                    if (mentions) {
                        mentions.forEach((mention) => {
                            const username = mention.substring(1);
                            releaseNotes = releaseNotes.replaceAll(
                                mention,
                                `<a href="https://github.com/${username}" target="_blank">${mention}</a>`,
                            );
                        });
                    }

                    // convert markdown to html
                    const converter = new showdown.Converter();
                    releaseNotes = converter.makeHtml(releaseNotes);

                    this.dialog.open(ChangeLogDialog, {
                        data: {
                            title: releaseVersion,
                            message: releaseNotes,
                            type: "info",
                        },
                    });
                }
                this.localStorage.store("releaseVersion", releaseVersion);

                const robotId = this.localStorage.fetch("changedLanguage");
                if (robotId) {
                    this.localStorage.store("changedLanguage", "");
                    this.workspaceService
                        .forceRestoreWorkspaceTemp()
                        .then(() => {});
                }
            });
    }
}
