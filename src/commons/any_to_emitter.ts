/* eslint-disable @typescript-eslint/no-explicit-any */
import * as stream from 'node:stream';
import * as events from 'node:events';
import { $stream, $write, Node, $ins, $outs } from '../index.js';

export class AnyToEmitter<InT> extends Node<InT, never> {

    public emitter: events.EventEmitter;

    constructor(options?: stream.WritableOptions) {
        super(new stream.Writable({
            ...options, ...{
                objectMode: true,
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                write: async (chunk: InT, encoding: BufferEncoding, callback: (error?: Error | null | undefined) => void) => {
                    try {
                        this.emitter.emit('data', chunk);
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