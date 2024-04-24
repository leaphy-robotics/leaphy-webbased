import { Injectable } from "@angular/core";
import { BehaviorSubject, firstValueFrom, Observable } from "rxjs";
import {
    arduinoMegaRobotType,
    arduinoNanoESP32RobotType,
    arduinoNanoRobotType,
    arduinoNanoRP2040RobotType,
    arduinoUnoRobotType,
    genericRobots,
    genericRobotType,
    leaphyClickRobotType,
    leaphyFlitzNanoRobotType,
    leaphyFlitzRobotType,
    leaphyOriginalNanoESP32RobotType,
    leaphyOriginalNanoRobotType,
    leaphyOriginalNanoRP2040RobotType,
    leaphyOriginalRobotType,
    microPythonRobotType,
} from "../domain/robots";
import { RobotType, RobotSelector } from "../domain/robot.type";
import { map, filter } from "rxjs/operators";
import { Language } from "../domain/language";
import { CodeEditorType } from "../domain/code-editor.type";
import { LocalStorageService } from "../services/localstorage.service";
import { version } from "../../../package.json";
import { MatDialog } from "@angular/material/dialog";
import * as Blockly from "blockly/core";
import { VariableDialog } from "../modules/core/dialogs/variable/variable.dialog";

@Injectable({
    providedIn: "root",
})
export class AppState {
    /* eslint-disable max-len */

    public robotRows: RobotType[][] = [
        [leaphyFlitzRobotType, leaphyOriginalRobotType, leaphyClickRobotType],
        [arduinoNanoRobotType, arduinoUnoRobotType, arduinoMegaRobotType],
        [genericRobotType, microPythonRobotType],
    ];

    public static idToRobotType = {
        l_original_uno: leaphyOriginalRobotType,
        l_original_nano: leaphyOriginalNanoRobotType,
        l_original_nano_esp32: leaphyOriginalNanoESP32RobotType,
        l_original_nano_rp2040: leaphyOriginalNanoRP2040RobotType,
        l_flitz_uno: leaphyFlitzRobotType,
        l_click: leaphyClickRobotType,
        l_uno: arduinoUnoRobotType,
        l_code: genericRobotType,
        l_flitz_nano: leaphyFlitzNanoRobotType,
        l_nano: arduinoNanoRobotType,
        l_nano_esp32: arduinoNanoESP32RobotType,
        l_nano_rp2040: arduinoNanoRP2040RobotType,
        l_micropython: microPythonRobotType,
        l_mega: arduinoMegaRobotType,
    };

    private static robotSelectors: RobotSelector[] = [
        {
            intercept: leaphyFlitzRobotType,
            choices: [
                [
                    {
                        name: "Flitz Uno",
                        icon: "flitz.svg",
                        robot: leaphyFlitzRobotType,
                    },
                    {
                        name: "Flitz Nano",
                        icon: "flitz.svg",
                        robot: leaphyFlitzNanoRobotType,
                    },
                ],
            ],
        },
        {
            intercept: leaphyOriginalRobotType,
            choices: [
                [
                    {
                        name: "Original Uno",
                        icon: "orig.svg",
                        robot: leaphyOriginalRobotType,
                    },
                    {
                        name: "Original Nano",
                        icon: "orig.svg",
                        robot: leaphyOriginalNanoRobotType,
                    },
                ],
                [
                    {
                        name: "Original Nano ESP32",
                        icon: "orig.svg",
                        robot: leaphyOriginalNanoESP32RobotType,
                    },
                    {
                        name: "Original Nano RP2040",
                        icon: "orig.svg",
                        robot: leaphyOriginalNanoRP2040RobotType,
                    },
                ],
            ],
        },
        {
            intercept: arduinoNanoRobotType,
            choices: [
                [
                    {
                        name: "Arduino Nano",
                        icon: "nano.svg",
                        robot: arduinoNanoRobotType,
                    },
                    {
                        name: "Arduino Nano ESP32",
                        icon: "nano.svg",
                        robot: arduinoNanoESP32RobotType,
                    },
                    {
                        name: "Arduino Nano RP2040",
                        icon: "nano.svg",
                        robot: arduinoNanoRP2040RobotType,
                    },
                ],
            ],
        },
    ];

