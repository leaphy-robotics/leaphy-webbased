import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { ButtonBarComponent } from "./button-bar.component";

describe("ButtonBarComponent", () => {
    let component: ButtonBarComponent;
    let fixture: ComponentFixture<ButtonBarComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [ButtonBarComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ButtonBarComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
