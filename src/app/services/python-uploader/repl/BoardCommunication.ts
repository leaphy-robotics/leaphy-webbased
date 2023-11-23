import {Responses} from "../../arduino-uploader/stk500";

const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8");

const REPL = 0x01;
const LEAVE_REPL = 0x02;
const EOF = 0x04;
const RAW_END_OF_RESPONSE= [0x04, 0x04, 62];

async function enterReplMode(writer: WritableStreamDefaultWriter, reader: ReadableStreamDefaultReader<Uint8Array>) {
    const enterReplMode = new Uint8Array([REPL]);
    await writer.write(enterReplMode);
    const response = await readResponse(reader);
}

async function sendCommand(writer: WritableStreamDefaultWriter, command: string) {
    const commandBytes = new Uint8Array([...encoder.encode(command), EOF]);
    await writer.write(commandBytes);
}

async function readResponse(reader: ReadableStreamDefaultReader<Uint8Array>, timeoutMs: number = 1000) {
    let response = "";
    while (true) {
        const readResponse = await reader.read();
        const decodedResponse = decoder.decode(readResponse.value);
        // get the last 3 bytes of the response
        if (readResponse.value.slice(-3).every((value, index) => value === RAW_END_OF_RESPONSE[index])) {
            readResponse.value = readResponse.value.slice(0, readResponse.value.length - 3);
            response += decoder.decode(readResponse.value);
            break;
        } else if (readResponse.value.slice(-1)[0] === RAW_END_OF_RESPONSE[2]) {
            readResponse.value = readResponse.value.slice(0, readResponse.value.length - 1);
            response += decoder.decode(readResponse.value);
            break;
        }
        response += decodedResponse;
    }
    response = response.slice(2);
    return response;
}

async function exitReplMode(writer: WritableStreamDefaultWriter) {
    const exitReplMode = new Uint8Array([LEAVE_REPL]);
    await writer.write(exitReplMode);
}

export { enterReplMode, sendCommand, readResponse, exitReplMode }
