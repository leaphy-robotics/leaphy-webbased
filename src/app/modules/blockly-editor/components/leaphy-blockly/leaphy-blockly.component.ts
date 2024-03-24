import { Component, ViewChild, ElementRef, AfterViewInit } from "@angular/core";
import { BlocklyEditorState } from "src/app/state/blockly-editor.state";
import { Backpack } from "./backpack.plugin";
import Blockly from "blockly/core";
import { BackpackChange } from "@blockly/workspace-backpack/dist";
import { AppState } from "src/app/state/app.state";
import { WorkspaceSvg } from "blockly";

type Background = {
    src: string;
    x: string;
};

@Component({
    selector: "app-leaphy-blockly",
    templateUrl: "./leaphy-blockly.component.html",
    styleUrls: ["./leaphy-blockly.component.scss"],
})
export class LeaphyBlocklyComponent implements AfterViewInit {
    @ViewChild("blockContent") blockContent: ElementRef;

    public background: Background;
    private workspace: WorkspaceSvg;

    constructor(
        public appState: AppState,
        public blocklyState: BlocklyEditorState,
    ) {
        appState.selectedRobotType$.subscribe((robot) => {
            if (!robot?.background) return (this.background = null);
            if (this.background) {
                this.background.src = robot.background;
            } else {
                this.background = {
                    src: robot.background,
                    x: "50%",
                };
            }
        });

        window.addEventListener("resize", this.updateSizing.bind(this));
    }

    updateSizing() {
        if (!this.background || !this.workspace) return;
        const toolbox = this.workspace.getToolbox();

        this.background.x = `${window.innerWidth / 2 + (toolbox.getFlyout().isVisible() ? toolbox.getFlyout().getWidth() : 0) / 2 + 40}px`;
    }

    ngAfterViewInit() {
        this.blocklyState.setBlocklyElement(this.blockContent.nativeElement);
        this.blocklyState.workspace$.subscribe((workspace) => {
            this.workspace = workspace;
            workspace.addChangeListener((event: any) => {
                // @ts-ignore
                if (!(event.type === "toolbox_item_select")) {
                    return;
                }

                workspace.resize();
            });

            workspace.addChangeListener(this.updateSizing.bind(this));

            if (!workspace.backpack) {
                const backpack = new Backpack(workspace);
                workspace.backpack = backpack;
                Blockly.registry.unregister(
                    Blockly.registry.Type.SERIALIZER,
                    "backpack",
                );

                backpack.setContents(
                    JSON.parse(localStorage.getItem("backpack")) || [],
                );
                workspace.addChangeListener(
                    (event: Blockly.Events.Abstract) => {
                        if (!(event instanceof BackpackChange)) return;

                        localStorage.setItem(
                            "backpack",
                            JSON.stringify(backpack.getContents()),
                        );
                    },
                );

                backpack.init();
            }
        });
    }
}
