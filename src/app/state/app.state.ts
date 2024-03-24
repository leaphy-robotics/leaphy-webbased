import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
    arduinoMegaRobotType, arduinoNanoESP32RobotType,
    arduinoNanoRobotType, arduinoNanoRP2040RobotType,
    arduinoUnoRobotType,
    genericRobotType,
    leaphyClickRobotType,
    leaphyFlitzNanoRobotType,
    leaphyFlitzRobotType,
    leaphyOriginalNanoESP32RobotType,
    leaphyOriginalNanoRobotType,
    leaphyOriginalNanoRP2040RobotType,
    leaphyOriginalRobotType,
    microPythonRobotType,
} from '../domain/robots';
import { RobotType, RobotSelector } from '../domain/robot.type';
import { map, filter } from 'rxjs/operators';
import { Language } from '../domain/language';
import { CodeEditorType } from '../domain/code-editor.type';
import { LocalStorageService } from '../services/localstorage.service';
import { version } from '../../../package.json';

@Injectable({
    providedIn: 'root'
})
export class AppState {
    /* eslint-disable max-len */


    public static idToRobotType = {
        'l_original_uno': leaphyOriginalRobotType,
        'l_original_nano': leaphyOriginalNanoRobotType,
        'l_original_nano_esp32': leaphyOriginalNanoESP32RobotType,
        'l_original_nano_rp2040': leaphyOriginalNanoRP2040RobotType,
        'l_flitz_uno': leaphyFlitzRobotType,
        'l_click': leaphyClickRobotType,
        'l_uno': arduinoUnoRobotType,
        'l_code': genericRobotType,
        'l_flitz_nano': leaphyFlitzNanoRobotType,
        'l_nano': arduinoNanoRobotType,
        'l_nano_esp32': arduinoNanoESP32RobotType,
        'l_nano_rp2040': arduinoNanoRP2040RobotType,
        'l_micropython': microPythonRobotType,
        'l_mega': arduinoMegaRobotType,
    }

    private static robotSelectors: RobotSelector[] = [
        {
            intercept: leaphyFlitzRobotType,
            choices: [[
                {
                    name: 'Flitz Uno',
                    icon: 'flitz.svg',
                    robot: leaphyFlitzRobotType,
                },
                {
                    name: 'Flitz Nano',
                    icon: 'flitz.svg',
                    robot: leaphyFlitzNanoRobotType,
                }
            ]]
        },
        {
            intercept: leaphyOriginalRobotType,
            choices: [
                [
                    {
                        name: 'Original Uno',
                        icon: 'orig.svg',
                        robot: leaphyOriginalRobotType,
                    },
                    {
                        name: 'Original Nano',
                        icon: 'orig.svg',
                        robot: leaphyOriginalNanoRobotType,
                    },
                ],
                [
                    {
                        name: 'Original Nano ESP32',
                        icon: 'orig.svg',
                        robot: leaphyOriginalNanoESP32RobotType,
                    },
                    {
                        name: 'Original Nano RP2040',
                        icon: 'orig.svg',
                        robot: leaphyOriginalNanoRP2040RobotType,
                    },
                ]
            ]
        },
        {
            intercept: arduinoNanoRobotType,
            choices: [[
                {
                    name: 'Arduino Nano',
                    icon: 'nano.svg',
                    robot: arduinoNanoRobotType,
                },
                {
                    name: 'Arduino Nano ESP32',
                    icon: 'nano.svg',
                    robot: arduinoNanoESP32RobotType,
                },
                {
                    name: 'Arduino Nano RP2040',
                    icon: 'nano.svg',
                    robot: arduinoNanoRP2040RobotType,
                },
            ]]
        }
    ]

    public releaseInfoSubject$ = new BehaviorSubject<any>(null);
    public releaseInfo$: Observable<any> = this.releaseInfoSubject$.asObservable();

    public releaseVersionSubject$ = new BehaviorSubject<string>(version);
    public releaseVersion$: Observable<string> = this.releaseVersionSubject$.asObservable();

    private robotChoiceSubject$ = new BehaviorSubject<RobotSelector>(null)
    public robotChoice$ = this.robotChoiceSubject$.asObservable()


    /* eslint-enable max-len */

    private defaultLanguage = new Language('nl', 'Nederlands')
    private availableLanguages = [new Language('en', 'English'), this.defaultLanguage]

