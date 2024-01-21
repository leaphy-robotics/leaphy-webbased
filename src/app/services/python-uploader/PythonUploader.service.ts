import {RobotWiredState} from "../../state/robot.wired.state";
import {sendCommand, enterReplMode, readResponse} from "./comms/BoardCommunication";
import {put, get, ls, rm, rmdir} from "./filesystem/FileSystem";
import {Injectable} from "@angular/core";
import {PackageManager} from "./mip/PackageManager";
import {DialogState} from "../../state/dialog.state";

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


    private async setPythonCodeRunning(isRunning: boolean) {
        if (this.robotWiredState.getPythonCodeRunning() === isRunning && isRunning) {
            throw new Error('There is already a program running')
        }

        if (!isRunning) {
            this.robotWiredState.setPythonSerialMonitorListening(false);
        }
        this.robotWiredState.setPythonCodeRunning(isRunning);
    }

    async sendKeyboardInterrupt() {
        this.robotWiredState.addToUploadLog('Sending keyboard interrupt');
        if (this.port === null)
            throw new Error('Not connected')
        const writer = this.port.writable.getWriter();
        await sendCommand(writer, '\u0003');
        const reader = this.port.readable.getReader();
        await readResponse(reader);
        reader.releaseLock()
        writer.releaseLock()
        this.robotWiredState.addToUploadLog('Keyboard interrupt sent');
    }

    async connect() {
        await this.setPythonCodeRunning(false);
        this.robotWiredState.addToUploadLog('Connecting to device');
        let port: SerialPort;
        try {
            port = await navigator.serial.requestPort({filters: [{usbVendorId: 11914}]});
        } catch (error) {
            console.log(error)
            throw new Error('No device selected')
        }
        try {
            await port.open({baudRate: 115200});
        } catch (error) {
            if (error.toString().includes('The port is already open.')) {
                // wait for abortController to be set to null
                await this.sendKeyboardInterrupt();
            }
            else {
                console.log(error)
                throw new Error('Connecting to device')
            }
        }
        await this.setPythonCodeRunning(true)
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
        try {
            await this.setPythonCodeRunning(false);
        } catch (error) {}
        this.robotWiredState.addToUploadLog('Connected to device');
    }

    async connectInBootMode() {
        this.robotWiredState.addToUploadLog('Connecting to device in boot mode');
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
        this.robotWiredState.addToUploadLog('Connected to device in boot mode');
    }

    async flash() {
        this.robotWiredState.addToUploadLog('Flashing firmware');
        if (!(await PythonUploaderService.checkFilesystem(this.drive)))
            throw new Error('Not a valid device')
        const file = await this.drive.getFileHandle('firmware.uf2', {create: true});
        // @ts-ignore
        const writable = await file.createWritable();
        await writable.write({type: 'write', data: this.firmware, position: 0});
        await writable.close();
        this.robotWiredState.addToUploadLog('Firmware flashed');
    }

    async runCode(code: string) {
        this.robotWiredState.addToUploadLog('Running code');
        await this.setPythonCodeRunning(true)
        this.robotWiredState.setPythonSerialMonitorListening(true);
        if (this.port === null)
            throw new Error('Not connected')
        const writer = this.port.writable.getWriter();
        await sendCommand(writer, code);
        writer.releaseLock();
        this.robotWiredState.addToUploadLog('Code running');
    }

    /**
     * Install the standard library from leaphy
     */
    async installStandardLibraries() {
        await this.setPythonCodeRunning(true)
        this.packageManager.port = this.port;
        this.robotWiredState.addToUploadLog('Installing standard libraries');
        await this.packageManager.flashLibrary('github:leaphy-robotics/leaphy-micropython/package.json');
        this.robotWiredState.addToUploadLog('Standard libraries installed');
        await this.setPythonCodeRunning(false);
    }

    /**
     * Run a command that interacts with the filesystem of the pico
     * @param command The command to execute: ['ls', 'get', 'put', 'rm', 'rmdir']
     * @param args The args for the command
     */
    async runFileSystemCommand(command: string, ...args: string[]) {
        await this.setPythonCodeRunning(true)
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
        await this.setPythonCodeRunning(false);
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
