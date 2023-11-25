import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CodeEditorState } from './code-editor.state';
import { CodeEditorEffects } from '../effects/code-editor.effects';
// import random number generator
import { v4 as uuidv4 } from 'uuid';

@Injectable({
    providedIn: 'root'
})
export class GlobalState {
    private codeEditorStateSubject$: BehaviorSubject<CodeEditorState> = new BehaviorSubject<CodeEditorState>(null);
    public codeEditorState$: Observable<CodeEditorState> = this.codeEditorStateSubject$.asObservable();

    private codeEditorEffectSubject$: BehaviorSubject<CodeEditorEffects> = new BehaviorSubject<CodeEditorEffects>(null);
    public codeEditorEffect$: Observable<CodeEditorEffects> = this.codeEditorEffectSubject$.asObservable();

    private lang: BehaviorSubject<string> = new BehaviorSubject<string>('');

    public uuid: string = uuidv4();

    constructor() {
        console.log("constructor:", this.uuid);
    }

    get codeEditorState(): CodeEditorState {
        return this.codeEditorStateSubject$.value;
    }

    set codeEditorState(value: CodeEditorState) {
        this.codeEditorStateSubject$.next(value);
    }

    get codeEditorEffect(): CodeEditorEffects {
        return this.codeEditorEffectSubject$.value;
    }

    set codeEditorEffect(value: CodeEditorEffects) {
        this.codeEditorEffectSubject$.next(value);
    }

    get langValue(): string {
        return this.lang.value;
    }

    set langValue(value: string) {
        this.lang.next(value);
    }
}
