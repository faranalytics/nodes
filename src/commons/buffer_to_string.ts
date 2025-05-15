import * as stream from 'node:stream';
import { Node } from '../node.js';

export interface BufferToStringOptions {
  encoding: NodeJS.BufferEncoding;
}

export class BufferToString extends Node<Buffer, string> {

  public ingressQueue: Buffer;
  public messageSize: number | null;
  public encoding?: NodeJS.BufferEncoding;

  constructor({ encoding }: BufferToStringOptions = { encoding: 'utf-8' }, streamOptions?: stream.TransformOptions) {
    super(new stream.Transform({
      ...streamOptions, ...{
        writableObjectMode: false,
        readableObjectMode: true,
        transform: async (chunk: Buffer | string, _encoding: BufferEncoding, callback: stream.TransformCallback) => {
          try {
            if (!Buffer.isBuffer(chunk)) {
              chunk = Buffer.from(chunk, 'utf-8');
            }

            this.ingressQueue = Buffer.concat([this.ingressQueue, chunk]);

            if (this.messageSize === null) {
              this.messageSize = this.ingressQueue.readUintBE(0, 6);
            }

            if (this.ingressQueue.length < this.messageSize) {
              callback();
              return;
            }

            while (this.ingressQueue.length >= this.messageSize) {
              const buf = this.ingressQueue.subarray(6, this.messageSize);
              this.ingressQueue = this.ingressQueue.subarray(this.messageSize, this.ingressQueue.length);
              const message = buf.toString(this.encoding);

              if (this._stream instanceof stream.Readable) {
                this._stream.push(message);
              }

              if (this.ingressQueue.length > 6) {
                this.messageSize = this.ingressQueue.readUintBE(0, 6);
              }
              else {
                this.messageSize = null;
                break;
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

    this.ingressQueue = Buffer.allocUnsafe(0);
    this.messageSize = null;
    this.encoding = encoding;
  }
}