import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { FileExplorerDialog } from './file-explorer.dialog';

describe('NameFileComponent', () => {
  let component: FileExplorerDialog;
  let fixture: ComponentFixture<FileExplorerDialog>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ FileExplorerDialog ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FileExplorerDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
