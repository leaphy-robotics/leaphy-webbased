import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ConnectionStatus } from '../domain/connection.status';
import { BackEndMessage } from '../domain/backend.message';

@Injectable({
  providedIn: 'root'
})
export class BackEndState {

  private connectionStatusSubject$: BehaviorSubject<ConnectionStatus> = new BehaviorSubject(ConnectionStatus.Disconnected);
  public connectionStatus$ = this.connectionStatusSubject$.asObservable();

  private backEndMessagesSubject$ = new BehaviorSubject<BackEndMessage>(null);
  public backEndMessages$ = this.backEndMessagesSubject$.asObservable();

  private isViewLogClickedSubject$ = new BehaviorSubject<boolean>(false);
  public isViewLogClicked$ = this.isViewLogClickedSubject$.asObservable();

  public setconnectionStatus(status: ConnectionStatus) {
    this.connectionStatusSubject$.next(status);
  }

  public setBackendMessage(message: BackEndMessage) {
    this.backEndMessagesSubject$.next(message);
  }

  public setIsViewLogClicked() {
    this.isViewLogClickedSubject$.next(true);
  }

}
