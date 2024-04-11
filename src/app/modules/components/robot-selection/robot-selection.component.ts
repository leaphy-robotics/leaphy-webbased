import {Component, Input} from '@angular/core';
import {AppState} from 'src/app/state/app.state';
import {RobotEntry, RobotType} from 'src/app/domain/robot.type';
import {CodeEditorType} from "../../../domain/code-editor.type";
import {animate, state, style, transition, trigger} from "@angular/animations";

@Component({
    selector: 'app-robot-selection',
    templateUrl: './robot-selection.component.html',
    styleUrls: ['./robot-selection.component.scss'],
    animations: [
        trigger('swipe', [
            state('center', style({
                translate: '-50%',
                background: '#ffffff00'
            })),
            state('left', style({
                translate: '-100%',
                background: '#ffffff00'
            })),
            state('right', style({
                translate: '0',
                background: '#fff'
            })),
            transition('center => left', [
                animate('.3s ease-out')
            ]),
            transition('void => right', [
                style({ translate: '50vw', background: '#ffffff00' }),
                animate('.3s ease-out')
            ])
        ])
    ]
})
export class RobotSelectionComponent {
    @Input() secondary = false
    @Input() state = 'center'
    @Input() robots: (RobotType|RobotEntry)[][]
    @Input() selected: RobotType = null

    constructor(public appState: AppState) { }
    public onRobotSelected(robotInstance: RobotType|RobotEntry) {
        const robot = robotInstance instanceof RobotType ? robotInstance : robotInstance.robot

        // checked
        this.appState.setSelectedRobotType(robot, this.secondary);
        if (robot.id === 'l_code') {
            this.appState.selectedCodeEditor = CodeEditorType.CPP
        } else if (robot.id === 'l_micropython') {
            this.appState.selectedCodeEditor = CodeEditorType.Python
        } else {
            this.appState.selectedCodeEditor = CodeEditorType.Beginner
        }

    }

    protected readonly AppState = AppState;
}
