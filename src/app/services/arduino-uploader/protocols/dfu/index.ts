import BaseProtocol from "../base";
import { DeviceBootstrapper } from "dfu-next";
import base64 from 'base64-js'
import {delay} from "../../utils";

export default class DFU extends BaseProtocol {
    public usbPort: USBDevice

    async upload(response: Record<string, string>) {
        this.usbPort = await this.uploadState.requestUSBDevice()
        await this.port.close()

        const bootstrapper = new DeviceBootstrapper(this.usbPort)
        // @ts-ignore
        console.log(bootstrapper.interface.interfaceNumber)
        const device = await bootstrapper.init()
        // @ts-ignore
        console.log(device.interface.interfaceNumber)

        const writeEvents = device.beginWrite(base64.toByteArray(response["sketch"]))
        writeEvents.on('write/progress', (bytesSent, expectedSize) => {
            this.uploadState.setProgress(50 + (bytesSent / expectedSize) * 100)
        })

        return new Promise<void>(resolve => {
            writeEvents.on('end', async () => {
                await device.clearState()
                await this.usbPort.reset()
                await this.usbPort.close()
                await delay(1000)

                const [port] = await navigator.serial.getPorts()
                this.robotWiredState.setSerialPort(port)

                this.port = port
                await this.port.open({ baudRate: 115200 })
                await this.reset(115200)

                console.log(this.port)

                resolve()
            })
        })
    }
}
