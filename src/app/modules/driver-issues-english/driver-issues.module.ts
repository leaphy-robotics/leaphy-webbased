import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DriverIssuesRoutingModule } from './driver-issues-routing.module';
import { DriverIssuesEnglishPage } from './driver-issues.page';
import { SharedModule } from '../shared/shared.module';


@NgModule({
  declarations: [DriverIssuesEnglishPage],
  imports: [
    CommonModule,
    DriverIssuesRoutingModule,
    SharedModule
  ]
})
export class DriverIssuesEnglishModule { }
