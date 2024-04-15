import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { LocationSelectDialog } from "./location-select.dialog";

describe("LocationSelectComponent", () => {
    let component: LocationSelectDialog;
    let fixture: ComponentFixture<LocationSelectDialog>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [LocationSelectDialog],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(LocationSelectDialog);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
