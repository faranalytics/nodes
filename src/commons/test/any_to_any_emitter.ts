import * as stream from 'node:stream';
import * as events from 'node:events';
import Config from '../../config.js';
import { Node } from '../../node.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class AnyToAnyEmitter<InT = any, OutT = any> extends Node<InT, OutT> {

    public emitter: events.EventEmitter;
    public writableCount: number;
    
    constructor(streamOptions?: stream.TransformOptions) {
        super(new stream.Transform({
            ...streamOptions, ...{
                objectMode: true,
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
        this._stream.once('error', this.emitter.emit);
        this.writableCount = 0;
        this._stream.on('pipe', () => {
            this.writableCount = this.writableCount + 1;
        });
        this._stream.on('unpipe', () => {
            this.writableCount = this.writableCount - 1;
        });
    }

    public write(data: InT, encoding?: BufferEncoding): void {
        super._write(data, encoding).catch((err: Error) => Config.errorHandler(err));
    }
}