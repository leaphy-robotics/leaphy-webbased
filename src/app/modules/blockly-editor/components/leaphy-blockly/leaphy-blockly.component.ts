import {
  Component,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { BlocklyEditorState } from 'src/app/state/blockly-editor.state';
import {Backpack} from "./backpack.plugin";
import Blockly from 'blockly/core';
import {BackpackChange} from "@blockly/workspace-backpack/dist";

@Component({
    selector: 'app-leaphy-blockly',
    templateUrl: './leaphy-blockly.component.html',
    styleUrls: ['./leaphy-blockly.component.scss']
})
export class LeaphyBlocklyComponent implements AfterViewInit {

    @ViewChild('blockContent') blockContent: ElementRef;

    constructor(
        public blocklyState: BlocklyEditorState,
    ) {}

    ngAfterViewInit() {
        this.blocklyState.setBlocklyElement(this.blockContent.nativeElement);
        this.blocklyState.workspace$.subscribe(workspace => {
            // Resize the workspace when toolbox is opened or closed.
            workspace.addChangeListener((event: Blockly.Events.Abstract) => {
                if (!event.isUiEvent) return;

                workspace.resize();
            })

            const backpack = new Backpack(workspace);
            backpack.setContents(JSON.parse(localStorage.getItem('backpack')) || []);
            workspace.addChangeListener((event: Blockly.Events.Abstract) => {
                if (!(event instanceof BackpackChange)) return;

                localStorage.setItem('backpack', JSON.stringify(backpack.getContents()));
            });

            backpack.init();
        })
    }
}
