import BaseProtocol from "../services/arduino-uploader/protocols/base";
import Avrdude from "../services/arduino-uploader/protocols/avrdude";
import DFU from "../services/arduino-uploader/protocols/dfu";
import Pico from "../services/arduino-uploader/protocols/pico";

interface Features {
    showLeaphyActuators: boolean;
    showLeaphyOperators: boolean;
    showLeaphySensors: boolean;
    showLeaphyLists: boolean;
    showCodeOnStart: boolean;
}

const DEFAULTS: Features = {
    showLeaphyActuators: true,
    showLeaphyOperators: true,
    showLeaphySensors: false,
    showLeaphyLists: false,
    showCodeOnStart: false
};

interface ProtocolInformation {
    protocol: typeof BaseProtocol;
    microcontroller?: string;
}

export class RobotType {
    public features: Features;

    constructor(
        public id: string,
        public protocol: Partial<ProtocolInformation>,
        public name: string,
        public svgname: string,
        public background: string,
        public fqbn: string,
        public core: string,
        public libs: string[],
        features?: Partial<Features>,
    ) {
        this.features = Object.assign({}, DEFAULTS, features||{});
    }
}

export interface RobotEntry {
    name: string,
    icon: string,
    robot: RobotType
}

export interface RobotSelector {
    intercept: RobotType,
    choices: RobotEntry[][],
}

const defaultLibraries = [
    'Leaphy Original Extension', 'Leaphy Extra Extension', 'Servo', 'Adafruit GFX Library', 'Adafruit SSD1306', 'Adafruit LSM9DS1 Library',
    'Adafruit Unified Sensor', 'List', 'Adafruit SGP30 Sensor', 'Adafruit_VL53L0X', 'Adafruit BMP280 Library', 'TM1637', 'LedControl'
]


export const leaphyOriginalRobotType = new RobotType(
    'l_original_uno',
    {protocol: Avrdude, microcontroller: 'atmega328p'},
    'Leaphy Original',
    'orig.svg',
    'orig_uno.svg',
    'arduino:avr:uno',
    'arduino:avr',
    defaultLibraries.concat(['QMC5883LCompass', 'Arduino_APDS9960']),
    {
        showLeaphyActuators: true,
        showLeaphyOperators: false,
        showLeaphySensors: true,
    },
);
export const leaphyOriginalNanoRobotType = new RobotType(
    'l_original_nano',
    {protocol: Avrdude, microcontroller: 'atmega328p'},
    'Original Nano',
    'orig.svg',
    'orig_nano.svg',
    'arduino:avr:nano',
    'arduino:avr',
    defaultLibraries.concat(['QMC5883LCompass', 'Arduino_APDS9960']),
    {
        showLeaphyActuators: true,
        showLeaphyOperators: true,
        showLeaphySensors: true,
    },
);
export const leaphyOriginalNanoESP32RobotType = new RobotType(
    'l_original_nano_esp32',
    {protocol: DFU},
    'Original Nano ESP32',
    'orig.svg',
    'orig_nano_esp32.svg',
    'arduino:esp32:nano_nora',
    'arduino:esp32',
    defaultLibraries.concat(['QMC5883LCompass', 'Arduino_APDS9960']),
    {
        showLeaphyActuators: true,
        showLeaphyOperators: true,
        showLeaphySensors: true,
    },
);
export const leaphyOriginalNanoRP2040RobotType = new RobotType(
    'l_original_nano_esp32',
    {protocol: Pico},
    'Original Nano RP2040',
    'orig.svg',
    'orig_nano_rp2040.svg',
    'arduino:mbed_nano:nanorp2040connect',
    'arduino:mbed_nano',
    defaultLibraries.concat(['QMC5883LCompass', 'Arduino_APDS9960']),
    {
        showLeaphyActuators: true,
        showLeaphyOperators: true,
        showLeaphySensors: true,
    },
);
export const leaphyFlitzRobotType = new RobotType(
    'l_flitz_uno',
    {protocol: Avrdude, microcontroller: 'atmega328p'},
    'Leaphy Flitz',
    'flitz.svg',
    'flitz_uno.svg',
    'arduino:avr:uno',
    'arduino:avr',
    defaultLibraries,
    {
        showLeaphyActuators: false,
        showLeaphyOperators: false,
    },
);
export const leaphyFlitzNanoRobotType = new RobotType(
    'l_flitz_nano',
    {protocol: Avrdude, microcontroller: 'atmega328p'},
    'Flitz Nano',
    'flitz_nano.svg',
    'flitz_nano.svg',
    'arduino:avr:nano',
    'arduino:avr',
    defaultLibraries,
    {
        showLeaphyActuators: false,
        showLeaphyOperators: false,
    },
);
export const leaphyClickRobotType = new RobotType(
    'l_click',
    {protocol: Avrdude, microcontroller: 'atmega328p'},
    'Leaphy Click',
    'click.svg',
    null,
    'arduino:avr:uno',
    'arduino:avr',
    defaultLibraries,
    {
        showLeaphySensors: true,
    },
);
export const arduinoUnoRobotType = new RobotType(
    'l_uno',
    {protocol: Avrdude, microcontroller: 'atmega328p'},
    'Arduino Uno',
    'uno.svg',
    null,
    'arduino:avr:uno',
    'arduino:avr',
    defaultLibraries.concat(['QMC5883LCompass', 'Arduino_APDS9960']),
    {
        showLeaphyLists: true,
        showLeaphySensors: true,
    },
);

