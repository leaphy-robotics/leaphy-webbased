import {
    AfterViewInit,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnChanges,
    Output,
    SimpleChanges,
    ViewChild
} from "@angular/core";
import * as monaco from 'monaco-editor'

@Component({
    selector: "monaco-editor",
    styleUrls: ["./monaco.component.scss"],
    templateUrl: "./monaco.component.html",
})
export class MonacoComponent implements AfterViewInit, OnChanges {
    @Input() language = 'cpp'

    @Input() code = ''
    @Output() codeChange = new EventEmitter<string>()

    @Input() readonly = false

    @ViewChild('element') element: ElementRef<HTMLDivElement>
    private editor?: monaco.editor.IStandaloneCodeEditor

    ngAfterViewInit() {
        this.editor = monaco.editor.create(this.element.nativeElement, {
            value: this.code,
            language: this.language,
            automaticLayout: true,
            readOnly: this.readonly,
        })

        this.editor.getModel().onDidChangeContent(() => {
            this.setCode(this.editor.getValue())
        })
    }

    ngOnChanges(changes: SimpleChanges) {
        if (!this.editor) return
        if (this.editor.getValue() !== changes.code.currentValue) {
            this.editor.setValue(changes.code.currentValue)
        }
    }

    public setCode(code: string) {
        this.code = code
        this.codeChange.emit(code)
    }
}
