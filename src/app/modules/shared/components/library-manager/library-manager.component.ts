import {MatDialogRef} from "@angular/material/dialog";
import {DialogState} from "src/app/state/dialog.state";
import {Component} from "@angular/core";
import {CodeEditorState} from "src/app/state/code-editor.state";
import {AnnotatedLibrary, Library, LibraryResponse} from "src/app/domain/library-manager.types";

@Component({
    selector: "app-library-manager",
    templateUrl: "./library-manager.component.html",
    styleUrls: ["./library-manager.component.scss"],
})
export class LibraryManagerComponent {
    public librariesBack: AnnotatedLibrary[] = [];

    constructor(
        public editorState: CodeEditorState,
        public dialogState: DialogState,
        private dialog: MatDialogRef<LibraryManagerComponent>
    ) {
        if (this.editorState.libraryCache.length === 0) {
            this.loadLibraryCache().then();
        }

        this.filter();
    }

    private async loadLibraryCache() {
        const res = await fetch('https://downloads.arduino.cc/libraries/library_index.json')
        const { libraries } = await res.json() as LibraryResponse

        const result: Map<string, Library> = new Map()
        libraries.forEach(library => {
            if (result.has(library.name)) {
                const existing = result.get(library.name);

                existing.versions.push(library.version);
                existing.versions.sort((a, b) => a.localeCompare(b)*-1);

                return;
            }

            if (library.paragraph) {
                library.paragraph = library.paragraph.replace(/<\/?br ?\/?>/g, "\n");
            }

            result.set(library.name, {
                ...library,
                versions: [library.version]
            })
        })

        this.editorState.libraryCache = Array.from(result.values());
        this.filter();
    }

    set libraries(libraries: Library[]) {
        const installed = this.editorState.installedLibraries;

        this.librariesBack = libraries.map(lib => ({
            ...lib,
            installed: installed.find(installedLib => installedLib.name === lib.name)?.version
        }))
    }

    public filter(filter = "") {
        this.libraries =  this.editorState.libraryCache
                .filter(lib => lib.name.toLowerCase().includes(filter.toLowerCase()))
                .slice(0, 50)
    }

    public close() {
        this.dialog.close();
    }

    public install(library: Library, version: string) {
        // get installed libraries and remove existing version
        const installed = this.editorState.installedLibraries
            .filter((lib) => lib.name !== library.name);

        this.editorState.installedLibraries = [...installed, {
            ...library,
            version
        }];
        this.libraries = this.librariesBack;
    }

    public uninstall(library: Library) {
        const installed = this.editorState.installedLibraries;
        const current = installed.find((lib) => lib.name === library.name);
        if (!current) return;

        this.editorState.installedLibraries = installed.filter((lib) => lib.name !== library.name);
        this.libraries = this.librariesBack;
    }
}
