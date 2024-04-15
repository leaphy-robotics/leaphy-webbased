import { ComponentFixture, TestBed } from "@angular/core/testing";

import { CodeEditorCppPage } from "./code-editor-cpp.page";

describe("CodeEditorPage", () => {
    let component: CodeEditorCppPage;
    let fixture: ComponentFixture<CodeEditorCppPage>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [CodeEditorCppPage],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(CodeEditorCppPage);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
