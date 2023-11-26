import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CodeEditorRoutingModule } from './code-editor-arduino-routing.module';
import { SharedModule } from '../shared/shared.module';
import {CodeEditorArduinoPage} from "./code-editor-arduino.page";


@NgModule({
  declarations: [CodeEditorArduinoPage],
  imports: [
    CommonModule,
    CodeEditorRoutingModule,
    SharedModule
  ]
})
export class CodeEditorArduinoModule { }
