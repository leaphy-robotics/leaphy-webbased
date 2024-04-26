import { Injectable, ElementRef } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { LocalStorageService } from "../services/localstorage.service";
import { PythonFile } from "../domain/python-file.type";

@Injectable({
    providedIn: "root",
})
export class BlocklyEditorState {
    constructor(private localStorage: LocalStorageService) {
        let isSoundOn = this.localStorage.fetch<boolean>("isSoundOn");
        if (isSoundOn === null) {
            this.localStorage.store("isSoundOn", true);
            isSoundOn = true;
        }
        this.isSoundOnSubject$ = new BehaviorSubject<boolean>(isSoundOn);
        this.isSoundOn$ = this.isSoundOnSubject$.asObservable();
    }

    private isSideNavOpenSubject$ = new BehaviorSubject(false);
    public isSideNavOpen$ = this.isSideNavOpenSubject$.asObservable();

    private blocklyElementSubject$ = new BehaviorSubject<ElementRef>(null);
    public blocklyElement$ = this.blocklyElementSubject$.asObservable();

    private blocklyConfigSubject$ = new BehaviorSubject<any>({
        scrollbars: true,
        zoom: {
            controls: true,
            wheel: false,
            startScale: 0.8,
            maxScale: 3,
            minScale: 0.3,
            scaleSpeed: 1.2,
        },
        trashcan: true,
        move: {
            scrollbars: true,
            drag: true,
            wheel: true,
        },
        renderer: "zelos",
        media: "media",
    });
    public blocklyConfig$ = this.blocklyConfigSubject$.asObservable();

    private toolboxXmlSubject$ = new BehaviorSubject(null);
    public toolboxXml$ = this.toolboxXmlSubject$.asObservable();

    private workspaceSubject$ = new BehaviorSubject<any>(null);
    public workspace$ = this.workspaceSubject$.asObservable();

    private workspaceJSONSubject$ = new BehaviorSubject(null);
    public workspaceJSON$ = this.workspaceJSONSubject$.asObservable();

    private projectFileHandleSubject$ = new BehaviorSubject<
        FileSystemFileHandle | PythonFile
    >(null);
    public projectFileHandle$ = this.projectFileHandleSubject$.asObservable();

    private undoSubject$ = new BehaviorSubject<boolean>(false);
    public undo$ = this.undoSubject$.asObservable();

    private isSoundToggledSubject$ = new BehaviorSubject<boolean>(false);
    public isSoundToggled$ = this.isSoundToggledSubject$.asObservable();

    private isSoundOnSubject$: BehaviorSubject<boolean>;
    public isSoundOn$: Observable<boolean>;

    private playSoundFunctionSubject$ = new BehaviorSubject<
        (name: string, opt_volume: number) => void
    >(null);
    public playSoundFunction$ = this.playSoundFunctionSubject$.asObservable();

    set isSideNavOpen(status: boolean) {
        this.isSideNavOpenSubject$.next(status);
    }

    get isSideNavOpen(): boolean {
        return this.isSideNavOpenSubject$.getValue();
    }

    get blocklyElement(): ElementRef {
        return this.blocklyElementSubject$.getValue();
    }

    set blocklyElement(element: ElementRef) {
        this.blocklyElementSubject$.next(element);
    }

    set toolboxXml(toolboxXml: any) {
        this.toolboxXmlSubject$.next(toolboxXml);
    }

    set workspace(workspace: any) {
        workspace.resize();
        this.workspaceSubject$.next(workspace);
    }

    get workspace(): any {
        return this.workspaceSubject$.getValue();
    }

    set workspaceJSON(workspaceXml: any) {
        this.workspaceJSONSubject$.next(workspaceXml);
    }

    set projectFileHandle(path: FileSystemFileHandle | PythonFile) {
        this.projectFileHandleSubject$.next(path);
    }

    get projectFileHandle(): FileSystemFileHandle | PythonFile {
        return this.projectFileHandleSubject$.getValue();
    }

    set undo(redo: boolean) {
        this.undoSubject$.next(redo);
    }

    set isSoundToggled(_: any) {
        this.isSoundToggledSubject$.next(true);
    }

    set isSoundOn(isSoundOn: boolean) {
        this.localStorage.store("isSoundOn", isSoundOn);
        this.isSoundOnSubject$.next(isSoundOn);
    }

    set playSoundFunction(fn: (name: string, opt_volume: number) => void) {
        this.playSoundFunctionSubject$.next(fn);
    }

    get workspaceJSON(): string {
        return this.workspaceJSONSubject$.getValue();
    }

    get blocklyConfig(): any {
        return this.blocklyConfigSubject$.getValue();
    }
}
