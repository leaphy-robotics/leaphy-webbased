import BaseProtocol from "../base";
import base64 from "base64-js";
import PicoTool from "@leaphy-robotics/picotool-wasm";
import { delay } from "../../utils";

const pico = new PicoTool("/picotool/");

export default class Pico extends BaseProtocol {
    async upload(response: Record<string, string>) {
        await this.port.close();
        await this.port.open({ baudRate: 1200 });
        await this.port.close();
        await delay(1000);
        await this.uploadState.requestUSBDevice();

        const sketch = base64.toByteArray(response["sketch"]);
        await pico.flash(sketch);
        await delay(1000);

        const port = await this.waitForPort();
        await port.open({ baudRate: 115200 });
        this.robotWiredState.setSerialPort(port);
        this.uploader.setPort(port);

        this.uploadState.setStatusMessage("UPDATE_COMPLETE");
    }
}
