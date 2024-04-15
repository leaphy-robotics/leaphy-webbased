import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SelectRobotTypeDialog } from './robot-select.dialog';

describe('RobotSelectComponent', () => {
  let component: SelectRobotTypeDialog;
  let fixture: ComponentFixture<SelectRobotTypeDialog>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SelectRobotTypeDialog ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectRobotTypeDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
