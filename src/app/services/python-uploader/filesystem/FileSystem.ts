import {readResponse, sendCommand, enterReplMode, exitReplMode} from "../comms/BoardCommunication";

async function dirExists(writer: WritableStreamDefaultWriter, reader: ReadableStreamDefaultReader, path: string) {
    const dirExistsCommand = `import os; print(os.stat("${path}")[0] & 0x4000 != 0)`;
    await sendCommand(writer, dirExistsCommand);
    const { stdOut, stdErr, failed } = await readResponse(reader);
    if (failed) {
        if (stdErr.includes('OSError: [Errno 2] ENOENT')) {
            return false;
        }
        throw new Error(stdErr);
    }
    return stdOut.includes('True')
}

async function exists(writer: WritableStreamDefaultWriter, reader: ReadableStreamDefaultReader, path: string) {
    const existsCommand = `import os; print(os.stat("${path}")[0] & 0x8000 != 0)`;
    await sendCommand(writer, existsCommand);
    const { stdOut, stdErr, failed } = await readResponse(reader);
    if (failed) {
        if (stdErr.includes('OSError: [Errno 2] ENOENT')) {
            return false;
        }
        throw new Error(stdErr);
    }
    return stdOut.includes('True')
}

async function put(writer: WritableStreamDefaultWriter, reader: ReadableStreamDefaultReader, filename: string, content: string) {
    console.log("putting file: " + filename);
    if (filename.endsWith('.py') || filename.endsWith('.py/')) {
        // make a post request with the content in base64 to minify the code, https://webservice.leaphyeasybloqs.com/compile/cpp' then write the returned base64 to the file
        const response = await fetch('https://webservice.leaphyeasybloqs.com/minify/python', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({source_code: btoa(content), filename: filename}),
        });
        const json = await response.json();
        content = atob(json['source_code']);
    }
    // make sure the dir above exists and above that
    let dirs = filename.split('/');
    for (let i = 0; i < dirs.length - 1; i++) {
        const dir = dirs.slice(0, i + 1).join('/');
        if (!await dirExists(writer, reader, dir)) {
            await mkdir(writer, reader, dir);
        }
    }
    content = btoa(content);
    const writeCommand = `import binascii; f = open("${filename}", "w"); f.write(binascii.a2b_base64("${content}")); f.close()`;
    await sendCommand(writer, writeCommand);
    const { stdOut, stdErr, failed } = await readResponse(reader);
    if (failed) {
        throw new Error(stdErr);
    }
}

async function get(writer: WritableStreamDefaultWriter, reader: ReadableStreamDefaultReader, filename: string) {
    const readCommand = `
import sys
with open('${filename}', 'rb') as infile:
    while True:
        result = infile.read(32)
        if result == b'':
            break
        len = sys.stdout.write(result)`;

    await sendCommand(writer, readCommand);
    const { stdOut, stdErr, failed } = await readResponse(reader);
    if (failed) {
        throw new Error(stdErr);
    }
    return stdOut;
}

async function mkdir(writer: WritableStreamDefaultWriter, reader: ReadableStreamDefaultReader, path: string) {
    const mkdirCommand = `import os; os.mkdir("${path}")`;
    await sendCommand(writer, mkdirCommand);
    const { stdOut, stdErr, failed } = await readResponse(reader);
    if (failed) {
        throw new Error(stdErr);
    }
}

async function ls(writer: WritableStreamDefaultWriter, reader: ReadableStreamDefaultReader, path: string): Promise<{name: string, isDir: boolean}[]> {
    const lsCommand = `import os
import json
def ls(path):
    if path[-1] == '/':
        path = path[:-1]
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
    const { stdOut, stdErr, failed } = await readResponse(reader);
    if (failed) {
        throw new Error(stdErr);
    }
    console.log(stdOut);
    return JSON.parse(stdOut);
}

async function rm(writer: WritableStreamDefaultWriter, reader: ReadableStreamDefaultReader, path: string) {
    if (!await exists(writer, reader, path)) {
        return;
    }
    const rmCommand = `import os; os.remove("${path}")`;
    await sendCommand(writer, rmCommand);
    const { stdOut, stdErr, failed } = await readResponse(reader);
    if (failed) {
        throw new Error(stdErr);
    }
}

async function rmdir(writer: WritableStreamDefaultWriter, reader: ReadableStreamDefaultReader, path: string, recursive: boolean = false) {
    // if it is recursive then delete all the files in the folder first
    if (recursive) {
        const dirContent = await ls(writer, reader, path);
        for (const file of dirContent) {
            if (file['isDir']) {
                await rmdir(writer, reader, path + '/' + file['name'], true);
            } else {
                await rm(writer, reader, path + '/' + file['name']);
            }
        }
    }
    if (!await dirExists(writer, reader, path)) {
        return;
    }
    const rmdirCommand = `import os; os.rmdir("${path}")`;
    await sendCommand(writer, rmdirCommand);
    const { stdOut, stdErr, failed } = await readResponse(reader);
    if (failed) {
        throw new Error(stdErr);
    }
}

export { dirExists, exists, put, rm, rmdir, get, ls, mkdir,  }
