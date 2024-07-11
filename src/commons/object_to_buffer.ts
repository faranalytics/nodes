import * as stream from 'node:stream';
import { $write, Node, $ins, $outs } from '../node.js';

export interface ObjectToBufferOptions {
    replacer?: (this: unknown, key: string, value: unknown) => unknown;
    space?: string | number;
}

export class ObjectToBuffer<InT extends object> extends Node<InT, Buffer> {

    public egressQueue: Buffer;
    public replacer?: (this: unknown, key: string, value: unknown) => unknown;
    public space?: string | number;

    constructor({ replacer, space }: ObjectToBufferOptions = {}, options?: stream.TransformOptions) {
        super(new stream.Transform({
            ...options, ...{
                writableObjectMode: true,
                readableObjectMode: false,
                transform: async (chunk: InT, _encoding: BufferEncoding, callback: stream.TransformCallback) => {
                    try{
                        const data = this.serializeMessage(chunk);
                        const size = Buffer.alloc(6, 0);
                        size.writeUIntBE(data.length + 6, 0, 6);
                        const buf = Buffer.concat([size, data]);
                        callback(null, buf);
                    }
                    catch (err) {
                        if (err instanceof Error) {
                            callback(err);
                        }
                    }
                }
            }
        }));

        this.egressQueue = Buffer.allocUnsafe(0);
        this.replacer = replacer;
        this.space = space;
    }

    async write(data: InT): Promise<void> {
        await super[$write](data);
    }

    protected serializeMessage(message: InT): Buffer {
        return Buffer.from(JSON.stringify(message, this.replacer, this.space), 'utf-8');
    }
    get ins() {
        return this[$ins];
    }

    get outs() {
        return this[$outs];
    }
}