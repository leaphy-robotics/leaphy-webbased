import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { LeaphyBlocklyComponent } from "./components/leaphy-blockly/leaphy-blockly.component";
import { CodeViewComponent } from "./components/code-view/code-view.component";
import { SharedModule } from "../shared/shared.module";

@NgModule({
    declarations: [LeaphyBlocklyComponent, CodeViewComponent],
    imports: [CommonModule, SharedModule],
    exports: [LeaphyBlocklyComponent, CodeViewComponent],
})
export class BlocklyEditorModule {}
