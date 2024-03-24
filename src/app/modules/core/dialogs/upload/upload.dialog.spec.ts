import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { UploadDialog } from "./upload.dialog";

describe("NameFileComponent", () => {
    let component: UploadDialog;
    let fixture: ComponentFixture<UploadDialog>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [UploadDialog],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(UploadDialog);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
