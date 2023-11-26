import {ElementRef, Injectable,} from "@angular/core";
import {Ace} from "ace-builds";
import {BehaviorSubject, Observable} from "rxjs";
import {map, withLatestFrom} from "rxjs/operators";
import {AppState} from "./app.state";
import {CodeEditorType} from "../domain/code-editor.type";

@Injectable({
    providedIn: 'root',
})
export class CodeEditorState  {
    public readonly originalProgram = `void leaphyProgram() {
}

void setup() {
    leaphyProgram();
}

void loop() {

}`;

    public readonly pythonProgram = `from leaphymicropython.utils.pins import set_pwm`;

    private aceElementSubject$: BehaviorSubject<ElementRef<HTMLElement>> = new BehaviorSubject<ElementRef<HTMLElement>>(null);
    public aceElement$: Observable<ElementRef<HTMLElement>> = this.aceElementSubject$.asObservable();

    private aceEditorSubject$: BehaviorSubject<Ace.Editor> = new BehaviorSubject<Ace.Editor>(null);
    public aceEditor$: Observable<Ace.Editor> = this.aceEditorSubject$.asObservable();

    private startCodeSubject$: BehaviorSubject<string> = new BehaviorSubject<string>('');
    public startCode$: Observable<string>;

    private codeSubject$: BehaviorSubject<string> = new BehaviorSubject<string>('');
    public code$: Observable<string> = this.codeSubject$.asObservable();

    public isDirty$: Observable<boolean>;


    constructor(
        private appState: AppState,
    ) {

        this.isDirty$ = this.code$
            .pipe(withLatestFrom(this.startCode$))
            .pipe(map(([code, original]) => code !== original))
    }

    public setAceElement(element: ElementRef<HTMLElement>) {
        this.aceElementSubject$.next(element);
    }

    public setAceEditor(editor: Ace.Editor){
        this.aceEditorSubject$.next(editor);
    }

    public setOriginalCode(program: string){
        this.startCodeSubject$.next(program);
    }

    public setCode(program: string){
        this.codeSubject$.next(program);
    }

    public getCode(){
        return this.codeSubject$.value;
    }

    public getAceEditor(){
        return this.aceEditorSubject$.value;
    }

    public getOriginalCode(){
        return this.startCodeSubject$.value;
    }
}
