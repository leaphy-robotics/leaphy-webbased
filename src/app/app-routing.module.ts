import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {CodeEditorPythonPage} from "./modules/code-editor-python/code-editor-python.page";
import {CodeEditorPythonModule} from "./modules/code-editor-python/code-editor-python.module";
import {DriverIssuesEnglishPage} from "./modules/driver-issues-english/driver-issues.page";
import {DriverIssuesDutchModule} from "./modules/driver-issues-dutch/driver-issues.module";
import {DriverIssuesDutchPage} from "./modules/driver-issues-dutch/driver-issues.page";


const routes: Routes = [
    { path: 'blocks', children: [{
            path: '',
            loadChildren: () => import('./modules/blockly-editor/blockly-editor.module').then(m => m.BlocklyEditorModule)
        }]},
    { path: 'cppEditor', children: [{
            path: '',
            loadChildren: () => import('./modules/code-editor-cpp/code-editor-cpp.module').then(m => m.CodeEditorCppModule)
        }]},
    { path: 'pythonEditor', children: [{
            path: '',
            component: CodeEditorPythonPage
        }]},
    { path: 'en', children: [{
            path: 'driverissues',
            component: DriverIssuesEnglishPage
        }]},
    { path: 'nl', children: [{
            path: 'driverissues',
            component: DriverIssuesDutchPage
        }]}
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }
