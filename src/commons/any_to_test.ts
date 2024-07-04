/* eslint-disable @typescript-eslint/no-explicit-any */
import * as s from 'node:stream';
import { $write, Node } from '../node.js';

export interface AnyToTestOptions<T> {
    suite: (chunk: T, encoding: BufferEncoding, callback: (error?: Error | null | undefined) => void) => Promise<void>;
}

export class AnyToTest<InT> extends Node<InT, never> {

    constructor({ suite }: AnyToTestOptions<InT>, options?: s.WritableOptions) {
        super(new s.Writable({
            ...options, ...{
                objectMode: true,
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                write: async (chunk: InT, encoding: BufferEncoding, callback: (error?: Error | null | undefined) => void) => {
                    await suite(chunk, encoding, callback);
                }
            }
        }));
    }

    async write(data: any): Promise<void> {
        await super[$write](data);
    }
}