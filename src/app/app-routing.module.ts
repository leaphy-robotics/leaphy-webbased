import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {CodeEditorPythonPage} from "./modules/code-editor-python/code-editor-python.page";
import {DriverIssuesEnglishPage} from "./modules/driver-issues-english/driver-issues.page";
import {DriverIssuesDutchPage} from "./modules/driver-issues-dutch/driver-issues.page";
import {BlocklyEditorPage} from "./modules/blockly-editor/blockly-editor.page";
import {CodeEditorCppPage} from "./modules/code-editor-cpp/code-editor-cpp.page";


const routes: Routes = [
    { path: 'blocks', children: [{
            path: '',
            component: BlocklyEditorPage
        }]},
    { path: 'cppEditor', children: [{
            path: '',
            component: CodeEditorCppPage
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
