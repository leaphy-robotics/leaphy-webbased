import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { BackEndMessage } from '../domain/backend.message';

@Injectable({
    providedIn: 'root'
})
export class BackEndState {

    private backEndMessagesSubject$ = new BehaviorSubject<BackEndMessage>(null);
    public backEndMessages$ = this.backEndMessagesSubject$.asObservable();

    private isViewLogClickedSubject$ = new BehaviorSubject<boolean>(false);
    public isViewLogClicked$ = this.isViewLogClickedSubject$.asObservable();


    public setBackendMessage(message: BackEndMessage) {
        this.backEndMessagesSubject$.next(message);
    }

    public setIsViewLogClicked() {
        this.isViewLogClickedSubject$.next(true);
    }

}
