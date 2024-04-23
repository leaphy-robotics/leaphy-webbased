import Avrdude from "../services/arduino-uploader/protocols/avrdude";
import {BaseNano, BaseNanoESP32, BaseNanoRP2040, BaseUno, PinMapping, RobotType,} from "./robot.type";

const defaultLibraries = [
    "Leaphy Extensions",
    "Servo",
    "Adafruit GFX Library",
    "Adafruit SSD1306",
    "Adafruit LSM9DS1 Library",
    "Adafruit Unified Sensor",
    "List",
    "Adafruit SGP30 Sensor",
    "Adafruit_VL53L0X",
    "Adafruit BMP280 Library",
    "TM1637",
    "LedControl",
];

export const leaphyOriginalRobotType = new BaseUno(
    "l_original_uno",
    "Leaphy Original",
    "orig.svg",
    "orig_uno.svg",
    defaultLibraries.concat(["QMC5883LCompass", "Arduino_APDS9960"]),
    {
        showLeaphyActuators: true,
        showLeaphyOperators: false,
        showLeaphySensors: true,
    },
);

export const leaphyOriginalNanoRobotType = new BaseNano(
    "l_original_nano",
    "Original Nano",
    "orig.svg",
    "orig_nano.svg",
    defaultLibraries.concat(["QMC5883LCompass", "Arduino_APDS9960"]),
    {
        showLeaphyActuators: true,
        showLeaphyOperators: true,
        showLeaphySensors: true,
    },
);

export const leaphyOriginalNanoESP32RobotType = new BaseNanoESP32(
    "l_original_nano_esp32",
    "Original Nano ESP32",
    "orig.svg",
    "orig_nano_esp32.svg",
    defaultLibraries.concat(["QMC5883LCompass", "Arduino_APDS9960"]),
    {
        showLeaphyActuators: true,
        showLeaphyOperators: true,
        showLeaphySensors: true,
    },
);

export const leaphyOriginalNanoRP2040RobotType = new BaseNanoRP2040(
    "l_original_nano_rp2040",
    "Original Nano RP2040",
    "orig.svg",
    "orig_nano_rp2040.svg",
    defaultLibraries.concat(["QMC5883LCompass", "Arduino_APDS9960"]),
    {
        showLeaphyActuators: true,
        showLeaphyOperators: true,
        showLeaphySensors: true,
    },
);

export const leaphyFlitzRobotType = new BaseUno(
    "l_flitz_uno",
    "Leaphy Flitz",
    "flitz.svg",
    "flitz_uno.svg",
    defaultLibraries,
    {
        showLeaphyActuators: false,
        showLeaphyOperators: false,
    },
);

export const leaphyFlitzNanoRobotType = new BaseNano(
    "l_flitz_nano",
    "Flitz Nano",
    "flitz.svg",
    "flitz_nano.svg",
    defaultLibraries,
    {
        showLeaphyActuators: false,
        showLeaphyOperators: false,
    },
);

export const leaphyClickRobotType = new BaseUno(
    "l_click",
    "Leaphy Click",
    "click.svg",
    null,
    defaultLibraries,
    {
        showLeaphySensors: true,
    },
);

export const arduinoUnoRobotType = new BaseUno(
    "l_uno",
    "Arduino Uno",
    "uno.svg",
    null,
    defaultLibraries.concat(["QMC5883LCompass", "Arduino_APDS9960"]),
    {
        showLeaphyLists: true,
        showLeaphySensors: true,
    },
);

export const arduinoNanoRobotType = new BaseNano(
    "l_nano",
    "Arduino Nano",
    "nano.svg",
    null,
    defaultLibraries.concat(["QMC5883LCompass", "Arduino_APDS9960"]),
    {
        showLeaphyLists: true,
        showLeaphySensors: true,
    },
);

export const arduinoNanoESP32RobotType = new BaseNanoESP32(
    "l_nano_esp32",
    "Arduino Nano ESP32",
    "nano.svg",
    null,
    defaultLibraries.concat(["QMC5883LCompass", "Arduino_APDS9960"]),
    {
        showLeaphyLists: true,
        showLeaphySensors: true,
    },
);

export const arduinoNanoRP2040RobotType = new BaseNanoRP2040(
    "l_nano_rp2040",
    "Arduino Nano RP2040",
    "nano.svg",
    null,
    defaultLibraries.concat(["QMC5883LCompass", "Arduino_APDS9960"]),
    {
        showLeaphyLists: true,
        showLeaphySensors: true,
    },
);

export const microPythonRobotType = new RobotType(
    "l_micropython",
    { protocol: Avrdude },
    PinMapping.NANO,
    "MicroPython",
    "micropython.svg",
    null,
    "",
    "",
    [],
    {
        showLeaphyActuators: false,
        showLeaphyOperators: false,
    },
);

export const arduinoMegaRobotType = new RobotType(
    "l_mega",
    { protocol: Avrdude, microcontroller: "atmega2560" },
    PinMapping.MEGA,
    "Arduino Mega",
    "mega.svg",
    null,
    "arduino:avr:mega",
    "arduino:avr",
    defaultLibraries.concat(["QMC5883LCompass", "Arduino_APDS9960"]),
    {
        showLeaphyLists: true,
        showLeaphySensors: true,
    },
);

/* Generic robots for the C++ code editor */

export const genericRobotType = new BaseUno(
    "l_code",
    "Leaphy C++",
    "c++.svg",
    null,
    [],
);

export const arduinoUnoRobotTypeGeneric = new BaseUno(
    "l_uno",
    "Arduino Uno",
    "uno.svg",
    null,
    [],
);

export const arduinoMegaRobotTypeGeneric = new RobotType(
    "l_mega",
    { protocol: Avrdude, microcontroller: "atmega2560" },
    PinMapping.MEGA,
    "Arduino Mega",
    "mega.svg",
    null,
    "arduino:avr:mega",
    "arduino:avr",
    [],
);

export const arduinoNanoRobotTypeGeneric = new BaseNano(
    "l_nano",
    "Arduino Nano",
    "nano.svg",
    null,
    [],
);

export const arduinoNanoESP32RobotTypeGeneric = new BaseNanoESP32(
    "l_nano_esp32",
    "Arduino Nano ESP32",
    "nano.svg",
    null,
    [],
);

export const arduinoNanoEveryRobotTypeGeneric = new RobotType(
    "l_nano_every",
    { protocol: Avrdude, microcontroller: "megaavr" },
    PinMapping.NANO,
    "Arduino Nano Every",
    "nano.svg",
    null,
    "megaavr:avr:every",
    "megaavr:avr",
    [],
);

export const arduinoNanoRP2040RobotTypeGeneric = new BaseNanoRP2040(
    "l_nano_rp2040",
    "Arduino Nano RP2040",
    "nano.svg",
    null,
    [],
);

export const genericRobots = [
    arduinoUnoRobotTypeGeneric,
    arduinoNanoRobotTypeGeneric,
    arduinoNanoESP32RobotTypeGeneric,
    arduinoNanoRP2040RobotTypeGeneric,
    arduinoMegaRobotTypeGeneric,
    arduinoNanoEveryRobotTypeGeneric,
];
