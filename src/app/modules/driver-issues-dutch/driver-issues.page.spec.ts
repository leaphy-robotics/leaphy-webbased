import { ComponentFixture, TestBed } from "@angular/core/testing";

import { DriverIssuesDutchPage } from "./driver-issues.page";

describe("DriverIssuesDutch", () => {
    let component: DriverIssuesDutchPage;
    let fixture: ComponentFixture<DriverIssuesDutchPage>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DriverIssuesDutchPage],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DriverIssuesDutchPage);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
