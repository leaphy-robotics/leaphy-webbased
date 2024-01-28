import { BrowserModule } from '@angular/platform-browser';
import { NgModule, APP_INITIALIZER } from '@angular/core';

import { HttpClientModule, HttpClient } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { BackendWiredEffects } from './effects/backend.wired.effects';
import { BlocklyEditorEffects } from './effects/blockly-editor.effects';
import { DialogEffects } from './effects/dialog.effects';
import { AppEffects } from './effects/app.effects';
import { RobotWiredEffects } from './effects/robot.wired.effects';
import { CoreModule } from './modules/core/core.module';

import { MatomoModule } from 'ngx-matomo';
import {CodeEditorEffects} from "./effects/code-editor.effects";

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
        MatomoModule.forRoot({
            scriptUrl: 'https://leaphyeasybloqs.com/matomo/matomo.js',
            trackers: [
                {
                    trackerUrl: 'https://leaphyeasybloqs.com/matomo/matomo.php',
                    siteId: 1
                }
            ],
            routeTracking: {
                enable: true
            }
        }),
        CoreModule
    ],
    providers: [
        // Initialize the Effects on startup
        {
            provide: APP_INITIALIZER, deps:
                [
                    AppEffects,
                    BackendWiredEffects,
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
