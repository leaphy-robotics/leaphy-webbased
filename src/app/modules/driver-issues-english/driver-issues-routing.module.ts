import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { DriverIssuesEnglishPage } from "./driver-issues.page";

const routes: Routes = [
    {
        path: "",
        component: DriverIssuesEnglishPage,
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class DriverIssuesRoutingModule {}
