import {ElementRef, Injectable,} from "@angular/core";
import {Ace} from "ace-builds";
import {BehaviorSubject, Observable} from "rxjs";
import {filter, map, withLatestFrom} from "rxjs/operators";
import {InstalledLibrary, Library} from "src/app/domain/library-manager.types";
import "prismjs";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-arduino";
declare var Prism: any;

@Injectable({
    providedIn: 'root'
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

    public tokenizedCode$ = this.code$.pipe(filter((code) => !!code)).pipe(
        map((code) => {
            return Prism.highlight(code, Prism.languages.arduino);
        })
    );

    private libraryCacheSubject$: BehaviorSubject<Library[]> = new BehaviorSubject<Library[]>([]);
    private InstalledLibraries$: BehaviorSubject<InstalledLibrary[]> = new BehaviorSubject<InstalledLibrary[]>([]);

    public isDirty$: Observable<boolean>;


    constructor() {

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

    public setLibraryCache(cache: Library[]){
        this.libraryCacheSubject$.next(cache);
    }

    public getLibraryCache(){
        return this.libraryCacheSubject$.value;
    }

    public setInstalledLibraries(libraries: InstalledLibrary[]){
        this.InstalledLibraries$.next(libraries);
    }

    public getInstalledLibraries(){
        return this.InstalledLibraries$.value;
    }
}
