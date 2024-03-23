interface Protocol {
    name: string;
}

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

export const Stk500v1: Protocol = {
    name: "stk500v1",
};

export const Stk500v2: Protocol = {
    name: "stk500v2",
};

export class RobotType {
    public features: Features;

    constructor(
        public id: string,
        public protocol: Protocol,
        public name: string,
        public svgname: string,
        public micrcontoller: string,
        public fqbn: string,
        public ext: string,
        public core: string,
        public libs: string[],
        public isWired: boolean = true,
        features?: Partial<Features>
    ) {
        this.features = Object.assign({}, DEFAULTS, features||{});
    }
}

interface RobotSelectorOption {
    name: string,
    icon: string,
    robot: RobotType,
}

export interface RobotSelector {
    intercept: RobotType,
    choices: RobotSelectorOption[],
}
