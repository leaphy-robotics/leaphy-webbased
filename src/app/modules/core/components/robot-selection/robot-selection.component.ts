import {Component} from '@angular/core';
import {AppState} from 'src/app/state/app.state';
import {RobotType} from 'src/app/domain/robot.type';
import {CodeEditorType} from "../../../../domain/code-editor.type";

@Component({
  selector: 'app-robot-selection',
  templateUrl: './robot-selection.component.html',
  styleUrls: ['./robot-selection.component.scss']
})
export class RobotSelectionComponent {

  constructor(public appState: AppState) { }
  public onRobotSelected(robot: RobotType) {
    this.appState.setSelectedRobotType(robot);
    if (robot.id === 'l_code') {
      this.appState.setSelectedCodeEditor(CodeEditorType.Advanced)
    } else {
      this.appState.setSelectedCodeEditor(CodeEditorType.Beginner)
    }
  }

  protected readonly AppState = AppState;
}