    public releaseInfoSubject$ = new BehaviorSubject<any>(null);
    public releaseInfo$: Observable<any> =
        this.releaseInfoSubject$.asObservable();

    private robotChoiceSubject$ = new BehaviorSubject<RobotSelector>(null);
    public robotChoice$ = this.robotChoiceSubject$.asObservable();

    /* eslint-enable max-len */

    public static defaultLanguage = new Language("nl", "Nederlands");
    public static availableLanguages = [
        new Language("en", "English"),
        AppState.defaultLanguage,
    ];

    constructor(
        private localStorage: LocalStorageService,
        private dialog: MatDialog,
    ) {
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

        const currentLanguage =
            this.localStorage.fetch<Language>("currentLanguage") ||
            AppState.defaultLanguage;
        this.currentLanguageSubject$ = new BehaviorSubject(currentLanguage);
        this.currentLanguage$ = this.currentLanguageSubject$.asObservable();

        this.canChangeCodeEditor$ = this.selectedRobotType$
            .pipe(filter((robotType) => !!robotType))
            .pipe(
                map(
                    (robotType) =>
                        !(
                            genericRobots.includes(robotType) ||
                            robotType === genericRobotType
                        ),
                ),
            );
    }

    private selectedRobotTypeSubject$ = new BehaviorSubject<RobotType>(null);
    public selectedRobotType$ = this.selectedRobotTypeSubject$.asObservable();

    private currentLanguageSubject$: BehaviorSubject<Language>;
    public currentLanguage$: Observable<Language>;

    private changedLanguageSubject$ = new BehaviorSubject(null);
    public changedLanguage$ = this.changedLanguageSubject$.asObservable();

    private isCodeEditorToggleConfirmedSubject$ = new BehaviorSubject<boolean>(
        false,
    );
    public isCodeEditorToggleConfirmed$ =
        this.isCodeEditorToggleConfirmedSubject$.asObservable();

    private codeEditorSubject$ = new BehaviorSubject<CodeEditorType>(
        CodeEditorType.None,
    );
    public codeEditor$ = this.codeEditorSubject$.asObservable();

    public canChangeCodeEditor$: Observable<boolean>;

    public setSelectedRobotType(
        robotType: RobotType,
        skipPopup: boolean = false,
    ) {
        if (robotType === null) this.robotChoiceSubject$.next(null);

        // Intercept robots and ask what type of robot: nano, or uno
        const selector = AppState.robotSelectors.find(
            ({ intercept }) => intercept === robotType,
        );
        if (!selector || skipPopup)
            return this.selectedRobotTypeSubject$.next(robotType);

        this.robotChoiceSubject$.next(selector);
    }

    set changedLanguage(language: Language) {
        this.localStorage.store("currentLanguage", language);
        this.changedLanguageSubject$.next(language);
    }

    set currentLanguage(language: Language) {
        this.localStorage.store("currentLanguage", language);
        this.currentLanguageSubject$.next(language);
    }

    set isCodeEditorToggleConfirmed(confirmed: boolean) {
        this.isCodeEditorToggleConfirmedSubject$.next(confirmed);
    }

    get selectedCodeEditor(): CodeEditorType {
        return this.codeEditorSubject$.getValue();
    }

    set selectedCodeEditor(codeEditor: CodeEditorType) {
        this.codeEditorSubject$.next(codeEditor);
    }

    get currentLanguageCode(): string {
        return this.currentLanguageSubject$.getValue().code;
    }

    get currentEditor(): CodeEditorType {
        return this.codeEditorSubject$.getValue();
    }

    get selectedRobotType(): RobotType {
        return this.selectedRobotTypeSubject$.getValue();
    }

    get releaseVersion(): string {
        return version;
    }
}
