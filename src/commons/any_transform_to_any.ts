/* eslint-disable @typescript-eslint/no-explicit-any */
import * as stream from 'node:stream';
import { $write, Node, $ins, $outs } from '../index.js';

export interface AnyTransformToAnyOptions {
    transform: (chunk: any) => Promise<any> | any;
}

export class AnyTransformToAny extends Node<any, any> {

    public transform: (chunk: any) => Promise<any> | any;

    constructor(options: AnyTransformToAnyOptions) {
        super(new stream.Transform({
            writableObjectMode: true,
            readableObjectMode: true,
            transform: async (chunk: any, encoding: BufferEncoding, callback: stream.TransformCallback) => {
                try {
                    chunk = await this.transform(chunk);
                }
                catch (err) {
                    if (err instanceof Error) {
                        callback(err);
                    }
                }
                callback(null, chunk);
            }
        })
        );

        this.transform = options.transform;
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