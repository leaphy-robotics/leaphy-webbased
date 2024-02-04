import { Injectable, ElementRef } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { SketchStatus } from "../domain/sketch.status";
import { map, filter } from "rxjs/operators";
import { WorkspaceStatus } from "../domain/workspace.status";
import { LocalStorageService } from "../services/localstorage.service";
import "prismjs";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-arduino";
import {PythonFile} from "../domain/python-file.type";

declare var Prism: any;

@Injectable({
    providedIn: "root",
})
export class BlocklyEditorState {

    constructor(private localStorage: LocalStorageService){
        let isSoundOn = this.localStorage.fetch<boolean>("isSoundOn");
        if (isSoundOn === null) {
            this.localStorage.store("isSoundOn", true);
            isSoundOn = true;
        }
        this.isSoundOnSubject$ = new BehaviorSubject<boolean>(isSoundOn);
        this.isSoundOn$ = this.isSoundOnSubject$.asObservable();
    }

    private codeSubject$ = new BehaviorSubject("");
    public code$ = this.codeSubject$.asObservable();

    public tokenizedCode$ = this.code$.pipe(filter((code) => !!code)).pipe(
        map((code) => {
            return Prism.highlight(code, Prism.languages.arduino);
        })
    );

    private sketchStatusSubject$: BehaviorSubject<SketchStatus> = new BehaviorSubject(
        SketchStatus.UnableToSend
    );
    public sketchStatus$ = this.sketchStatusSubject$.asObservable();

    private sketchStatusMessageSubject$ = new BehaviorSubject("");
    public sketchStatusMessage$ = this.sketchStatusMessageSubject$.asObservable();

    private isSideNavOpenToggledSubject$ = new BehaviorSubject<boolean>(false);
    public isSideNavOpenToggled$ = this.isSideNavOpenToggledSubject$.asObservable();

    private isSideNavOpenSubject$ = new BehaviorSubject(false);
    public isSideNavOpen$ = this.isSideNavOpenSubject$.asObservable();

    private blocklyElementSubject$ = new BehaviorSubject<ElementRef<any>>(null);
    public blocklyElement$ = this.blocklyElementSubject$.asObservable();

    private workspaceStatusSubject$: BehaviorSubject<WorkspaceStatus> = new BehaviorSubject(
        WorkspaceStatus.Clean
    );
    public workspaceStatus$ = this.workspaceStatusSubject$.asObservable();

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

    private workspaceXmlSubject$ = new BehaviorSubject(null);
    public workspaceXml$ = this.workspaceXmlSubject$.asObservable();

    private projectFileHandleSubject$ = new BehaviorSubject<FileSystemFileHandle | PythonFile>(null);
    public projectFileHandle$ = this.projectFileHandleSubject$.asObservable();

    private undoSubject$ = new BehaviorSubject<boolean>(false);
    public undo$ = this.undoSubject$.asObservable();

    private isSoundToggledSubject$ = new BehaviorSubject<boolean>(false);
    public isSoundToggled$ = this.isSoundToggledSubject$.asObservable();

    private isSoundOnSubject$: BehaviorSubject<boolean>;
    public isSoundOn$: Observable<boolean>;

    private playSoundFunctionSubject$ = new BehaviorSubject<(name, opt_volume) => void>(null);
    public playSoundFunction$ = this.playSoundFunctionSubject$.asObservable();

    public setCode(code: string): void {
        this.codeSubject$.next(code);
    }

    public setSketchStatus(status: SketchStatus) {
        this.sketchStatusSubject$.next(status);
    }

    public setSketchStatusMessage(message: string) {
        this.sketchStatusMessageSubject$.next(message);
    }

    public setIsSideNavOpen(status: boolean) {
        this.isSideNavOpenSubject$.next(status);
    }

    public setBlocklyElement(element: ElementRef<any>) {
        this.blocklyElementSubject$.next(element);
    }

    public setWorkspaceStatus(status: WorkspaceStatus) {
        console.log("Workspace status changed to: " + status);
        this.workspaceStatusSubject$.next(status);
    }

    public setToolboxXml(toolboxXml: any) {
        this.toolboxXmlSubject$.next(toolboxXml);
    }

    public setWorkspace(workspace: any) {
        workspace.resize();
        this.workspaceSubject$.next(workspace);
    }

    public setWorkspaceXml(workspaceXml: any) {
        this.workspaceXmlSubject$.next(workspaceXml);
    }

    public setProjectFileHandle(path: FileSystemFileHandle | PythonFile) {
        this.projectFileHandleSubject$.next(path);
    }

    public getProjectFileHandle(): FileSystemFileHandle | PythonFile {
        return this.projectFileHandleSubject$.getValue();
    }

    public setUndo(redo: boolean) {
        this.undoSubject$.next(redo);
    }

    public setIsSoundToggled() {
        this.isSoundToggledSubject$.next(true);
    }

    public setIsSoundOn(isSoundOn: boolean) {
        this.localStorage.store("isSoundOn", isSoundOn);
        this.isSoundOnSubject$.next(isSoundOn);
    }

    public setPlaySoundFunction(fn: (name, opt_volume) => void) {
        this.playSoundFunctionSubject$.next(fn);
    }

    public setIsSideNavOpenToggled() {
        this.isSideNavOpenToggledSubject$.next(true);
    }

    get code(): string {
        return this.codeSubject$.getValue();
    }

    get workspaceXml(): string {
        return this.workspaceXmlSubject$.getValue();
    }
}
