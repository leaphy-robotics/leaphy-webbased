import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { CodeEditorState } from 'src/app/state/code-editor.state';
import {BackendWiredEffects} from "../../effects/backend.wired.effects";

@Component({
  selector: 'app-code-editor',
  templateUrl: './code-editor.page.html',
  styleUrls: ['./code-editor.page.scss']
})
export class CodeEditorPage implements AfterViewInit {

  @ViewChild("editor") private editor: ElementRef<HTMLElement>;

  constructor(private codeEditorState: CodeEditorState, private backendWiredEffects: BackendWiredEffects) { }

  ngAfterViewInit(): void {
    this.codeEditorState.setAceElement(this.editor);

    window.addEventListener("beforeunload", () => {
      this.backendWiredEffects.send('save-workspace-temp', {data: this.codeEditorState.getCode()})
    });
  }
}
