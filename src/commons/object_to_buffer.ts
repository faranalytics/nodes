import * as stream from 'node:stream';
import { Node } from '../node.js';

export interface ObjectToBufferOptions {
  replacer?: (this: unknown, key: string, value: unknown) => unknown;
  space?: string | number;
}

export class ObjectToBuffer<InT extends object> extends Node<InT, Buffer> {

  public egressQueue: Buffer;
  public replacer?: (this: unknown, key: string, value: unknown) => unknown;
  public space?: string | number;

  constructor({ replacer, space }: ObjectToBufferOptions = {}, streamOptions?: stream.TransformOptions) {
    super(new stream.Transform({
      ...streamOptions, ...{
        writableObjectMode: true,
        readableObjectMode: false,
        transform: async (chunk: InT, _encoding: BufferEncoding, callback: stream.TransformCallback) => {
          try {
            const data = this.serializeMessage(chunk);
            const size = Buffer.alloc(6, 0);
            size.writeUIntBE(data.length + 6, 0, 6);
            const buf = Buffer.concat([size, data]);
            callback(null, buf);
          }
          catch (err) {
            if (err instanceof Error) {
              callback(err);
            }
          }
        }
      }
    }));

    this.egressQueue = Buffer.allocUnsafe(0);
    this.replacer = replacer;
    this.space = space;
  }

  protected serializeMessage(message: InT): Buffer {
    return Buffer.from(JSON.stringify(message, this.replacer, this.space), 'utf-8');
  }
}