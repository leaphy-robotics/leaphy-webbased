import BaseProtocol from "../base";
import {convertArrayToHex, delay, includesAll} from "../../utils";
import {Requests, Responses, Signature} from "./stk500";
import {parse} from "intel-hex";
import {Buffer} from "buffer";

export default class Stk500v1 extends BaseProtocol {
    /**
     * Upload a program to the Arduino.
     * @param res The program to upload.
     */
    async upload(res: Record<string, string>) {
        const program = res['hex']
        if (this.robotWiredState.getAbortController() != null) {
            this.robotWiredState.getAbortController().abort("Upload started");
            this.robotWiredState.setAbortController(null);
            await delay(1000);
        }

        this.robotWiredState.clearUploadLog()

        this.uploader.readStream = this.port.readable.getReader();
        this.uploader.writeStream = this.port.writable.getWriter();

        let response;
        // start timer
        try {
            response = await this.attemptNewBootloader();
            this.robotWiredState.addToUploadLog("Using new bootloader")
        } catch {
            response = await this.attemptOldBootloader();
            if (response !== null) {
                this.robotWiredState.addToUploadLog("Using old bootloader")
            }
        }

        if (response === null) {
            this.uploadState.setStatusMessage("COULD_NOT_CONNECT")
            throw new Error('Could not connect to Arduino')
        }

        if (!includesAll([Responses.IN_SYNC, Responses.OK], response)) {
            this.uploadState.setStatusMessage("NOT_IN_SYNC")
            throw new Error('Arduino is not in sync')
        }

        // Try to match signature
        const signature = await this.send([0x75]);
        if (!includesAll(Signature, signature)) {
            this.uploadState.setStatusMessage("SIGNATURE_MISMATCH")
            throw new Error('Arduino does not match signature')
        }


        const optionsResponse = await this.writeOptions({ pagesizehigh: 0, pagesizelow: 128 });
        if (!includesAll([Responses.OK], optionsResponse)) {
            this.uploadState.setStatusMessage("OPTIONS_NOT_ACCEPTED")
            throw new Error('Arduino did not accept options')
        }

        // Start programming
        await this.send([Requests.ENTER_PROG_MODE]);

        await this.writeProgram(program);

        await this.send([Requests.LEAVE_PROG_MODE]);

        // Reset the Arduino
        try {
            await this.reset(115200);
        } catch (error) {}

        // Complete the upload
        this.uploadState.setStatusMessage("UPDATE_COMPLETE")
    }


    /**
     * Try to the sync with the Arduino using the old bootloader
     * @returns {Promise<string>} The response of the Device
     */
    async attemptOldBootloader() : Promise<string> {
        let response = null
        try {
            await this.reset(57600);
        } catch (error) {
            this.uploadState.setStatusMessage("COULD_NOT_CONNECT")
            throw new Error('Could not connect to Arduino: Reset failed')
        }
        for (let i = 0; i < 10; i++) {
            try {
                response = await this.send([Requests.GET_SYNC], 500)
                break
            } catch (error) {
                this.robotWiredState.addToUploadLog(error.toString())
            }
        }
        if (response === null) {
            this.uploader.readStream.releaseLock();
            this.uploader.writeStream.releaseLock();
            this.uploader.readStream = null;
            this.uploader.writeStream = null;
            this.uploadState.setStatusMessage("COULD_NOT_CONNECT")
            this.robotWiredState.addToUploadLog("Could not connect to Arduino (old bootloader)")
            throw new Error('Could not connect to Arduino')
        }
        return response
    }


    /**
     * Try to the sync with the Arduino using the new bootloader.
     * @returns {Promise<string>} The response of the Device
     */
    async attemptNewBootloader() : Promise<string> {
        let response = null
        try {
            await this.reset(this.serialOptions.baudRate);
        } catch (error) {
            this.robotWiredState.addToUploadLog("Could not connect to Arduino: Reset failed (new bootloader)")
            this.uploadState.setStatusMessage("COULD_NOT_CONNECT")
            throw new Error('Could not connect to Arduino: Reset failed')
        }
        for (let i = 0; i < 10; i++) {
            try {
                response = await this.send([Requests.GET_SYNC], 500)
                break;
            } catch (error) {
                this.robotWiredState.addToUploadLog(error.toString())
            }
        }
        if (response === null) {
            this.robotWiredState.addToUploadLog("Could not connect to Arduino (new bootloader)")
            throw new Error('Could not connect to Arduino')
        }
        return response
    }


