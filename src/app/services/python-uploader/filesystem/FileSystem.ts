import {readResponse, sendCommand, enterReplMode, exitReplMode} from "../repl/BoardCommunication";

const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8");

async function put(writer: WritableStreamDefaultWriter, reader: ReadableStreamDefaultReader, filename: string, content: string) {
    const writeCommand = `import os; f = open("${filename}", "w"); f.write("""${content}"""); f.close()`;
    await sendCommand(writer, writeCommand);
}

async function get(writer: WritableStreamDefaultWriter, reader: ReadableStreamDefaultReader, filename: string) {
    const readCommand = `f = open("${filename}", "r"); print(f.read()); f.close()`;
    await sendCommand(writer, readCommand);
    return await readResponse(reader);
}

async function ls(writer: WritableStreamDefaultWriter, reader: ReadableStreamDefaultReader, path: string) {
    const lsCommand = `import os
import json
def ls(path):
    if path[-1] != '/':
        path += '/'
    dirContent = []
    for entry in os.listdir(path):
        stat = os.stat(path + entry)
        if (stat[0] & 0x4000) != 0:
            dirContent.append({'name': entry, 'isDir': True})
        elif (stat[0] & 0x8000) != 0:
            dirContent.append({'name': entry, 'isDir': False})
    return json.dumps(dirContent)
print(ls("${path}"))`;
    await sendCommand(writer, lsCommand);
    let response = await readResponse(reader);
    return JSON.parse(response);
}

export { put, get, ls }
