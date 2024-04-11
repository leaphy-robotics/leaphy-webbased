import {Injectable,} from "@angular/core";
import {BehaviorSubject, Observable} from "rxjs";
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

    private codeSubject$: BehaviorSubject<string> = new BehaviorSubject<string>('');
    public code$: Observable<string> = this.codeSubject$.asObservable();

    public saveState: boolean = true
    public libraryCache: Library[] = [];
    public installedLibraries: InstalledLibrary[] =[];

    constructor() { }

    set code(program: string){
        if (
            this.codeSubject$.value !== program &&
            this.codeSubject$.value !== this.originalProgram
        )
            this.saveState = false

        this.codeSubject$.next(program);
    }

    public afterSave() {
        this.saveState = true
    }

    get code(){
        return this.codeSubject$.value;
    }
}