    constructor(private localStorage: LocalStorageService) {

        this.isDesktopSubject$ = new BehaviorSubject<boolean>(true);
        this.isDesktop$ = this.isDesktopSubject$.asObservable();
        this.availableRobotTypes$ = this.isDesktop$
            .pipe(map(isDesktop => {
                if (isDesktop) {
                    return [
                        [leaphyFlitzRobotType, leaphyOriginalRobotType, leaphyClickRobotType],
                        [arduinoNanoRobotType, arduinoUnoRobotType, arduinoMegaRobotType],
                        [genericRobotType, microPythonRobotType],
                    ]
                } else {}
            }));

        const currentLanguage = this.localStorage.fetch<Language>('currentLanguage') || this.defaultLanguage;
        this.currentLanguageSubject$ = new BehaviorSubject(currentLanguage);
        this.currentLanguage$ = this.currentLanguageSubject$.asObservable();

        this.canChangeCodeEditor$ = this.selectedRobotType$
            .pipe(filter(robotType => !!robotType))
            .pipe(map(robotType => robotType !== genericRobotType));
    }

    private isDesktopSubject$: BehaviorSubject<boolean>;
    public isDesktop$: Observable<boolean>;

    public availableRobotTypes$: Observable<RobotType[][]>;

    private selectedRobotTypeSubject$ = new BehaviorSubject<RobotType>(null);
    public selectedRobotType$ = this.selectedRobotTypeSubject$.asObservable();

    private availableLanguagesSubject$ = new BehaviorSubject<Language[]>(this.availableLanguages);
    public availableLanguages$ = this.availableLanguagesSubject$.asObservable();

    private currentLanguageSubject$: BehaviorSubject<Language>;
    public currentLanguage$: Observable<Language>

    private changedLanguageSubject$ = new BehaviorSubject(null);
    public changedLanguage$ = this.changedLanguageSubject$.asObservable();

    private isCodeEditorToggleConfirmedSubject$ = new BehaviorSubject<boolean>(false);
    public isCodeEditorToggleConfirmed$ = this.isCodeEditorToggleConfirmedSubject$.asObservable();

    private codeEditorSubject$ = new BehaviorSubject<CodeEditorType>(CodeEditorType.None);
    public codeEditor$ = this.codeEditorSubject$.asObservable();

    public canChangeCodeEditor$: Observable<boolean>;

    public setSelectedRobotType(robotType: RobotType, skipPopup: boolean = false) {
        if (robotType === null) this.robotChoiceSubject$.next(null)

        // Intercept robots and ask what type of robot: nano, or uno
        const selector = AppState.robotSelectors.find(({ intercept }) => intercept === robotType);
        if (!selector || skipPopup) return this.selectedRobotTypeSubject$.next(robotType);

        this.robotChoiceSubject$.next(selector)
    }

    public setChangedLanguage(language: Language) {
        this.localStorage.store('currentLanguage', language);
        this.changedLanguageSubject$.next(language);
    }

    public setCurrentLanguage(language: Language) {
        this.localStorage.store('currentLanguage', language);
        this.currentLanguageSubject$.next(language);
    }

    public switchCodeEditor() {
        if (this.codeEditorSubject$.getValue() == CodeEditorType.Beginner) {
            this.codeEditorSubject$.next(CodeEditorType.CPP);
        }
        else if (this.codeEditorSubject$.getValue() == CodeEditorType.CPP) {
            this.codeEditorSubject$.next(CodeEditorType.Beginner);
        }
    }

    public setIsCodeEditorToggleConfirmed(confirmed: boolean) {
        this.isCodeEditorToggleConfirmedSubject$.next(confirmed);
    }

    public setSelectedCodeEditor(codeEditor: CodeEditorType) {
        this.codeEditorSubject$.next(codeEditor);
    }

    public getCurrentLanguageCode(): string {
        return this.currentLanguageSubject$.getValue().code;
    }

    public getCurrentEditor(): CodeEditorType {
        return this.codeEditorSubject$.getValue();
    }

    public getSelectedRobotType(): RobotType {
        return this.selectedRobotTypeSubject$.getValue();
    }

    public getReleaseVersion(): string {
        return this.releaseVersionSubject$.getValue();
    }
}
