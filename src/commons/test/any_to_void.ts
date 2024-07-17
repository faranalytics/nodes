import * as stream from 'node:stream';
import Config from '../../config.js';
import { Node } from '../../node.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class AnyToVoid<InT = any> extends Node<InT, never> {

    public writableCount: number;

    constructor(streamOptions?: stream.WritableOptions) {
        super(new stream.Writable({
            ...streamOptions,
            objectMode: true,
            write(chunk: InT, encoding: BufferEncoding, callback: (error?: Error | null | undefined) => void) {
                try {
                    callback();
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