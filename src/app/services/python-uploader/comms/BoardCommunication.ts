
const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8");

const REPL = 0x01;
const EOF = 0x04;
const RAW_END_OF_RESPONSE= 62;

async function enterReplMode(writer: WritableStreamDefaultWriter, reader: ReadableStreamDefaultReader<Uint8Array>) {
    const enterReplMode = new Uint8Array([REPL]);
    await writer.write(enterReplMode);
    await readResponse(reader);
}

async function sendCommand(writer: WritableStreamDefaultWriter, command: string) {
    const commandBytes = new Uint8Array([...encoder.encode(command), EOF]);
    const chunkSize = 256;
    for (let i = 0; i < commandBytes.length; i += chunkSize) {
        const chunk = commandBytes.slice(i, i + chunkSize);
        await writer.write(chunk);
    }
}

async function readResponse(reader: ReadableStreamDefaultReader<Uint8Array>, timeoutMs: number = 1000) {
    let fullReadResponse = new Uint8Array();
    let stdOut = "";
    let stdErr = "";
    while (true) {
        const readResponse = await reader.read();
        fullReadResponse = new Uint8Array([...fullReadResponse, ...readResponse.value]);
        if (fullReadResponse[fullReadResponse.length - 1] === RAW_END_OF_RESPONSE) {
            fullReadResponse = fullReadResponse.slice(0, fullReadResponse.length - 1);
            stdOut = decoder.decode(fullReadResponse.slice(0, fullReadResponse.indexOf(EOF)));
            stdErr = decoder.decode(fullReadResponse.slice(fullReadResponse.indexOf(EOF), fullReadResponse.lastIndexOf(EOF) - 1));
            break;
        }
    }
    let failed = stdErr.length > 0;
    if (!stdOut.includes("OK")) {
        failed = true;
        stdErr = "Compile error occured: " + stdErr
    } else {
        stdOut = stdOut.slice(2)
    }
    return {stdOut, stdErr, failed};
}

export { enterReplMode, sendCommand, readResponse }
