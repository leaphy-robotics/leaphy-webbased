import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class DialogState {

    private isLibraryManagerWindowOpenSubject$ = new BehaviorSubject(false);
    public isLibraryManagerWindowOpen$ = this.isLibraryManagerWindowOpenSubject$.asObservable()
        .pipe(distinctUntilChanged());

    private isSerialOutputWindowOpenSubject$ = new BehaviorSubject(false);
    public isSerialOutputWindowOpen$ = this.isSerialOutputWindowOpenSubject$.asObservable()
        .pipe(distinctUntilChanged());

    private isSerialOutputListeningSubject$ = new BehaviorSubject(false);
    public isSerialOutputListening$ = this.isSerialOutputListeningSubject$.asObservable();

    private isSerialGraphOutputSelectedSubject$ = new BehaviorSubject(false);
    public isSerialGraphOutputSelected$ = this.isSerialGraphOutputSelectedSubject$.asObservable();

    private isInfoDialogVisibleSubject$ = new BehaviorSubject(false);
    public isInfoDialogVisible$ = this.isInfoDialogVisibleSubject$.asObservable();

    public isExamplesDialogVisibleSubject$ = new BehaviorSubject(false);
    public isExamplesDialogVisible$ = this.isExamplesDialogVisibleSubject$.asObservable()

    set isSerialOutputWindowOpen(isOpen: boolean) {
        this.isSerialOutputWindowOpenSubject$.next(isOpen);
    }

    set isSerialOutputListening(isFocus: boolean) {
        this.isSerialOutputListeningSubject$.next(isFocus);
    }

    set isSerialGraphOutputSelected(isSelected: boolean) {
        this.isSerialGraphOutputSelectedSubject$.next(isSelected);
    }

    set isInfoDialogVisible(isVisible: boolean) {
        this.isInfoDialogVisibleSubject$.next(isVisible);
    }

    get isSerialOutputWindowOpen() {
        return this.isSerialOutputWindowOpenSubject$.getValue();
    }

    set isLibraryManagerWindowOpen(isOpen: boolean) {
        this.isLibraryManagerWindowOpenSubject$.next(isOpen);
    }

    get isLibraryManagerWindowOpen() {
        return this.isLibraryManagerWindowOpenSubject$.getValue();
    }

    set isExamplesDialogVisible(isVisible: boolean) {
        this.isExamplesDialogVisibleSubject$.next(isVisible)
    }
}
