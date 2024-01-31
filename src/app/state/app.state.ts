import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { RobotType } from '../domain/robot.type';
import { map, filter } from 'rxjs/operators';
import { Language } from '../domain/language';
import { CodeEditorType } from '../domain/code-editor.type';
import { LocalStorageService } from '../services/localstorage.service';
import { MatDialog } from '@angular/material/dialog';
import { SelectRobotTypeDialog } from '../modules/core/dialogs/robot-select/robot-select.dialog';
import { version } from '../../../package.json';

@Injectable({
    providedIn: 'root'
})
export class AppState {
    /* eslint-disable max-len */
    private static defaultLibraries = [
        'Leaphy Original Extension', 'Leaphy Extra Extension', 'Servo', 'Adafruit GFX Library', 'Adafruit SSD1306', 'Adafruit LSM9DS1 Library', 'Adafruit Unified Sensor'
    ]
    private static leaphyOriginalRobotType = new RobotType('l_original_uno', 'Leaphy Original', 'orig.svg', 'Arduino UNO', 'arduino:avr:uno', 'hex', 'arduino:avr',
        AppState.defaultLibraries.concat(['QMC5883LCompass', 'Arduino_APDS9960'])
    );
    private static leaphyFlitzRobotType = new RobotType('l_flitz_uno', 'Leaphy Flitz', 'flitz.svg', 'Arduino UNO', 'arduino:avr:uno', 'hex', 'arduino:avr',
        AppState.defaultLibraries, true, false
    );
    private static leaphyFlitzNanoRobotType = new RobotType('l_flitz_nano', 'Flitz Nano', 'flitz_nano.svg', 'Arduino Nano', 'arduino:avr:nano', 'hex', 'arduino:avr',
        AppState.defaultLibraries, true, false
    );
    private static leaphyClickRobotType = new RobotType('l_click', 'Leaphy Click', 'click.svg', 'Arduino UNO', 'arduino:avr:uno', 'hex', 'arduino:avr',
        AppState.defaultLibraries
    );
    private static arduinoUnoRobotType = new RobotType('l_uno', 'Arduino Uno', 'uno.svg', 'Arduino UNO', 'arduino:avr:uno', 'hex', 'arduino:avr',
        AppState.defaultLibraries.concat(['QMC5883LCompass', 'Arduino_APDS9960'])
    );
    public static genericRobotType = new RobotType('l_code', 'Leaphy C++', "c++.svg", 'Arduino UNO', 'arduino:avr:uno', 'hex', 'arduino:avr',
    AppState.defaultLibraries.concat(['QMC5883LCompass', 'Arduino_APDS9960'])
    );
    private static arduinoNanoRobotType = new RobotType('l_nano', 'Arduino Nano', 'nano.svg', 'Arduino NANO', 'arduino:avr:nano', 'hex', 'arduino:avr',
        AppState.defaultLibraries.concat(['QMC5883LCompass', 'Arduino_APDS9960'])
    );
    public static microPythonRobotType = new RobotType('l_micropython', 'MicroPython', 'micropython.svg', 'MicroPython', '', 'bin', '',
        [], true, false);

    public static idToRobotType = {
        'l_original_uno': AppState.leaphyOriginalRobotType,
        'l_flitz_uno': AppState.leaphyFlitzRobotType,
        'l_click': AppState.leaphyClickRobotType,
        'l_uno': AppState.arduinoUnoRobotType,
        'l_code': AppState.genericRobotType,
        'l_flitz_nano': AppState.leaphyFlitzNanoRobotType,
        'l_nano': AppState.arduinoNanoRobotType,
        'l_micropython': AppState.microPythonRobotType
    }

    public releaseInfoSubject$ = new BehaviorSubject<any>(null);
    public releaseInfo$: Observable<any> = this.releaseInfoSubject$.asObservable();

    public releaseVersionSubject$ = new BehaviorSubject<string>(version);
    public releaseVersion$: Observable<string> = this.releaseVersionSubject$.asObservable();


