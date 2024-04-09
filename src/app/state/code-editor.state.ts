import {Injectable,} from "@angular/core";
import {BehaviorSubject, Observable} from "rxjs";
import {map, withLatestFrom} from "rxjs/operators";
import {InstalledLibrary, Library} from "src/app/domain/library-manager.types";

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

    private startCodeSubject$: BehaviorSubject<string> = new BehaviorSubject<string>('');
    public startCode$: Observable<string>;

    private codeSubject$: BehaviorSubject<string> = new BehaviorSubject<string>('');
    public code$: Observable<string> = this.codeSubject$.asObservable();

    private saveStateSubject$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true)

    private libraryCacheSubject$: BehaviorSubject<Library[]> = new BehaviorSubject<Library[]>([]);
    private InstalledLibraries$: BehaviorSubject<InstalledLibrary[]> = new BehaviorSubject<InstalledLibrary[]>([]);

    public isDirty$: Observable<boolean>;


    constructor() {
        this.isDirty$ = this.code$
            .pipe(withLatestFrom(this.startCode$))
            .pipe(map(([code, original]) => code !== original))
    }

    set originalCode(program: string){
        this.startCodeSubject$.next(program);
    }

    set code(program: string){
        if (
            this.codeSubject$.value !== program &&
            this.codeSubject$.value !== this.originalProgram
        )
            this.saveStateSubject$.next(false);

        this.codeSubject$.next(program);
    }

    public afterSave() {
        this.saveStateSubject$.next(true)
    }

    set saveState(saved: boolean) {
        this.saveStateSubject$.next(saved)
    }

    get saveState() {
        return this.saveStateSubject$.value
    }

    get code(){
        return this.codeSubject$.value;
    }

    set libraryCache(cache: Library[]){
        this.libraryCacheSubject$.next(cache);
    }

    get libraryCache(){
        return this.libraryCacheSubject$.value;
    }

    set installedLibraries(libraries: InstalledLibrary[]){
        this.InstalledLibraries$.next(libraries);
    }

    get installedLibraries(){
        return this.InstalledLibraries$.value;
    }
}
