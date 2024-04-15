import { ComponentFixture, TestBed } from "@angular/core/testing";

import { DriverIssuesEnglishPage } from "./driver-issues.page";

describe("DriverIssuesEnglish", () => {
    let component: DriverIssuesEnglishPage;
    let fixture: ComponentFixture<DriverIssuesEnglishPage>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DriverIssuesEnglishPage],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DriverIssuesEnglishPage);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
