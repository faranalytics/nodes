/* eslint-disable @typescript-eslint/no-unused-vars */
import * as stream from 'node:stream';
import { Node } from '@farar/nodes';


class StringToNumber extends Node<string, number> {

    constructor(options: stream.TransformOptions) {
        super(new stream.Transform({
            ...options, ...{
                writableObjectMode: true,
                readableObjectMode: true,
                transform: (chunk: string, encoding: BufferEncoding, callback: stream.TransformCallback) => {
                    const result = parseFloat(chunk.toString());
                    callback(null, result);
                }
            }
        }));
    }
}