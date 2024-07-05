/* eslint-disable @typescript-eslint/no-explicit-any */
import * as stream from 'node:stream';
import { once } from 'node:events';
import { $write, Node } from '../node.js';

export class ConsoleHandler extends Node<any, never> {

    constructor(options?: stream.WritableOptions) {
        super(new stream.Writable({
            ...options, ...{
                objectMode: true,
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                write: async (chunk: unknown, encoding: BufferEncoding, callback: (error?: Error | null | undefined) => void) => {
                    try {
                        if (typeof chunk == 'string' || chunk instanceof Buffer) {
                            if (!process.stdout.write(chunk)) {
                                await once(process.stdout, 'drain');
                            }
                        }
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
    }

    async write(data: any): Promise<void> {
        await super[$write](data);
    }
}