import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { UploadPythonDialog } from './upload-python.dialog';

describe('NameFileComponent', () => {
  let component: UploadPythonDialog;
  let fixture: ComponentFixture<UploadPythonDialog>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ UploadPythonDialog ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UploadPythonDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
