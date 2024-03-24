import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { DebugInformationDialog } from "./debug-information.dialog";

describe("NameFileComponent", () => {
    let component: DebugInformationDialog;
    let fixture: ComponentFixture<DebugInformationDialog>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [DebugInformationDialog],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(DebugInformationDialog);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
