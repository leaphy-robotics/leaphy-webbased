import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';


const routes: Routes = [
  { path: '', loadChildren: () => import('./modules/blockly-editor/blockly-editor.module').then(m => m.BlocklyEditorModule) },
  { path: 'advanced', loadChildren: () => import('./modules/code-editor/code-editor.module').then(m => m.CodeEditorModule) },
  { path: 'en/driverissues', loadChildren: () => import('./modules/driver-issues-english/driver-issues.module').then(m => m.DriverIssuesEnglishModule) },
  { path: 'nl/driverissues', loadChildren: () => import('./modules/driver-issues-dutch/driver-issues.module').then(m => m.DriverIssuesDutchModule) },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
