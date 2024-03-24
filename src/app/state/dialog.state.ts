import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { distinctUntilChanged } from "rxjs/operators";

@Injectable({
    providedIn: "root",
})
export class DialogState {
    private isLibraryManagerWindowOpenSubject$ = new BehaviorSubject(false);
    public isLibraryManagerWindowOpen$ = this.isLibraryManagerWindowOpenSubject$
        .asObservable()
        .pipe(distinctUntilChanged());

    private isSerialOutputWindowOpenSubject$ = new BehaviorSubject(false);
    public isSerialOutputWindowOpen$ = this.isSerialOutputWindowOpenSubject$
        .asObservable()
        .pipe(distinctUntilChanged());

    private isSerialOutputListeningSubject$ = new BehaviorSubject(false);
    public isSerialOutputListening$ =
        this.isSerialOutputListeningSubject$.asObservable();

    private isSerialGraphOutputSelectedSubject$ = new BehaviorSubject(false);
    public isSerialGraphOutputSelected$ =
        this.isSerialGraphOutputSelectedSubject$.asObservable();

    private isInfoDialogVisibleSubject$ = new BehaviorSubject(false);
    public isInfoDialogVisible$ =
        this.isInfoDialogVisibleSubject$.asObservable();

    private isEditorTypeChangeConfirmationDialogVisibleSubject$ =
        new BehaviorSubject(false);
    public isEditorTypeChangeConfirmationDialogVisible$ =
        this.isEditorTypeChangeConfirmationDialogVisibleSubject$.asObservable();

    public isExamplesDialogVisibleSubject$ = new BehaviorSubject(false);
    public isExamplesDialogVisible$ =
        this.isExamplesDialogVisibleSubject$.asObservable();

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

    public getIsSerialOutputWindowOpen() {
        return this.isSerialOutputWindowOpenSubject$.getValue();
    }

    public setIsLibraryManagerWindowOpen(isOpen: boolean) {
        this.isLibraryManagerWindowOpenSubject$.next(isOpen);
    }

    public getIsLibraryManagerWindowOpen() {
        return this.isLibraryManagerWindowOpenSubject$.getValue();
    }

    public setIsExamplesDialogVisible(isVisible: boolean) {
        this.isExamplesDialogVisibleSubject$.next(isVisible);
    }
}
