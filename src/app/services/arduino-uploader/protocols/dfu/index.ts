import BaseProtocol from "../base";
import base64 from "base64-js";
import DFUUtil from "@leaphy-robotics/dfu-util-wasm";
import { delay } from "../../utils";

const dfu = new DFUUtil("/dfu-util/");

export default class DFU extends BaseProtocol {
    async upload(response: Record<string, string>) {
        await this.port.close();
        await delay(1000);
        await this.uploadState.requestUSBDevice();

        const sketch = base64.toByteArray(response["sketch"]);
        await dfu.flash(sketch);
        await delay(1000);

        const port = await this.waitForPort();
        await port.open({ baudRate: 115200 });
        this.robotWiredState.setSerialPort(port);
        this.uploader.setPort(port);

        this.uploadState.setStatusMessage("UPDATE_COMPLETE");
    }
}
