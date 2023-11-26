import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {CodeEditorArduinoPage} from './code-editor-arduino.page';

const routes: Routes = [{
  path: '',
  component: CodeEditorArduinoPage
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CodeEditorRoutingModule { }
