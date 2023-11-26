import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';


const routes: Routes = [
    { path: 'blocks', loadChildren: () => import('./modules/blockly-editor/blockly-editor.module').then(m => m.BlocklyEditorModule) },
    { path: 'cppEditor', loadChildren: () => import('./modules/code-editor-cpp/code-editor-cpp.module').then(m => m.CodeEditorCppModule) },
    { path: 'pythonEditor', loadChildren: () => import('./modules/code-editor-python/code-editor-python.module').then(m => m.CodeEditorPythonModule) },
    { path: 'en/driverissues', loadChildren: () => import('./modules/driver-issues-english/driver-issues.module').then(m => m.DriverIssuesEnglishModule) },
    { path: 'nl/driverissues', loadChildren: () => import('./modules/driver-issues-dutch/driver-issues.module').then(m => m.DriverIssuesDutchModule) },
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }
