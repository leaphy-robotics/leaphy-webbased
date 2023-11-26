import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CodeEditorCppRoutingModule } from './code-editor-cpp-routing.module';
import { CodeEditorCppPage } from './code-editor-cpp.page';
import { SharedModule } from '../shared/shared.module';


@NgModule({
  declarations: [CodeEditorCppPage],
  imports: [
    CommonModule,
    CodeEditorCppRoutingModule,
    SharedModule
  ]
})
export class CodeEditorCppModule { }
