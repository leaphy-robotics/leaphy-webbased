import {AfterViewInit, Component, ViewChild} from '@angular/core';
import {FunctionsUsingCSI, NgTerminal} from "ng-terminal";
import {RobotWiredState} from "../../../../state/robot.wired.state";
import {PythonUploaderService} from "../../../../services/python-uploader/PythonUploader.service";

@Component({
    selector: 'app-terminal',
    templateUrl: './terminal.component.html',
    styleUrls: ['./terminal.component.scss']
})
export class TerminalComponent implements AfterViewInit {
    readonly prompt = '\r\n' + FunctionsUsingCSI.cursorColumn(1) + '$ ';

    @ViewChild('term', {static: false}) child: NgTerminal;
    private abortController: AbortController = null;

    constructor(
        private robotWireState: RobotWiredState,
        private pythonUploader: PythonUploaderService,
    ) {}


    ngAfterViewInit() {
        let currentLine = '';
        let currentIndent = 0;
        this.child.onData().subscribe((input) => {
            if (!this.robotWireState.getPythonDeviceConnected()) {
                return;
            }
            if (this.robotWireState.getPythonCodeRunning()) {
                if (input === '\u0003') {
                    // Send keyboard interrupt to Python code
                    this.pythonUploader.sendKeyboardInterrupt();
                }
                return;
            }
            if (input === '\r') { // Carriage Return (When Enter is pressed)
                this.pythonUploader.runCode(currentLine);
                this.child.write('\r\n');
                currentLine = '';
            } else if (input === '\u007f') { // Delete (When Backspace is pressed)
                if (this.child.underlying.buffer.active.cursorX > 2) {
                    // if we are not at the last character in the line we make it a space else we just delete the last character
                    if (currentIndent < currentLine.length) {
                        currentLine = currentLine.substring(0, currentIndent - 1) + ' ' + currentLine.substring(currentIndent);
                    } else {
                        currentLine = currentLine.substring(0, currentIndent - 1);
                    }
                    currentIndent--;
                    this.child.write('\b \b');
                }
            } else if (input === '\u0003') { // End of Text (When Ctrl and C are pressed)
                this.child.write('^C');
                this.child.write(this.prompt);
            } else {
                // if there is a left arrow key press we do currentIndent-- and move the cursor back one space
                // if there is a right arrow key press we do currentIndent++ and move the cursor forward one space
                if (input === '\u001b[D') {
                    if (currentIndent > 0) {
                        currentIndent--;
                    }
                }
                if (input === '\u001b[C') {
                    if (currentIndent < currentLine.length) {
                        currentIndent++;
                    }
                }

                // make sure it is a printable character so for example no arrow keys just letters and numbers
                // if we are under the current y position it is read only so we don't want to write to it

                if (!(this.child.underlying.buffer.active.cursorY < this.child.underlying.buffer.active.baseY)) {
                    if (input.length === 1 && input.charCodeAt(0) >= 32 && input.charCodeAt(0) <= 126) {
                        // replace the charachter at the current indent with the input
                        currentLine = currentLine.substring(0, currentIndent) + input + currentLine.substring(currentIndent + 1);
                        currentIndent++;
                    }
                }
            }
            this.child.write(input);
        });

        this.robotWireState.isPythonDeviceConnected$.subscribe((connected) => {
            if (connected) {
                this.child.write(this.prompt);
            }
        });

        this.robotWireState.isPythonCodeRunning$.subscribe(async (isRunning) => {
            if (isRunning) {
                var port = this.robotWireState.getSerialPort();
                const abortController = new AbortController();

                const child = this.child;
                const decoder = new TextDecoder("utf-8");
                const encoder = new TextEncoder();
                const EOF = 0x04;
                let readingStdOut = false;
                let readingStdErr = false;
                let done = false;
                const writableStream = new WritableStream({
                    write: async (c) => {
                        function decode(chunk: Uint8Array) {
                            let overFlowChunk = new Uint8Array();

                            // get the OK
                            if (decoder.decode(chunk).includes('OK')) {
                                readingStdOut = true;
                                // cut everything before the first OK in the UInt8array so "OKa" would become "a"
                                chunk = chunk.slice(chunk.indexOf(79) + 2);
                            }

                            if (chunk.includes(EOF)) {
                                if (readingStdErr) {
                                    // chop everything after the EOF
                                    //chunkString = chunkString.slice(0, chunkString.lastIndexOf(decoder.decode(new Uint8Array([EOF]))));
                                    chunk = chunk.slice(0, chunk.lastIndexOf(EOF));
                                    done = true;
                                } else {
                                    // chop everything after the first EOF and throw it in the overflow chunk
                                    overFlowChunk = chunk.slice(chunk.indexOf(EOF) + 1);
                                    //chunkString = chunkString.slice(0, chunkString.indexOf(decoder.decode(new Uint8Array([EOF]))));
                                    chunk = chunk.slice(0, chunk.indexOf(EOF));
                                }
                            }


                            if (readingStdErr) {
                                child.write('\x1b[31m' + decoder.decode(chunk) + '\x1b[0m');
                            } else if (readingStdOut) {
                                child.write(decoder.decode(chunk));
                            }

                            if (overFlowChunk.length > 0) {
                                readingStdErr = true;
                                decode(overFlowChunk);
                            }
                        }

                        decode(c);

                        if (done) {
                            console.log('Done');
                            this.robotWireState.setPythonCodeRunning(false);
                        }
                    },
                });

                const readableStream = port.readable;

                const pipePromise = readableStream.pipeTo(writableStream, {signal: abortController.signal});
                this.abortController = abortController;

                pipePromise.catch((error) => {
                    if (error.toString().includes('Upload started')) {
                        this.robotWireState.setPythonCodeRunning(false);
                        console.log('Stream aborted');
                    } else if (error.toString().includes('The device has been lost.')) {
                        this.robotWireState.setSerialPort(null);
                        console.log('Device disconnected');
                    } else if (error.toString().includes('Running code done')) {
                        console.log('Running code done');
                    } else {
                        this.robotWireState.setSerialPort(null);
                        console.error('Error while piping stream:', error);
                    }
                }).then(
                    async () => {
                        if (port == null) {
                            port = this.robotWireState.getSerialPort();
                        }
                        await port.close();
                        await port.open({baudRate: 115200});
                    }
                );
            } else {

                if (this.abortController !== null) {
                    this.abortController.abort("Running code done");
                    this.abortController = null;
                }
                this.child.write(this.prompt);
            }
        });
    }
}
