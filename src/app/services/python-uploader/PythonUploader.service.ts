import {RobotWiredState} from "../../state/robot.wired.state";
import {sendCommand, exitReplMode, enterReplMode} from "./repl/BoardCommunication";
import { put, get, ls } from "./filesystem/FileSystem";
import {Injectable, InjectionToken} from "@angular/core";

const SERIAL_OPTIONS = new InjectionToken<{baudRate: number}>('serialOptions');


@Injectable({
    providedIn: 'root'
})
export class PythonUploaderService {
    drive: FileSystemDirectoryHandle = null
    port: SerialPort = null
    private firmware: Blob = null

    constructor(private robotWiredState: RobotWiredState) {
        this.robotWiredState = robotWiredState
        fetch('https://raw.githubusercontent.com/leaphy-robotics/leaphy-micropython/firmware/firmware.uf2').then((response) => {
            response.blob().then((blob) => {
                this.firmware = blob;
            });
        });
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
        await enterReplMode(writer, reader);
        writer.releaseLock();
        reader.releaseLock();
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

    async getStandardLibraries() {
        // Get the package.json file
        const response = await fetch('https://raw.githubusercontent.com/leaphy-robotics/leaphy-micropython/HEAD/package.json');
        const json = await response.json();
        const urls = json['urls'];
        const version = json['version'];
        return {urls, version};
    }

    async getInstalledVersion() {

    }

    async installStandardLibraries() {
        if (this.port === null)
            throw new Error('Not connected')

        const writer = this.port.writable.getWriter();
        const reader = this.port.readable.getReader();
        await enterReplMode(writer, reader);
        await put(writer, reader, 'main.py', 'import leaphy')
    }

    async runFileSystemCommand(command: string, ...args: string[]) {
        if (this.port === null)
            throw new Error('Not connected')
        const writer = this.port.writable.getWriter();
        const reader = this.port.readable.getReader();
        let response;
        if (command === 'ls') {
            response = await ls(writer, reader, args[0]);
        } else if (command === 'get') {
            response = await get(writer, reader, args[0]);
        }  else if (command === 'put') {
            response = await put(writer, reader, args[0], args[1]);
        } else {
            writer.releaseLock();
            reader.releaseLock();
            throw new Error('Unknown command');
        }
        writer.releaseLock();
        reader.releaseLock();
        return response;
    }

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
