import { Component } from "@angular/core";
import { AppState } from "./state/app.state";
import { MatIconRegistry } from "@angular/material/icon";
import { DomSanitizer } from "@angular/platform-browser";

@Component({
    selector: "app-root",
    templateUrl: "./app.component.html",
    styleUrls: ["./app.component.scss"],
})
export class AppComponent {
    title = "Leaphy Easybloqs";
    constructor(
        public appState: AppState,
        private matIconRegistry: MatIconRegistry,
        private domSanitizer: DomSanitizer,
    ) {
        // get theme from local storage
        const theme = localStorage.getItem('theme');

        if (theme) {
            console.log('theme', theme);
            const body = document.querySelector('body');
            body.setAttribute("data-theme", theme);
            body.setAttribute("data-bs-theme", theme);
        } else {
            localStorage.setItem('theme', 'light');
            document.addEventListener('DOMContentLoaded', function() {
                const body = document.querySelector('body');
                body.setAttribute("data-theme", "light");
                body.setAttribute("data-bs-theme", "light");
            });
        }

        this.matIconRegistry.addSvgIcon(
            "block",
            this.domSanitizer.bypassSecurityTrustResourceUrl(
                "./assets/block.svg",
            ),
        );
    }
}
