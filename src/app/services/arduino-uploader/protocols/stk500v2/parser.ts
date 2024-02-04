import constants from './constants'

class ParserError extends Error {
    constructor(public code: string, message: string) {
        super(message)
    }
}

export function concat(buffers: Uint8Array[]) {
    const length = buffers.reduce((value, current) => value + current.length, 0)
    const buffer = new Uint8Array(length)

    let pos = 0
    buffers.forEach(temp => {
        buffer.set(temp, pos)
        pos += temp.length
    })

    return buffer
}

type Current = false | {
    timeout: false|NodeJS.Timeout,
    seq: number,
    cb: (err: ParserError|false, pkt?: any) => void
}

type PKT = false | {
    seq: number,
    len: number[]|number,
    raw: number[],
    message: number[]|Uint8Array,
    checksum: number|boolean,
    error?: ParserError
}

export default class Parser extends EventTarget {
    private boundOpen = false
    private closed = false
    // write
    private inc = -1
    private queue = []
    private current: Current = false
    // parser
    private state = 0
    private pkt: PKT = false

    public writer: WritableStreamDefaultWriter<Uint8Array>
    public reader: ReadableStreamDefaultReader<Uint8Array>

    constructor(private port: SerialPort) {
        super()

        this.writer = port.writable.getWriter()
        this.reader = port.readable.getReader()
        this.listen().then()
    }

    async listen() {
        try {
            while (true) {
                const {value, done} = await this.reader.read()
                if (done) {
                    console.log('done')
                    return this.cleanup()
                }

                this.dataHandler(value)
            }
        } catch (e) {
            console.log(e)
            return this.cleanup(e)
        }
    }

    async send(body: Uint8Array, cb: (err: ParserError|false, pkt?: any) => void) {
        if (this.closed) {
            throw new Error("This parser is closed!")
        }

        const timeout = this.commandTimeout(body[0])

        const msgLenBuffer = new ArrayBuffer(2)
        const msgLenView = new DataView(msgLenBuffer)
        msgLenView.setUint16(0, body.length, false)

        const msgLen = new Uint8Array(msgLenBuffer)

        const out = concat([
            new Uint8Array([constants.MESSAGE_START, this.seq(), msgLen[0], msgLen[1], constants.TOKEN]),
            body
        ])
        const checksum = this.checksum(out)

        this.queue.push({
            buf: concat([out, new Uint8Array([checksum])]),
            seq: this.inc, cb,
            timeout
        })
        this._send().then()
    }

    _pkt(): PKT {
        return {
            seq: -1,
            len: [],
            raw: [],
            message: [],
            checksum: 0,
        }
    }

    stateMachine(curByte: number) {
        let pkt = this.pkt
        switch (this.state) {
            case 0: {
                pkt = this.pkt = this._pkt()

                if (curByte !== 0x1b) {
                    return this.emit('log',"Invalid header byte expected 27 got: " + curByte);
                }
                ++this.state
                break
            }
            case 1: {
                if (!this.current || !pkt) break
                if (curByte !== this.current.seq) {
                    this.state = 0
                    return this.emit('log',"Invalid sequence number. back to start. got: " + curByte);
                }
                pkt.seq = curByte
                ++this.state
                break
            }
            case 2: {
                if (!pkt || !(pkt.len instanceof Array)) break
                pkt.len.push(curByte)
                ++this.state
                break
            }
            case 3: {
                if (!pkt || !(pkt.len instanceof Array)) break
                pkt.len.push(curByte)
                pkt.len = (pkt.len[0] << 8) | pkt.len[1]
                ++this.state
                break
            }
            case 4: {
                if (!pkt) break
                if (curByte !== 0x0e) {
                    this.state = 0
                    pkt.error = new ParserError("E_PARSE", "Invalid message token byte. got: " + curByte);
                    return this.emit("log", (this.pkt||{}).error)
                }
                ++this.state
                if (!pkt.len) ++this.state

                break;
            }
            case 5: {
                if (!pkt) break
                if (pkt.len === 0 && curByte === constants.STATUS_CKSUM_ERROR) {
                    pkt.error = new ParserError("E_STATUS_CKSUM", "send checksum error")
                }

                (pkt.message as number[]).push(curByte)
                if (--(pkt.len as number) == 0) ++this.state
                break
            }
            case 6: {
                if (!pkt) break

                pkt.checksum = this.checksum(new Uint8Array(pkt.raw))
                pkt.checksum = (pkt.checksum === curByte);
                if(!pkt.checksum){
                    pkt.error = new ParserError("E_RECV_CKSUM", "recv cecksum didn't match");
                }

                pkt.message = new Uint8Array(pkt.message)
                this.emit('data', pkt)
                this.state++
                pkt.len = pkt.message.length
                delete pkt.raw
                this.resolveCurrent(pkt.error?pkt.error:false, pkt)
                break
            }
        }

        if (pkt && pkt.raw) pkt.raw.push(curByte)
    }

    dataHandler(data: Uint8Array) {
        const current = this.current
        this.emit('raw', data)
        if (!current) return this.emit('log', 'droping data')

        data.forEach(byte => {
            this.stateMachine(byte)
        })
    }

    commandTimeout(typeByte: number) {
        let timeout = 1000
        if (typeByte === constants.CMD_SIGN_ON) timeout = 200
        else {
            const type = Object.keys(constants).find(type => constants[type] === typeByte)
            const match = ["CMD_READ", "PROGRAM_FLASH", "EEPROM"]
            match.forEach(match => {
                if (type.includes(match)) timeout = 5000
            })
        }

        return timeout
    }

    seq() {
        this.inc++
        if (this.inc > 0xff) this.inc = 0

        return this.inc
    }

    checksum(buf: Uint8Array) {
        let checksum = 0
        buf.forEach(byte => {
            checksum ^= byte
        })

        return checksum
    }

    emit(type: string, message?: any) {
        // @ts-ignore
        this.dispatchEvent(new Event(type, { detail: message }))
    }

    async _send() {
        if (this.closed) return false
        if (this.current) return
        if (!this.queue.length) return

        const isOpen = this.port.readable && this.port.writable
        if (!isOpen) {
            if (!this.boundOpen) this.port.addEventListener('connect', () => {
                this._send()
            })
            return
        }

        const message = this.queue.shift()
        const current: Current = this.current = {
            timeout: false,
            seq: message.seq,
            cb: message.cb
        }

        this.state = 0

        await this.writer.write(message.buf)
        if (current !== this.current) return this.emit('log', 'current was no longer the current message after drain callback')
        current.timeout = setTimeout(() => {
            const err = new ParserError('E_TIMEOUT', `stk500 timeout. ${message.timeout}ms`)
            this.resolveCurrent(err)
        }, message.timeout)
        this.emit('rawinput', message.buf)
    }

    resolveCurrent(err: ParserError|false, pkt?: any) {
        const toCall = this.current
        this.current = false

        let q: false|any[] = false
        if (["E_PARSE", "E_TIMEOUT"].includes((err||{}).code) || this.closed) {
            q = this.queue
            this.queue = []
        }

        if (!toCall) return
        if (toCall.timeout) clearTimeout(toCall.timeout)

        toCall.cb(err, pkt)
        if (q) {
            while (q.length) q.shift()(err)
        }

        this._send().then()
    }

    cleanup(err?: ParserError) {
        this.closed = true

        if (!err) err = new ParserError("E_CLOSED", "Serial closed")
        if (this.current) this.resolveCurrent(err)

        this.emit('closed')
    }
}
