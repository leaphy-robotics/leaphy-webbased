import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CodeEditorArduinoPage } from './code-editor-arduino.page';

describe('CodeEditorArduinoPage', () => {
  let component: CodeEditorArduinoPage;
  let fixture: ComponentFixture<CodeEditorArduinoPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CodeEditorArduinoPage ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CodeEditorArduinoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