    /* eslint-enable max-len */

    private defaultLanguage = new Language('nl', 'Nederlands')
    private availableLanguages = [new Language('en', 'English'), this.defaultLanguage]

    constructor(private localStorage: LocalStorageService, private dialog: MatDialog) {

        this.isDesktopSubject$ = new BehaviorSubject<boolean>(true);
        this.isDesktop$ = this.isDesktopSubject$.asObservable();
        this.availableRobotTypes$ = this.isDesktop$
            .pipe(map(isDesktop => {
                if (isDesktop) {
                    return [AppState.leaphyFlitzRobotType, AppState.leaphyOriginalRobotType, AppState.leaphyClickRobotType, AppState.arduinoUnoRobotType, AppState.arduinoNanoRobotType]
                } else {}
            }));

        const currentLanguage = this.localStorage.fetch<Language>('currentLanguage') || this.defaultLanguage;
        this.currentLanguageSubject$ = new BehaviorSubject(currentLanguage);
        this.currentLanguage$ = this.currentLanguageSubject$.asObservable();

        this.canChangeCodeEditor$ = this.selectedRobotType$
            .pipe(filter(robotType => !!robotType))
            .pipe(map(robotType => robotType !== AppState.genericRobotType));


    }

    private isDesktopSubject$: BehaviorSubject<boolean>;
    public isDesktop$: Observable<boolean>;

    public availableRobotTypes$: Observable<RobotType[]>;

    private selectedRobotTypeSubject$ = new BehaviorSubject<RobotType>(null);
    public selectedRobotType$ = this.selectedRobotTypeSubject$.asObservable();

    private availableLanguagesSubject$ = new BehaviorSubject<Language[]>(this.availableLanguages);
    public availableLanguages$ = this.availableLanguagesSubject$.asObservable();

    private currentLanguageSubject$: BehaviorSubject<Language>;
    public currentLanguage$: Observable<Language>

    private changedLanguageSubject$ = new BehaviorSubject(null);
    public changedLanguage$ = this.changedLanguageSubject$.asObservable();

    private showHelpPageSubject$ = new BehaviorSubject<boolean>(false);
    public showHelpPage$ = this.showHelpPageSubject$.asObservable();

    private isCodeEditorToggleConfirmedSubject$ = new BehaviorSubject<boolean>(false);
    public isCodeEditorToggleConfirmed$ = this.isCodeEditorToggleConfirmedSubject$.asObservable();

    private codeEditorSubject$ = new BehaviorSubject<CodeEditorType>(CodeEditorType.None);
    public codeEditor$ = this.codeEditorSubject$.asObservable();

    public canChangeCodeEditor$: Observable<boolean>;

    public setSelectedRobotType(robotType: RobotType) {
        // Intercept flitz robots and ask what type of flitz robot: nano, or uno
        if (robotType === AppState.leaphyFlitzRobotType) {
            this.dialog.open(SelectRobotTypeDialog, {
                width: '250px',
                data: { boardTypes: ["Flitz Uno", "Flitz Nano"], icons: ["flitz.svg", "flitz.svg"] }
            }).afterClosed().subscribe((result: string) => {
                if (result === "Flitz Uno") {
                    robotType = AppState.leaphyFlitzRobotType;
                } else if (result === "Flitz Nano") {
                    robotType = AppState.leaphyFlitzNanoRobotType;
                } else {
                    return;
                }
                this.selectedRobotTypeSubject$.next(robotType);
            });

        } else {
            this.selectedRobotTypeSubject$.next(robotType);
        }
    }

    public setChangedLanguage(language: Language) {
        this.localStorage.store('currentLanguage', language);
        this.changedLanguageSubject$.next(language);
    }

    public setCurrentLanguage(language: Language) {
        this.localStorage.store('currentLanguage', language);
        this.currentLanguageSubject$.next(language);
    }

    public setShowHelpPage(show: boolean) {
        this.showHelpPageSubject$.next(show);
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
