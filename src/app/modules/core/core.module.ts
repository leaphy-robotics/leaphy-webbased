import { NgModule } from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import { SharedModule } from '../shared/shared.module';

import { HeaderComponent } from './components/header/header.component';
import { RobotSelectionComponent } from './components/robot-selection/robot-selection.component';
import { StartComponent } from './components/start/start.component';

import { StatusMessageDialog } from './dialogs/status-message/status-message.dialog';
import { CreditsDialog } from './dialogs/credits/credits.dialog';
import { InfoDialog } from './dialogs/info/info.dialog';
import { ConfirmEditorDialog } from './dialogs/confirm-editor/confirm-editor.dialog';
import { LanguageSelectDialog } from './dialogs/language-select/language-select.dialog';
import {NameFileDialog} from "./dialogs/name-file/name-file.dialog";
import {VariableDialog} from "./dialogs/variable/variable.dialog";
import {UploadDialog} from "./dialogs/upload/upload.dialog";
import {DebugInformationDialog} from "./dialogs/debug-information/debug-information.dialog";
import {DragDropModule} from "@angular/cdk/drag-drop";
import { SelectRobotTypeDialog } from './dialogs/robot-select/robot-select.dialog';
import {UploadPythonDialog} from "./dialogs/upload-python/upload-python.dialog";
import {FileExplorerDialog} from "./dialogs/file-explorer/file-explorer.dialog";

@NgModule({
    declarations: [
        ConfirmEditorDialog,
        HeaderComponent,
        RobotSelectionComponent,
        StartComponent,
        StatusMessageDialog,
        CreditsDialog,
        LanguageSelectDialog,
        SelectRobotTypeDialog,
        NameFileDialog,
        FileExplorerDialog,
        VariableDialog,
        UploadDialog,
        UploadPythonDialog,
        DebugInformationDialog,
        InfoDialog
    ],
    imports: [
        CommonModule,
        SharedModule,
        NgOptimizedImage,
        DragDropModule
    ],
    entryComponents: [ConfirmEditorDialog, StatusMessageDialog, CreditsDialog, LanguageSelectDialog, InfoDialog],
    exports: [
        HeaderComponent,
        StartComponent,
        RobotSelectionComponent,
        ConfirmEditorDialog,
        StatusMessageDialog,
        CreditsDialog,
        LanguageSelectDialog,
        InfoDialog
    ]
})
export class CoreModule { }
