import BaseProtocol from "../base";

/*
 * The following is a list of supported microcontrollers.
 */
const supportedMicrocontrollers = ["atmega328p", "atmega2560"];

/*
 * The following is a dictionary of microcontroller to avrdude arguments.
 */
const microcontrollersToArgs = {
    atmega328p:
        "avrdude -P /dev/null -V -v -p atmega328p -c stk500v1 -C /tmp/avrdude.conf -b 115200 -D -U flash:w:/tmp/program.hex:i",
    atmega2560:
        "avrdude -P /dev/null -V -v -p atmega2560 -c stk500v2 -C /tmp/avrdude.conf -b 115200 -D -U flash:w:/tmp/program.hex:i",
};

export default class Avrdude extends BaseProtocol {
    async upload(response: Record<string, string>) {
        const Module = await import(
            "@leaphy-robotics/avrdude-webassembly/avrdude.js"
        );
        const avrdude = await Module.default({
            locateFile: (path: string) => {
                return `/${path}`;
            },
            'printErr': function(text) { alert('stderr: ' + text) }
        });
        window["funcs"] = avrdude;
        // check if port is open
        if (this.port.readable || this.port.writable) {
            await this.port.close();
        }
        await this.port.open({ baudRate: 115200 });
        window["activePort"] = this.port;
        const avrdudeConfig = await fetch("/avrdude.conf").then((res) =>
            res.text(),
        );
        avrdude.FS.writeFile("/tmp/avrdude.conf", avrdudeConfig);
        avrdude.FS.writeFile("/tmp/program.hex", response["hex"]);
        // get board
        const mcu =
            this.uploader.appState.selectedRobotType.protocol?.microcontroller;
        if (!supportedMicrocontrollers.includes(mcu)) {
            throw new Error("Unsupported microcontroller");
        }
        const args = microcontrollersToArgs[mcu];

        // create a promise that resolves when the port.ondisconnect event is fired
        const disconnectPromise = new Promise((resolve) => {
            // todo: add disconnect events for fallback, driver currently does not support this
            if (
                typeof SerialPort === "undefined" ||
                !(this.port instanceof SerialPort)
            )
                return;

            this.port.ondisconnect = resolve;
        });
        console.error
        const oldConsoleError = console.error;
        const workerErrorPromise = new Promise((resolve) => {
            console.error = (...data) => {
                if (data[1].name == "ExitStatus") {
                    resolve({ type: "worker-error" });
                } else {
                    oldConsoleError(...data);
                    resolve({ type: "error" });
                }
            }
        });
        const startAvrdude = avrdude.cwrap("startAvrdude", "number", ["string"])
        
        let race = await Promise.race([disconnectPromise, startAvrdude(args), workerErrorPromise]);
        console.error = oldConsoleError;
        if (race.type) {
            if (race.type == "worker-error") {
                race = -3;
            } else {
                race = -2;
            }
        }

        if (window["writeStream"]) window["writeStream"].releaseLock();

        const log = window["avrdudeLog"];
        this.robotWiredState.clearUploadLog();
        for (let i = 0; i < log.length; i++) {
            this.robotWiredState.addToUploadLog(log[i]);
        }

        if (race != 0) {
            if (race == -2) {
                throw new Error("Port disconnected");
            } else if (race == -3) {
                throw new Error("Worker error");
            }
            throw new Error("Avrdude failed");
        }
        await this.port.open({ baudRate: 115200 });
        this.uploadState.statusMessage = "UPDATE_COMPLETE";
    
    
        // if the winner is the disconnect promise, then the port was disconnected and we should stop the other promise
        
        
        return;
    }
}
