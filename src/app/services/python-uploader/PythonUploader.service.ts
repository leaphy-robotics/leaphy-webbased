import {RobotWiredState} from "../../state/robot.wired.state";
import {sendCommand, exitReplMode, enterReplMode, readResponse} from "./comms/BoardCommunication";
import {put, get, ls, rm, rmdir} from "./filesystem/FileSystem";
import {Injectable, InjectionToken} from "@angular/core";
import {PackageManager} from "./mip/PackageManager";

const SERIAL_OPTIONS = new InjectionToken<{baudRate: number}>('serialOptions');


@Injectable({
    providedIn: 'root'
})
export class PythonUploaderService {
    drive: FileSystemDirectoryHandle = null
    port: SerialPort = null
    private firmware: Blob = null
    private packageManager: PackageManager = new PackageManager();

    constructor(private robotWiredState: RobotWiredState) {
        this.robotWiredState = robotWiredState
        fetch('https://raw.githubusercontent.com/leaphy-robotics/leaphy-firmware/main/micropython/firmware.uf2').then((response) => {
            response.blob().then((blob) => {
                this.firmware = blob;
            });
        });
    }

    private async canPythonCodeRun(use: boolean) {
        if (use == false) {
            await this.sendKeyboardInterrupt();
        }
        this.robotWiredState.setPythonCodeRunning(use);
    }

    async sendKeyboardInterrupt() {
        if (this.port === null)
            throw new Error('Not connected')
        const writer = this.port.writable.getWriter();
        await sendCommand(writer, '\u0003');
        if (this.robotWiredState.getPythonCodeRunning()) {
            const reader = this.port.readable.getReader();
            await readResponse(reader);
            reader.releaseLock()
        }
        writer.releaseLock()

    }

    private async clearReadBuffer(reader: ReadableStreamDefaultReader) {

        while (true) {

        }
    }

    async connect() {

        let port: SerialPort;
        try {
            port = await navigator.serial.requestPort({filters: [{usbVendorId: 11914}]});
        } catch (error) {
            console.log(error)
            throw new Error('No device selected')
        }
        if (port === this.port)
            return
        try {
            await port.open({baudRate: 115200});
        } catch (error) {
            console.log(error)
            throw new Error('Connecting to device')
        }
        this.port = port
        const writer = this.port.writable.getWriter();
        const reader = this.port.readable.getReader();
        // make sure no program is running
        await sendCommand(writer, '\u0003');
        await enterReplMode(writer, reader);
        writer.releaseLock();
        reader.releaseLock();
        this.packageManager.port = port;
        this.robotWiredState.setSerialPort(port);
        await this.canPythonCodeRun(false)
    }

    async connectInBootMode() {
        let device: FileSystemDirectoryHandle;
        try {
            // @ts-ignore
            device = await window.showDirectoryPicker();
        } catch (error) {
            console.log(error)
            throw new Error('No device selected')
        }
        if (device === this.drive)
            return
        this.drive = device
    }

    async flash() {
        if (!(await PythonUploaderService.checkFilesystem(this.drive)))
            throw new Error('Not a valid device')
        const file = await this.drive.getFileHandle('firmware.uf2', {create: true});
        // @ts-ignore
        const writable = await file.createWritable();
        await writable.write({type: 'write', data: this.firmware, position: 0});
        await writable.close();
    }

    async runCode(code: string) {
        await this.canPythonCodeRun(false)
        if (this.port === null)
            throw new Error('Not connected')
        const writer = this.port.writable.getWriter();
        await sendCommand(writer, code);
        writer.releaseLock();
        await this.canPythonCodeRun(true);
    }

    async installStandardLibraries() {
        await this.canPythonCodeRun(false)
        this.packageManager.port = this.port;
        await this.packageManager.flashLibrary('github:leaphy-robotics/leaphy-micropython/package.json');
    }

    /**
     * Run a command that interacts with the filesystem of the pico
     * @param command The command to execute: ['ls', 'get', 'put', 'rm', 'rmdir']
     * @param args The args for the command
     */
    async runFileSystemCommand(command: string, ...args: string[]) {
        await this.canPythonCodeRun(false)
        if (this.port === null)
            throw new Error('Not connected')
        const writer = this.port.writable.getWriter();
        const reader = this.port.readable.getReader();
        let response: any;
        if (command === 'ls') {
            response = await ls(writer, reader, args[0]);
        } else if (command === 'get') {
            response = await get(writer, reader, args[0]);
        } else if (command === 'put') {
            response = await put(writer, reader, args[0], args[1]);
        } else if (command === 'rm') {
            response = await rm(writer, reader, args[0]);
        } else if (command === 'rmdir') {
            response = await rmdir(writer, reader, args[0], true);
        } else {
            writer.releaseLock();
            reader.releaseLock();
            throw new Error('Unknown command');
        }
        writer.releaseLock();
        reader.releaseLock();
        return response;
    }

    /**
     * Check if filesystem is a eligible
     * @param filesystem The filesystem directory handle to use
     */
    static async checkFilesystem(filesystem: FileSystemDirectoryHandle) {
        try {
            await filesystem.getFileHandle('INDEX.HTM');
            await filesystem.getFileHandle('INFO_UF2.TXT');
        } catch (error) {
            return false;
        }
        return true
    }
}
