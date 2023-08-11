import {Component} from '@angular/core';
import {AppState} from 'src/app/state/app.state';
import {RobotType} from 'src/app/domain/robot.type';
import {CodeEditorType} from "../../../../domain/code-editor.type";
import {BackEndState} from "../../../../state/backend.state";
import {BackendWiredEffects} from "../../../../effects/backend.wired.effects";

@Component({
  selector: 'app-robot-selection',
  templateUrl: './robot-selection.component.html',
  styleUrls: ['./robot-selection.component.scss']
})
export class RobotSelectionComponent {

  constructor(public appState: AppState, private backEndState: BackendWiredEffects) { }
  public onRobotSelected(robot: RobotType) {
    this.appState.setSelectedRobotType(robot);
    console.log(robot);
    if (robot.id === 'l_code') {
      this.appState.setSelectedCodeEditor(CodeEditorType.Advanced)
    } else {
      this.appState.setSelectedCodeEditor(CodeEditorType.Beginner)
    }
    this.backEndState.send('restore-workspace-temp', {});
  }

  protected readonly AppState = AppState;
}
