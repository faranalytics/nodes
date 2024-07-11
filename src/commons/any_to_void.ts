/* eslint-disable @typescript-eslint/no-explicit-any */
import * as stream from 'node:stream';
import { Node, $ins, $outs } from '../index.js';


export class AnyToVoid extends Node<any, never> {

    constructor() {
        super(new stream.Writable({
            objectMode: true,
            write(chunk: any, encoding: BufferEncoding, callback: (error?: Error | null | undefined) => void) {
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
    }

    get ins() {
        return this[$ins];
    }

    get outs() {
        return this[$outs];
    }
}