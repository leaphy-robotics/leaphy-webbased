import BaseProtocol from "../base";


export default class Avrdude extends BaseProtocol {

    async upload(response: Record<string, string>) {
        throw new Error("Not implemented")
    }
}
