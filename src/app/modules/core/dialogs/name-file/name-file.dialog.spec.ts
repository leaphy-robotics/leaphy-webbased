import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { NameFileDialog } from "./name-file.dialog";

describe("NameFileComponent", () => {
    let component: NameFileDialog;
    let fixture: ComponentFixture<NameFileDialog>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [NameFileDialog],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(NameFileDialog);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
