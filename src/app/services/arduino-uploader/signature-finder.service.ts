import { Injectable } from '@angular/core';
import {RobotWiredState} from "../../state/robot.wired.state";
import { clearReadBuffer, delay } from "./utils";
import {AppState} from "../../state/app.state";

@Injectable({
    providedIn: 'root'
})
export class SignatureFinderService {

    constructor(
        private robotWiredState: RobotWiredState,
        private appState: AppState,
    ) {}



    private async reset(port: SerialPort) {
        await port.close();
        await port.open({ baudRate: 115200 });
        const readStream = port.readable.getReader();

        try {
            await port.setSignals({ dataTerminalReady: false })
            await delay(250);
            await port.setSignals({ dataTerminalReady: true })
            await clearReadBuffer(readStream);
        } catch (e) {
            throw e;
        }

        readStream.releaseLock();
    }

    private async read(reader: ReadableStreamDefaultReader<Uint8Array>): Promise<Uint8Array> {
        async function receive() {
            const { value } = await reader.read();
            return value;
        }

        async function timeout(timeoutMs: number) {
            await new Promise(resolve => setTimeout(resolve, timeoutMs));
            return "timeout";
        }

        let result = await Promise.race([receive(), timeout(5000)]);

        if (result instanceof Uint8Array) {
           return result;
        } else {
            console.log(result);
        }
        return new Uint8Array();
    }

    private async findSignatureForProgrammer(port: SerialPort, programmer: string): Promise<Uint8Array> {


        await this.reset(port);

        const writer = port.writable.getWriter();
        const reader = port.readable.getReader();

        switch (programmer) {
            case "stk500v1":
                // send sync command
                console.log("Sending sync command to programmer", programmer);
                await writer.write(new Uint8Array([0x30, 0x20]));
                const response = await this.read(reader);
                if (response.length == 0) {
                    console.log("No response from programmer", programmer);
                    writer.releaseLock();
                    reader.releaseLock();
                    return new Uint8Array();
                } else {
                    console.log("Response from programmer", programmer, response);
                }

                await writer.write(new Uint8Array([0x75, 0x20]));
                break;
            case "stk500v2":
                await writer.write(new Uint8Array([0x1B, 0x21]));
                break;
            default:
                console.error("Unknown programmer", programmer);
                return new Uint8Array();
        }

        const signature = await this.read(reader);
        if (signature.length !== 0) {
            console.log("Signature found for programmer", programmer, signature);
        } else {
            console.log("No signature found for programmer", programmer);
        }

        writer.releaseLock();
        reader.releaseLock();

        return signature;

    }

    public async findSignature(port: SerialPort): Promise<Uint8Array> {
        if (!('serial' in navigator)) {
            return new Uint8Array();
        }
        console.log("Finding signature for port", port);

        const portInfo = port.getInfo();
        const vendorId = portInfo.usbVendorId;
        const triedProgrammers = [];

        // first try the one that is associate with the current robot
        const currentRobot = this.appState.getSelectedRobotType();
        if (currentRobot && this.robotWiredState.fqbnToProgrammer[currentRobot.fqbn]) {
            console.log("Trying programmer", this.robotWiredState.fqbnToProgrammer[currentRobot.fqbn]);
            const signature = await this.findSignatureForProgrammer(port, this.robotWiredState.fqbnToProgrammer[currentRobot.fqbn]);
            if (signature.length !== 0) {
                return signature;
            }
            triedProgrammers.push(this.robotWiredState.fqbnToProgrammer[currentRobot.fqbn]);
        }

        for (const programmer of this.robotWiredState.usbVendorIdToProgrammer[vendorId]) {
            console.log("Trying programmer", programmer);
            if (triedProgrammers.includes(programmer)) {
                continue;
            }
            const signature = await this.findSignatureForProgrammer(port, programmer);
            if (signature) {
                return signature;
            }
            triedProgrammers.push(programmer);
        }

        for (const programmer of this.robotWiredState.supportedProgrammers) {
            console.log("Trying programmer", programmer);
            if (triedProgrammers.includes(programmer)) {
                continue;
            }
            const signature = await this.findSignatureForProgrammer(port, programmer);
            if (signature.length !== 0) {
                return signature;
            }
        }

        return new Uint8Array();
    }
}
