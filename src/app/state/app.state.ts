import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {RobotSelector, RobotType} from '../domain/robot.type';
import { map, filter } from 'rxjs/operators';
import { Language } from '../domain/language';
import { CodeEditorType } from '../domain/code-editor.type';
import { LocalStorageService } from '../services/localstorage.service';
import { MatDialog } from '@angular/material/dialog';
import { SelectRobotTypeDialog } from '../modules/core/dialogs/robot-select/robot-select.dialog';
import { version } from '../../../package.json';
import Avrdude from "../services/arduino-uploader/protocols/avrdude";
import DFU from "../services/arduino-uploader/protocols/dfu";
import Pico from "../services/arduino-uploader/protocols/pico";

@Injectable({
    providedIn: 'root'
})
export class AppState {
    /* eslint-disable max-len */
    private static defaultLibraries = [
        'Leaphy Original Extension', 'Leaphy Extra Extension', 'Servo', 'Adafruit GFX Library', 'Adafruit SSD1306', 'Adafruit LSM9DS1 Library',
        'Adafruit Unified Sensor', 'List', 'Adafruit SGP30 Sensor', 'Adafruit_VL53L0X', 'Adafruit BMP280 Library', 'TM1637', 'LedControl'
    ]
    private static leaphyOriginalRobotType = new RobotType(
        'l_original_uno',
        Avrdude,
        'Leaphy Original',
        'orig.svg',
        'arduino:avr:uno',
        'arduino:avr',
        AppState.defaultLibraries.concat(['QMC5883LCompass', 'Arduino_APDS9960']),
        {
            showLeaphyActuators: true,
            showLeaphyOperators: false,
            showLeaphySensors: true,
        },
        'atmega328p'
    );
    private static leaphyOriginalNanoRobotType = new RobotType(
        'l_original_nano',
        Avrdude,
        'Original Nano',
        'orig.svg',
        'arduino:avr:nano',
        'arduino:avr',
        AppState.defaultLibraries.concat(['QMC5883LCompass', 'Arduino_APDS9960']),
        {
            showLeaphyActuators: true,
            showLeaphyOperators: true,
            showLeaphySensors: true,
        },
        'atmega328p',
    );
    private static leaphyOriginalNanoESP32RobotType = new RobotType(
        'l_original_nano_esp32',
        DFU,
        'Original Nano ESP32',
        'orig.svg',
        'arduino:esp32:nano_nora',
        'arduino:esp32',
        AppState.defaultLibraries.concat(['QMC5883LCompass', 'Arduino_APDS9960']),
        {
            showLeaphyActuators: true,
            showLeaphyOperators: true,
            showLeaphySensors: true,
        },
    );
    private static leaphyOriginalNanoRP2040RobotType = new RobotType(
        'l_original_nano_esp32',
        Pico,
        'Original Nano RP2040',
        'orig.svg',
        'arduino:mbed_nano:nanorp2040connect',
        'arduino:mbed_nano',
        AppState.defaultLibraries.concat(['QMC5883LCompass', 'Arduino_APDS9960']),
        {
            showLeaphyActuators: true,
            showLeaphyOperators: true,
            showLeaphySensors: true,
        },
    );
    private static leaphyFlitzRobotType = new RobotType(
        'l_flitz_uno',
        Avrdude,
        'Leaphy Flitz',
        'flitz.svg',

        'arduino:avr:uno',
        'arduino:avr',
        AppState.defaultLibraries,
        {
            showLeaphyActuators: false,
            showLeaphyOperators: false,
        },
        'atmega328p',
    );
    private static leaphyFlitzNanoRobotType = new RobotType(
        'l_flitz_nano',
        Avrdude,
        'Flitz Nano',
        'flitz_nano.svg',
        'arduino:avr:nano',
        'arduino:avr',
        AppState.defaultLibraries,
        {
            showLeaphyActuators: false,
            showLeaphyOperators: false,
        },
        'atmega328p',
    );
    private static leaphyClickRobotType = new RobotType(
        'l_click',
        Avrdude,
        'Leaphy Click',
        'click.svg',
        'arduino:avr:uno',
        'arduino:avr',
        AppState.defaultLibraries,
        {
            showLeaphySensors: true,
        },
        'atmega328p',
    );
    private static arduinoUnoRobotType = new RobotType(
        'l_uno',
        Avrdude,
        'Arduino Uno',
        'uno.svg',
        'arduino:avr:uno',
        'arduino:avr',
        AppState.defaultLibraries.concat(['QMC5883LCompass', 'Arduino_APDS9960']),
        {
            showLeaphyLists: true,
            showLeaphySensors: true,
        },
        'atmega328p',
    );

