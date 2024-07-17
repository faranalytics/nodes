import * as stream from 'node:stream';
import Config from '../../config.js';
import { Node } from '../../node.js';


export interface AnyTemporalToAnyOptions {
    time?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class AnyTemporalToAny<InT = any, OutT = any> extends Node<InT, OutT> {

    public writableCount: number;

    constructor({ time = 1e3 }: AnyTemporalToAnyOptions, streamOptions?: stream.TransformOptions) {
        super(new stream.Transform({
            ...streamOptions,
            writableObjectMode: true,
            readableObjectMode: true,
            transform: async (chunk: InT, encoding: BufferEncoding, callback: stream.TransformCallback) => {
                try {
                    await new Promise((r) => setTimeout(r, time));
                    callback(null, chunk);
                }
                catch (err) {
                    if (err instanceof Error) {
                        callback(err);
                    }
                }
            }
        })
        );
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