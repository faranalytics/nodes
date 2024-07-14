/* eslint-disable @typescript-eslint/no-explicit-any */
import * as stream from 'node:stream';
import * as events from 'node:events';
import { $stream, $write, Node, $ins, $outs } from '../node.js';

export class AnyToAnyEmitter<InT = any, OutT = any> extends Node<InT, OutT> {

    public emitter: events.EventEmitter;

    constructor(options?: stream.TransformOptions) {
        super(new stream.Transform({
            ...options, ...{
                objectMode: true,
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                transform: async (chunk: InT, encoding: BufferEncoding, callback: stream.TransformCallback) => {
                    try {
                        this.emitter.emit('data', chunk);
                        callback(null, chunk);
                    }
                    catch (err) {
                        if (err instanceof Error) {
                            callback(err);
                        }
                    }
                }
            }
        }));

        this.emitter = new events.EventEmitter();
        this[$stream].once('error', this.emitter.emit);
    }

    async write(data: any): Promise<void> {
        await super[$write](data);
    }

    get ins() {
        return this[$ins];
    }

    get outs() {
        return this[$outs];
    }
}