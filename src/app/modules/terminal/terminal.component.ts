import {AfterViewInit, Component, ViewChild} from '@angular/core';
import {FunctionsUsingCSI, NgTerminal} from "ng-terminal";

@Component({
  selector: 'terminal',
  templateUrl: './terminal.component.html',
  styleUrls: ['./terminal.component.scss']
})
export class TerminalComponent implements AfterViewInit {
    readonly prompt = '\n' + FunctionsUsingCSI.cursorColumn(1) + '$ ';

    @ViewChild('term', {static: false}) child: NgTerminal;

    ngAfterViewInit() {
        this.child.onData().subscribe((input) => {
            if (input === '\r') { // Carriage Return (When Enter is pressed)
                this.child.write(this.prompt);
            } else if (input === '\u007f') { // Delete (When Backspace is pressed)
                if (this.child.underlying.buffer.active.cursorX > 2) {
                    this.child.write('\b \b');
                }
            } else if (input === '\u0003') { // End of Text (When Ctrl and C are pressed)
                this.child.write('^C');
                this.child.write(this.prompt);
            } else
                this.child.write(input);
        });
    }
}
