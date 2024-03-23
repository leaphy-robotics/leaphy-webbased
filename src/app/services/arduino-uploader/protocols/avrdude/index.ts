import BaseProtocol from "../base";

/*
    * The following is a list of supported microcontrollers.
 */
const supportedMicrocontrollers = ['atmega328p', 'atmega2560']

/*
    * The following is a dictionary of microcontroller to avrdude arguments.
 */
const microcontrollersToArgs = {
    'atmega328p': 'avrdude -P /dev/null -V -v -p atmega328p -c stk500v1 -C /tmp/avrdude.conf -b 115200 -D -U flash:w:/tmp/program.hex:i',
    'atmega2560': 'avrdude -P /dev/null -V -v -p atmega2560 -c stk500v2 -C /tmp/avrdude.conf -b 115200 -D -U flash:w:/tmp/program.hex:i'
}


export default class Avrdude extends BaseProtocol {

    async upload(response: Record<string, string>) {
        const Module = await import('@leaphy-robotics/avrdude-webassembly/avrdude.js')
        const avrdude = await Module.default()
        window["funcs"] = avrdude;
        // check if port is open
        if (this.port.readable || this.port.writable) {
            await this.port.close()
        }
        await this.port.open({ baudRate: 115200 })
        window["activePort"] = this.port
        const avrdudeConfig = await fetch('/avrdude.conf').then(res => res.text())
        avrdude.FS.writeFile('/tmp/avrdude.conf', avrdudeConfig)
        avrdude.FS.writeFile('/tmp/program.hex', response['hex'])
        // get board
        const mcu = this.uploader.appState.getSelectedRobotType().microcontroller
        if (!supportedMicrocontrollers.includes(mcu)) {
            throw new Error('Unsupported microcontroller')
        }
        const args = microcontrollersToArgs[mcu]

        const startAvrdude = avrdude.cwrap("startAvrdude", "number", ["string"])
        const re = await startAvrdude(args);

        if (window["writeStream"])
            window["writeStream"].releaseLock();

        const log = window["avrdudeLog"];
        this.robotWiredState.clearUploadLog();
        for (let i = 0; i < log.length; i++) {
            this.robotWiredState.addToUploadLog(log[i]);
        }

        if (re != 0) {
            throw new Error('Avrdude failed')
        }

        return
    }
}
