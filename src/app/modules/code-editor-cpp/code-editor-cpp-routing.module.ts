import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CodeEditorCppPage } from './code-editor-cpp.page';

const routes: Routes = [{
  path: '',
  component: CodeEditorCppPage
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CodeEditorCppRoutingModule { }
