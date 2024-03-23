import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from "rxjs";
import {TranslateService} from "@ngx-translate/core";

@Injectable({
    providedIn: 'root'
})
export class UploadState {
    constructor(
        private translate: TranslateService,
    ) {}

    private progressSubject$: BehaviorSubject<number> = new BehaviorSubject(0);
    public progress$ = this.progressSubject$.asObservable();

    private stateMessageSubject$: BehaviorSubject<string> = new BehaviorSubject('');
    public stateMessage$ = this.stateMessageSubject$.asObservable();

    private doneSubject$: BehaviorSubject<boolean> = new BehaviorSubject(false);
    public done$ = this.doneSubject$.asObservable();

    private errorSubject$: BehaviorSubject<false|string> = new BehaviorSubject(false);
    public error$ = this.errorSubject$.asObservable();

    private failedSubject$: BehaviorSubject<boolean> = new BehaviorSubject(false);
    public failed$ = this.failedSubject$.asObservable()

    private USBConnectingSubject$: BehaviorSubject<false|((port: USBDevice) => void)> = new BehaviorSubject(false)
    public USBConnecting$ = this.USBConnectingSubject$.asObservable()

    public addProgress(progress: number) {
        this.progressSubject$.next(this.progressSubject$.getValue() + progress)
    }

    public setStatusMessage(message: string) {
        const translation = this.translate.instant(message);
        this.stateMessageSubject$.next(translation !== null ? translation : message.replace(/_/g, " "));
    }

    public setDone(done: boolean) {
        this.doneSubject$.next(done)
    }

    public setError(error: string) {
        this.setFailed(true)
        this.errorSubject$.next(error)
    }

    public setFailed(failed: boolean) {
        this.setDone(true)
        this.failedSubject$.next(failed)
    }

    public async requestUSBDevice(): Promise<USBDevice> {
        const [device] = await navigator.usb.getDevices()
        if (device) return device

        return new Promise(resolve => this.USBConnectingSubject$.next(resolve))
    }

    public connectUSB(port: USBDevice) {
        const onDone = this.USBConnectingSubject$.getValue()
        this.USBConnectingSubject$.next(false)
        if (onDone) onDone(port)
    }

    public reset() {
        this.progressSubject$.next(0)
        this.stateMessageSubject$.next('')
        this.doneSubject$.next(false)
        this.errorSubject$.next(false)
        this.failedSubject$.next(false)
    }
}
