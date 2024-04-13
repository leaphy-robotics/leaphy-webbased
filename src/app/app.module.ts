import { BrowserModule } from '@angular/platform-browser';
import { NgModule, APP_INITIALIZER } from '@angular/core';

import { HttpClientModule, HttpClient } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { BlocklyEditorEffects } from './effects/blockly-editor.effects';
import { DialogEffects } from './effects/dialog.effects';
import { AppEffects } from './effects/app.effects';
import { RobotWiredEffects } from './effects/robot.wired.effects';
import { CoreModule } from './modules/core/core.module';

import {CodeEditorEffects} from "./effects/code-editor.effects";
import {MonacoEditorModule} from "ngx-monaco-editor-v2";

export function createTranslateLoader(http: HttpClient) {
    return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}



@NgModule({
    declarations: [
        AppComponent,
    ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        HttpClientModule,
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: createTranslateLoader,
                deps: [HttpClient]
            }
        }),
        CoreModule,
        MonacoEditorModule.forRoot()
    ],
    providers: [
        // Initialize the Effects on startup
        {
            provide: APP_INITIALIZER, deps:
                [
                    AppEffects,
                    BlocklyEditorEffects,
                    DialogEffects,
                    CodeEditorEffects,
                    RobotWiredEffects
                ], useFactory: () => () => null, multi: true
        }
    ],
    exports: [],
    bootstrap: [AppComponent]
})
export class AppModule { }
