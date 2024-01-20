import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ConnectPythonDialog } from './connect-python.dialog';

describe('NameFileComponent', () => {
  let component: ConnectPythonDialog;
  let fixture: ComponentFixture<ConnectPythonDialog>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ConnectPythonDialog ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConnectPythonDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
