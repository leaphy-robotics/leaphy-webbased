import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { VariableDialog } from "./variable.dialog";

describe("NameFileComponent", () => {
    let component: VariableDialog;
    let fixture: ComponentFixture<VariableDialog>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [VariableDialog],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(VariableDialog);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
