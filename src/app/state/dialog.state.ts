import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { MatDialogRef } from '@angular/material/dialog';
import { distinctUntilChanged, scan } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class DialogState {

  private connectDialogSubject$: BehaviorSubject<MatDialogRef<unknown, any>> = new BehaviorSubject(null);
  public connectDialog$ = this.connectDialogSubject$.asObservable();

  private isSerialOutputWindowOpenSubject$ = new BehaviorSubject(false);
  public isSerialOutputWindowOpen$ = this.isSerialOutputWindowOpenSubject$.asObservable()
    .pipe(distinctUntilChanged());

  private isSerialOutputListeningSubject$ = new BehaviorSubject(true);
  public isSerialOutputListening$ = this.isSerialOutputListeningSubject$.asObservable();

  private isSerialGraphOutputSelectedSubject$ = new BehaviorSubject(false);
  public isSerialGraphOutputSelected$ = this.isSerialGraphOutputSelectedSubject$.asObservable();

  private isInfoDialogVisibleSubject$ = new BehaviorSubject(false);
  public isInfoDialogVisible$ = this.isInfoDialogVisibleSubject$.asObservable();

  private isEditorTypeChangeConfirmationDialogVisibleSubject$ = new BehaviorSubject(false);
  public isEditorTypeChangeConfirmationDialogVisible$ = this.isEditorTypeChangeConfirmationDialogVisibleSubject$.asObservable();

  public setConnectDialog(dialogRef: MatDialogRef<unknown, any>) {
    this.connectDialogSubject$.next(dialogRef);
  }

  public setIsSerialOutputWindowOpen(isOpen: boolean) {
    this.isSerialOutputWindowOpenSubject$.next(isOpen);
  }

  public setIsSerialOutputListening(isFocus: boolean) {
    this.isSerialOutputListeningSubject$.next(isFocus);
  }

  public setIsSerialGraphOutputSelected(isSelected: boolean) {
    this.isSerialGraphOutputSelectedSubject$.next(isSelected);
  }

  public setIsInfoDialogVisible(isVisible: boolean) {
    this.isInfoDialogVisibleSubject$.next(isVisible);
  }

  public setIsEditorTypeChangeConfirmationDialogVisible(isVisible: boolean) {
    this.isEditorTypeChangeConfirmationDialogVisibleSubject$.next(isVisible);
  }

  public getIsSerialOutputWindowOpen() {
    return this.isSerialOutputWindowOpenSubject$.getValue();
  }
}
