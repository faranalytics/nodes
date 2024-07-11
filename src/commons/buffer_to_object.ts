import * as stream from 'node:stream';
import { Node, $write, $stream, $ins, $outs } from '../node.js';

export interface BufferToObjectOptions {
    reviver?: (this: unknown, key: string, value: unknown) => unknown;
}

export class BufferToObject<OutT extends object> extends Node<Buffer, OutT> {

    public ingressQueue: Buffer;
    public messageSize: number | null;
    public reviver?: (this: unknown, key: string, value: unknown) => unknown;

    constructor({ reviver }: BufferToObjectOptions = {}, options?: stream.TransformOptions) {
        super(new stream.Transform({
            ...options, ...{
                writableObjectMode: false,
                readableObjectMode: true,
                transform: async (chunk: Buffer | string, _encoding: BufferEncoding, callback: stream.TransformCallback) => {
                    try {
                        if (!Buffer.isBuffer(chunk)) {
                            chunk = Buffer.from(chunk, 'utf-8');
                        }

                        this.ingressQueue = Buffer.concat([this.ingressQueue, chunk]);

                        if (this.messageSize === null) {
                            this.messageSize = this.ingressQueue.readUintBE(0, 6);
                        }

                        if (this.ingressQueue.length < this.messageSize) {
                            callback();
                            return;
                        }

                        while (this.ingressQueue.length >= this.messageSize) {
                            const buf = this.ingressQueue.subarray(6, this.messageSize);
                            this.ingressQueue = this.ingressQueue.subarray(this.messageSize, this.ingressQueue.length);
                            const message = this.deserializeMessage(buf);

                            if (this[$stream] instanceof stream.Readable) {
                                this[$stream].push(message);
                            }

                            if (this.ingressQueue.length > 6) {
                                this.messageSize = this.ingressQueue.readUintBE(0, 6);
                            }
                            else {
                                this.messageSize = null;
                                break;
                            }
                        }
                        callback();
                    }
                    catch (err) {
                        if (err instanceof Error) {
                            callback(err);
                        }
                    }
                }
            }
        }));

        this.ingressQueue = Buffer.allocUnsafe(0);
        this.messageSize = null;
        this.reviver = reviver;
    }

    async write(data: Buffer): Promise<void> {
        await super[$write](data);
    }

    protected deserializeMessage(data: Buffer): OutT {
        return <OutT>JSON.parse(data.toString('utf-8'), this.reviver);
    }
    get ins() {
        return this[$ins];
    }

    get outs() {
        return this[$outs];
    }
}