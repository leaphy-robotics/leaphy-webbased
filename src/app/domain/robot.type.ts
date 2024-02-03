interface Features {
    showLeaphyActuators: boolean;
    showLeaphyOperators: boolean;
    showLeaphyLists: boolean;
    showCodeOnStart: boolean;
}

const DEFAULTS: Features = {
    showLeaphyActuators: true,
    showLeaphyOperators: true,
    showLeaphyLists: false,
    showCodeOnStart: false
};

export class RobotType {
    public features: Features;

    constructor(
        public id: string,
        public name: string,
        public svgname: string,
        public board: string,
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
