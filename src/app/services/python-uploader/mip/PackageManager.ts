import {get, ls, mkdir, put, rm, rmdir} from "../filesystem/FileSystem";
import {environment} from "src/environments/environment";
import {LeaphyPort} from "../../../state/robot.wired.state";


export class PackageManager {

    private serialPort: LeaphyPort;

    constructor() {}

    set port(port: LeaphyPort) {
        this.serialPort = port;
    }

    get port(): LeaphyPort {
        return this.serialPort;
    }

    public static async fetchMipUrl(url: string) {
        if (!url) {
            throw new Error('No url provided');
        } else if (url.startsWith('github:')) {
            const data = url.split('/')
            // everything after the second slash is the file
            const file = data.slice(2).join('/');
            const repo = data[0].split(':')[1] + '/' + data[1];
            url = 'https://raw.githubusercontent.com/' + repo + '/master/' + file;

            const response = await fetch(url);
            return await response.text();
        } else {
            throw new Error('Not implemented');
        }
    }

    public static getLibraryName(url: string) {
        if (!url) {
            throw new Error('No url provided');
        } else if (url.startsWith('github:')) {
            const data = url.split('/', 3)
            return data[1];
        } else {
            throw new Error('Not implemented');
        }
    }

    public async flashLibrary(url: string) {
        if (!this.serialPort) {
            throw new Error('No device selected');
        }

        if (!url) {
            throw new Error('No url provided');
        } else if (url.startsWith('github:')) {
            let writer = this.serialPort.writable.getWriter();
            let reader = this.serialPort.readable.getReader();
            try {
                await mkdir(writer, reader, '/lib');
            } catch (error) {}
            writer.releaseLock();
            reader.releaseLock();
            let json = JSON.parse(await PackageManager.fetchMipUrl(url));
            const version = json['version'];
            if (await this.checkLibraryVersion(version, PackageManager.getLibraryName(url))) {
                return;
            }
            const files = json['urls'];
            let content = [];

            for (const file of files) {
                const response = await PackageManager.fetchMipUrl(file[1]);
                content.push({name: '/lib/' + file[0], content: response});
            }

            writer = this.serialPort.writable.getWriter();
            reader = this.serialPort.readable.getReader();
            // get a list of .dist-info files in the lib folder and delete them
            const response = await ls(writer, reader, '/lib');
            // get a list of all the .dist-info folders
            for (const file of response) {
                if (file['name'].endsWith('.dist-info')) {
                    await rmdir(writer, reader, '/lib/' + file['name'], true);
                }
            }

            for (const file of content) {
                const filename = file['name'];
                let content = file['content'];
                await rm(writer, reader, filename);
                if (filename.endsWith('.py') || filename.endsWith('.py/')) {
                    // make a post request with the content in base64 to minify the code, https://webservice.leaphyeasybloqs.com/compile/cpp' then write the returned base64 to the file
                    const response = await fetch(`${environment.backend}/minify/python`, {
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
                await put(writer, reader, filename, content)
            }
            await rm(writer, reader, '/lib/' + PackageManager.getLibraryName(url) + '.json');
            json = {version: version}
            await put(writer, reader,PackageManager.getLibraryName(url) + '.json', btoa(JSON.stringify(json)));
            writer.releaseLock();
            reader.releaseLock();
        } else {
            throw new Error('Not implemented');
        }
    }

    public async checkLibraryVersion(version: string, name: string) {
        if (!this.serialPort) {
            throw new Error('No device selected');
        }

        if (!version) {
            throw new Error('No version provided');
        }

        if (!name) {
            throw new Error('No name provided');
        }

        const writer = this.serialPort.writable.getWriter();
        const reader = this.serialPort.readable.getReader();

        const tries = 3;
        for (let i = 0; i < tries; i++) {
            try {
                const response = await get(writer, reader, name + '.json');

                // decode response
                const json = JSON.parse(atob(response));
                writer.releaseLock();
                reader.releaseLock();
                return json['version'] === version;
            } catch (error) {}
        }
        writer.releaseLock();
        reader.releaseLock();
        return false;
    }
}
