import { Component } from "@angular/core";
import { AppState } from "src/app/state/app.state";
import { RobotSelector } from "../../../domain/robot.type";

@Component({
    selector: "app-start",
    templateUrl: "./start.component.html",
    styleUrls: ["./start.component.scss"],
})
export class StartComponent {
    public selector: RobotSelector | null = null;

    constructor(public appState: AppState) {
        appState.robotChoice$.subscribe((selector) => {
            this.selector = selector;
        });
    }
}