    /**
     * Write a program to the Arduino.
     * @param program
     */
    async writeProgram(program: string) {
        const hex = parse(program);

        let data: Buffer = hex.data;
        let i = 0;
        do {
            const offset = Math.min(data.length, 128);
            const page = data.subarray(0, offset);
            data = data.subarray(offset);
            const length = page.length;
            const lengthHigh = length >> 8;
            const lengthLow = length & 0xff;
            const startAddress = (hex.startSegmentAddress + i) >> 1;

            await this.send([Requests.SET_ADDRESS, startAddress & 0xff, (startAddress >> 8) & 0xff]);
            const buffer = new Uint8Array([Requests.SET_PAGE, lengthHigh, lengthLow, 0x46, ...page]);
            await this.send(buffer);

            i += page.length;
            this.uploadState.addProgress(100 / hex.data.length * page.length)
        } while (data.length > 0);
        this.uploadState.setProgress(150)
    }

    /**
     * Write the options to the Arduino.
     * @returns {Promise<number[]>} The response of the Device
     * @param options The options to write
     */
    async writeOptions(options) {
        const buffer = new Uint8Array([
            0x42,
            options.devicecode || 0,
            options.revision || 0,
            options.progtype || 0,
            options.parmode || 0,
            options.polling || 0,
            options.selftimed || 0,
            options.lockbytes || 0,
            options.fusebytes || 0,
            options.flashpollval1 || 0,
            options.flashpollval2 || 0,
            options.eeprompollval1 || 0,
            options.eeprompollval2 || 0,
            options.pagesizehigh || 0,
            options.pagesizelow || 0,
            options.eepromsizehigh || 0,
            options.eepromsizelow || 0,
            options.flashsize4 || 0,
            options.flashsize3 || 0,
            options.flashsize2 || 0,
            options.flashsize1 || 0
        ]);

        return await this.send(buffer);

    }


    /**
     * Send commands to the Arduino.
     * @returns The response of the Device
     * @param command
     * @param timeoutMs
     */
    async send(command, timeoutMs = 1000) {
        const buffer = new Uint8Array([...command, Requests.CRC_EOP]);
        this.robotWiredState.addToUploadLog("Sending: " + convertArrayToHex(buffer).join(' '))
        await this.writeBuffer(buffer);

        const timeoutPromise = new Promise((resolve, _) => {
            setTimeout(() => {
                resolve("Timeout");
            }, timeoutMs);
        });

        var IN_SYNC = false;
        var OK = false;
        var returnBuffer = new Uint8Array(0);
        while (true) {
            const promise = this.receive();
            const result = await Promise.race([promise, timeoutPromise]);

            if (result instanceof Uint8Array) {
                const answer = Array.from(result);
                if (answer.includes(Responses.NOT_IN_SYNC)) {
                    this.robotWiredState.addToUploadLog("Arduino is not in sync")
                    throw new Error('Arduino is not in sync');
                } else
                    returnBuffer = new Uint8Array([...returnBuffer, ...answer]);
                if (answer.includes(Responses.IN_SYNC))
                    IN_SYNC = true;
                if (answer.includes(Responses.OK))
                    OK = true;
                if (OK && IN_SYNC)
                    return returnBuffer;
            } else if (result === "Timeout") {
                await this.uploader.readStream.cancel();
                await this.uploader.readStream.releaseLock();
                this.uploader.readStream = this.port.readable.getReader();
                throw new Error('Timeout');
            }
        }
    }


    /**
     * Send raw bytes to the Arduino.
     * @param {Uint8Array} data The bytes to send.
     */
    async writeBuffer(data) {
        await this.uploader.writeStream.write(data)
    }


    /**
     * Read raw bytes from the Arduino.
     * @returns {Promise<Uint8Array>} The bytes received.
     */
    async receive() {
        const { value } = await this.uploader.readStream.read()
        this.robotWiredState.addToUploadLog("Received: " + convertArrayToHex(value).join(' '))
        return value
    }
}
