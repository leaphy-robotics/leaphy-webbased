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
    showCodeOnStart: false,
};

interface ProtocolInformation {
    protocol: typeof BaseProtocol;
    microcontroller?: string;
}

export class RobotType {
    public features: Features;

    constructor(
        public id: string,
        public protocol: ProtocolInformation,
        public name: string,
        public svgname: string,
        public background: string,
        public fqbn: string,
        public core: string,
        public libs: string[],
        features?: Partial<Features>,
    ) {
        this.features = Object.assign({}, DEFAULTS, features || {});
    }
}

export interface RobotEntry {
    name: string;
    icon: string;
    robot: RobotType;
}

export interface RobotSelector {
    intercept: RobotType;
    choices: RobotEntry[][];
}

export class BaseUno extends RobotType {
    constructor(
        id: string,
        name: string,
        svgname: string,
        background: string,
        libs: string[],
        features?: Partial<Features>,
    ) {
        super(
            id,
            { protocol: Avrdude, microcontroller: "atmega328p" },
            name,
            svgname,
            background,
            "arduino:avr:uno",
            "arduino:avr",
            libs,
            features,
        );
    }
}

export class BaseNano extends RobotType {
    constructor(
        id: string,
        name: string,
        svgname: string,
        background: string,
        libs: string[],
        features?: Partial<Features>,
    ) {
        super(
            id,
            { protocol: Avrdude, microcontroller: "atmega328p" },
            name,
            svgname,
            background,
            "arduino:avr:nano",
            "arduino:avr",
            libs,
            features,
        );
    }
}

export class BaseNanoESP32 extends RobotType {
    constructor(
        id: string,
        name: string,
        svgname: string,
        background: string,
        libs: string[],
        features?: Partial<Features>,
    ) {
        super(
            id,
            { protocol: DFU },
            name,
            svgname,
            background,
            "arduino:esp32:nano_nora",
            "arduino:esp32",
            libs,
            features,
        );
    }
}

export class BaseNanoRP2040 extends RobotType {
    constructor(
        id: string,
        name: string,
        svgname: string,
        background: string,
        libs: string[],
        features?: Partial<Features>,
    ) {
        super(
            id,
            { protocol: Pico },
            name,
            svgname,
            background,
            "arduino:mbed_nano:nanorp2040connect",
            "arduino:mbed_nano",
            libs,
            features,
        );
    }
}
