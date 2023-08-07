import { NgModule } from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import { SharedModule } from '../shared/shared.module';

import { HeaderComponent } from './components/header/header.component';
import { RobotSelectionComponent } from './components/robot-selection/robot-selection.component';
import { StartComponent } from './components/start/start.component';

import { ConnectWiredDialog } from './dialogs/connect.wired/connect.wired.dialog';
import { ConnectCloudDialog } from './dialogs/connect.cloud/connect.cloud.dialog';
import { StatusMessageDialog } from './dialogs/status-message/status-message.dialog';
import { CreditsDialog } from './dialogs/credits/credits.dialog';
import { InfoDialog } from './dialogs/info/info.dialog';
import { ConfirmEditorDialog } from './dialogs/confirm-editor/confirm-editor.dialog';
import { LanguageSelectDialog } from './dialogs/language-select/language-select.dialog';
import {NameFileDialog} from "./dialogs/name-file/name-file.dialog";


@NgModule({
  declarations: [
    ConnectWiredDialog,
    ConnectCloudDialog,
    ConfirmEditorDialog,
    HeaderComponent,
    RobotSelectionComponent,
    StartComponent,
    StatusMessageDialog,
    CreditsDialog,
    LanguageSelectDialog,
    NameFileDialog,
    InfoDialog
  ],
  imports: [
    CommonModule,
    SharedModule,
    NgOptimizedImage
  ],
  entryComponents: [ConnectWiredDialog, ConnectCloudDialog, ConfirmEditorDialog, StatusMessageDialog, CreditsDialog, LanguageSelectDialog, InfoDialog],
  exports: [
    HeaderComponent,
    StartComponent,
    RobotSelectionComponent,
    ConnectCloudDialog,
    ConnectWiredDialog,
    ConfirmEditorDialog,
    StatusMessageDialog,
    CreditsDialog,
    LanguageSelectDialog,
    InfoDialog
  ]
})
export class CoreModule { }
