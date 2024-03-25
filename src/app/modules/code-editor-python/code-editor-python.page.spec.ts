import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CodeEditorPythonPage } from './code-editor-python.page';

describe('CodeEditorPythonPage', () => {
  let component: CodeEditorPythonPage;
  let fixture: ComponentFixture<CodeEditorPythonPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CodeEditorPythonPage ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CodeEditorPythonPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
