/* eslint-disable @typescript-eslint/no-explicit-any */
import * as stream from 'node:stream';
import { $write, Node } from '../node.js';

export class ConsoleHandler extends Node<any, never> {

    constructor(options?: stream.WritableOptions) {
        super(new stream.Writable({
            ...options, ...{
                objectMode: true,
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                write: async (chunk: unknown, encoding: BufferEncoding, callback: (error?: Error | null | undefined) => void) => {
                    console.log(chunk);
                    callback();
                }
            }
        }));
    }

    async write(data: any): Promise<void> {
        await super[$write](data);
    }
}