import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {PortalModule} from '@angular/cdk/portal';

import { ButtonBarComponent } from './components/button-bar/button-bar.component';
import { SerialOutputComponent } from './components/serial-output/serial-output.component';
import { SerialWindowComponent } from './components/serial-window/serial-window.component';
import { LibraryManagerComponent } from './components/library-manager/library-manager.component';

import { TranslateModule } from '@ngx-translate/core';

import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatLegacyProgressSpinnerModule as MatProgressSpinnerModule } from '@angular/material/legacy-progress-spinner';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { MatLegacyMenuModule as MatMenuModule } from '@angular/material/legacy-menu';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';
import { MatLegacySnackBarModule as MatSnackBarModule } from '@angular/material/legacy-snack-bar';

import { NgChartsModule  } from 'ng2-charts';
import {DragDropModule} from "@angular/cdk/drag-drop";
import {TerminalComponent} from "./components/terminal/terminal.component";
import {NgTerminalModule} from "ng-terminal";

@NgModule({
    declarations: [TerminalComponent, ButtonBarComponent, SerialOutputComponent, SerialWindowComponent, LibraryManagerComponent],
    imports: [
        NgTerminalModule,
        CommonModule,
        FormsModule,
        TranslateModule,
        MatIconModule,
        MatSidenavModule,
        MatCheckboxModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        MatDialogModule,
        MatInputModule,
        MatButtonToggleModule,
        MatToolbarModule,
        MatSelectModule,
        MatMenuModule,
        MatTooltipModule,
        MatSnackBarModule,
        PortalModule,
        NgChartsModule,
        DragDropModule
    ],
    exports: [
        TerminalComponent,
        FormsModule,
        ButtonBarComponent,
        SerialOutputComponent,
        LibraryManagerComponent,
        SerialWindowComponent,
        TranslateModule,
        MatIconModule,
        MatSidenavModule,
        MatCheckboxModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        MatDialogModule,
        MatInputModule,
        MatButtonToggleModule,
        MatToolbarModule,
        MatSelectModule,
        MatMenuModule,
        MatTooltipModule,
        MatSnackBarModule
    ],
    entryComponents:[SerialOutputComponent, SerialWindowComponent, LibraryManagerComponent]
})
export class SharedModule { }
