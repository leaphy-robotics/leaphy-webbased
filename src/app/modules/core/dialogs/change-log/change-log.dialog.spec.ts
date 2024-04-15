import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { ChangeLogDialog } from "./change-log.dialog";

describe("ChangeLogDialog Component", () => {
    let component: ChangeLogDialog;
    let fixture: ComponentFixture<ChangeLogDialog>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [ChangeLogDialog],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ChangeLogDialog);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
