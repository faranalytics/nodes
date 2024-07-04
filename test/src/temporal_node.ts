/* eslint-disable @typescript-eslint/no-explicit-any */
import * as stream from 'node:stream';
import { $write, Node } from '@farar/nodes';

export interface TemporalNodeOptions {
    time?: number;
}

export class TemporalNode extends Node<any, any> {

    constructor({ time = 1e3 }: TemporalNodeOptions = {}) {
        super(new stream.Transform({
            writableObjectMode: true,
            readableObjectMode: true,
            transform: async (chunk: string, encoding: BufferEncoding, callback: stream.TransformCallback) => {
                await new Promise((r) => setTimeout(r, time));
                callback(null, chunk);
            }
        })
        );
    }

    async write(data: any): Promise<void> {
        await super[$write](data);
    }
}