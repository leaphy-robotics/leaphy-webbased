import BaseProtocol from "../services/arduino-uploader/protocols/base";

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

export class RobotType {
    public features: Features;

    constructor(
        public id: string,
        public protocol: typeof BaseProtocol,
        public name: string,
        public svgname: string,
        public background: string,
        public fqbn: string,
        public core: string,
        public libs: string[],
        features?: Partial<Features>,
        public microcontroller?: string
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
