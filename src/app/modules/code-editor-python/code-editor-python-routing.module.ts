import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CodeEditorPythonPage } from './code-editor-python.page';

const routes: Routes = [{
  path: '',
  component: CodeEditorPythonPage
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CodeEditorPythonRoutingModule { }