    public static genericRobotType = new RobotType(
        'l_code',
        Avrdude,
        'Leaphy C++',
        "c++.svg",
        'arduino:avr:uno',
        'arduino:avr',
        AppState.defaultLibraries.concat(['QMC5883LCompass', 'Arduino_APDS9960']),
        {},
        'atmega328p'
    );
    private static arduinoNanoRobotType = new RobotType(
        'l_nano',
        Avrdude,
        'Arduino Nano',
        'nano.svg',
        'arduino:avr:nano',
        'arduino:avr',
        AppState.defaultLibraries.concat(['QMC5883LCompass', 'Arduino_APDS9960']),
        {
            showLeaphyLists: true,
            showLeaphySensors: true,
        },
        'atmega328p',
    );
    private static arduinoNanoESP32RobotType = new RobotType(
        'l_nano_esp32', DFU,
        'Arduino Nano ESP32',
        'nano.svg',
        'arduino:esp32:nano_nora',
        'arduino:esp32',
        AppState.defaultLibraries.concat(['QMC5883LCompass', 'Arduino_APDS9960']),
        {
            showLeaphyLists: true,
            showLeaphySensors: true,
        }
    );
    private static arduinoNanoRP2040RobotType = new RobotType(
        'l_nano_rp2040', Pico,
        'Arduino Nano RP2040',
        'nano.svg',
        'arduino:mbed_nano:nanorp2040connect',
        'arduino:mbed_nano',
        AppState.defaultLibraries.concat(['QMC5883LCompass', 'Arduino_APDS9960']),
        {
            showLeaphyLists: true,
            showLeaphySensors: true,
        }
    );
    public static microPythonRobotType = new RobotType(
        'l_micropython',
        Avrdude,
        'MicroPython',
        'micropython.svg',
        '',
        '',
        [],
        {
            showLeaphyActuators: false,
            showLeaphyOperators: false,
        });
    private static arduinoMegaRobotType = new RobotType(
        'l_mega',
        Avrdude,
        'Arduino Mega',
        'mega.svg',
        'arduino:avr:mega',
        'arduino:avr',
        AppState.defaultLibraries.concat(['QMC5883LCompass', 'Arduino_APDS9960']),
        {
            showLeaphyLists: true,
            showLeaphySensors: true,
        },
        'atmega2560',
    )

    public static idToRobotType = {
        'l_original_uno': AppState.leaphyOriginalRobotType,
        'l_original_nano': AppState.leaphyOriginalNanoRobotType,
        'l_original_nano_esp32': AppState.leaphyOriginalNanoESP32RobotType,
        'l_original_nano_rp2040': AppState.leaphyOriginalNanoRP2040RobotType,
        'l_flitz_uno': AppState.leaphyFlitzRobotType,
        'l_click': AppState.leaphyClickRobotType,
        'l_uno': AppState.arduinoUnoRobotType,
        'l_code': AppState.genericRobotType,
        'l_flitz_nano': AppState.leaphyFlitzNanoRobotType,
        'l_nano': AppState.arduinoNanoRobotType,
        'l_nano_esp32': AppState.arduinoNanoESP32RobotType,
        'l_nano_rp2040': AppState.arduinoNanoRP2040RobotType,
        'l_micropython': AppState.microPythonRobotType,
        'l_mega': AppState.arduinoMegaRobotType,
    }

    private static robotSelectors: RobotSelector[] = [
        {
            intercept: AppState.leaphyFlitzRobotType,
            choices: [
                {
                    name: 'Flitz Uno',
                    icon: 'flitz.svg',
                    robot: AppState.leaphyFlitzRobotType,
                },
                {
                    name: 'Flitz Nano',
                    icon: 'flitz.svg',
                    robot: AppState.leaphyFlitzNanoRobotType,
                }
            ]
        },
        {
            intercept: AppState.leaphyOriginalRobotType,
            choices: [
                {
                    name: 'Original Uno',
                    icon: 'orig.svg',
                    robot: AppState.leaphyOriginalRobotType,
                },
                {
                    name: 'Original Nano',
                    icon: 'orig.svg',
                    robot: AppState.leaphyOriginalNanoRobotType,
                },
                {
                    name: 'Original Nano ESP32',
                    icon: 'orig.svg',
                    robot: AppState.leaphyOriginalNanoESP32RobotType,
                },
                {
                    name: 'Original Nano RP2040',
                    icon: 'orig.svg',
                    robot: AppState.leaphyOriginalNanoRP2040RobotType,
                },
            ]
        },
        {
            intercept: AppState.arduinoNanoRobotType,
            choices: [
                {
                    name: 'Arduino Nano',
                    icon: 'nano.svg',
                    robot: AppState.arduinoNanoRobotType,
                },
                {
                    name: 'Arduino Nano ESP32',
                    icon: 'nano.svg',
                    robot: AppState.arduinoNanoESP32RobotType,
                },
                {
                    name: 'Arduino Nano RP2040',
                    icon: 'nano.svg',
                    robot: AppState.arduinoNanoRP2040RobotType,
                },
            ]
        }
    ]

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
                    return [AppState.leaphyFlitzRobotType, AppState.leaphyOriginalRobotType, AppState.leaphyClickRobotType, AppState.arduinoNanoRobotType, AppState.arduinoUnoRobotType, AppState.arduinoMegaRobotType]
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

    public setSelectedRobotType(robotType: RobotType, skipPopup: boolean = false) {
        // Intercept robots and ask what type of robot: nano, or uno
        const selector = AppState.robotSelectors.find(({ intercept }) => intercept === robotType);
        if (!selector || skipPopup) return this.selectedRobotTypeSubject$.next(robotType);

        this.dialog.open(SelectRobotTypeDialog, {
            width: '250px',
            data: {
                boardTypes: selector.choices.map(({ name }) => name),
                icons: selector.choices.map(({ icon }) => icon)
            }
        }).afterClosed().subscribe((result: string) => {
            const selected = selector.choices.find(({ name }) => name === result)

            if (!selected) return;
            this.selectedRobotTypeSubject$.next(selected.robot);
        });
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