export const genericRobotType = new RobotType(
    'l_code',
    {protocol: Avrdude, microcontroller: 'atmega328p'},
    'Leaphy C++',
    "c++.svg",
    null,
    'arduino:avr:uno',
    'arduino:avr',
    defaultLibraries.concat(['QMC5883LCompass', 'Arduino_APDS9960']),
    {},
);
export const arduinoNanoRobotType = new RobotType(
    'l_nano',
    {protocol: Avrdude, microcontroller: 'atmega328p'},
    'Arduino Nano',
    'nano.svg',
    null,
    'arduino:avr:nano',
    'arduino:avr',
    defaultLibraries.concat(['QMC5883LCompass', 'Arduino_APDS9960']),
    {
        showLeaphyLists: true,
        showLeaphySensors: true,
    },
);
export const arduinoNanoESP32RobotType = new RobotType(
    'l_nano_esp32',
    {protocol: DFU},
    'Arduino Nano ESP32',
    'nano.svg',
    null,
    'arduino:esp32:nano_nora',
    'arduino:esp32',
    defaultLibraries.concat(['QMC5883LCompass', 'Arduino_APDS9960']),
    {
        showLeaphyLists: true,
        showLeaphySensors: true,
    }
);
export const arduinoNanoRP2040RobotType = new RobotType(
    'l_nano_rp2040',
    {protocol: Pico},
    'Arduino Nano RP2040',
    'nano.svg',
    null,
    'arduino:mbed_nano:nanorp2040connect',
    'arduino:mbed_nano',
    defaultLibraries.concat(['QMC5883LCompass', 'Arduino_APDS9960']),
    {
        showLeaphyLists: true,
        showLeaphySensors: true,
    }
);

export const microPythonRobotType = new RobotType(
    'l_micropython',
    {protocol: Avrdude},
    'MicroPython',
    'micropython.svg',
    null,
    '',
    '',
    [],
    {
        showLeaphyActuators: false,
        showLeaphyOperators: false,
    });

export const arduinoMegaRobotType = new RobotType(
    'l_mega',
    {protocol: Avrdude, microcontroller: 'atmega2560'},
    'Arduino Mega',
    'mega.svg',
    null,
    'arduino:avr:mega',
    'arduino:avr',
    defaultLibraries.concat(['QMC5883LCompass', 'Arduino_APDS9960']),
    {
        showLeaphyLists: true,
        showLeaphySensors: true,
    },
)
