/* eslint-disable @typescript-eslint/no-explicit-any */
import * as stream from 'node:stream';
import { $write, Node } from '../node.js';

export interface AnyTemporalToAnyOptions {
    time?: number;
}

export class AnyTemporalToAny<InT = any, OutT = any> extends Node<InT, OutT> {

    constructor({ time = 1e3 }: AnyTemporalToAnyOptions) {
        super(new stream.Transform({
            writableObjectMode: true,
            readableObjectMode: true,
            transform: async (chunk: string, encoding: BufferEncoding, callback: stream.TransformCallback) => {
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
    }

    async write(data: InT): Promise<void> {
        await super[$write](data);
    }
}