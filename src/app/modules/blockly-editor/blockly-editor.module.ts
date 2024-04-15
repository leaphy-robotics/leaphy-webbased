import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { LeaphyBlocklyComponent } from "./components/leaphy-blockly/leaphy-blockly.component";
import { CodeViewComponent } from "./components/code-view/code-view.component";
import { SharedModule } from "../shared/shared.module";
import { MonacoEditorModule } from "ngx-monaco-editor-v2";

@NgModule({
    declarations: [LeaphyBlocklyComponent, CodeViewComponent],
    imports: [CommonModule, SharedModule, MonacoEditorModule],
    exports: [LeaphyBlocklyComponent, CodeViewComponent],
})
export class BlocklyEditorModule {}
