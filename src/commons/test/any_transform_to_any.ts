import * as stream from 'node:stream';
import { Node } from '../../node.js';

export interface AnyTransformToAnyOptions<InT, OutT> {
  transform: (chunk: InT) => Promise<OutT> | OutT;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class AnyTransformToAny<InT = any, OutT = any> extends Node<InT, OutT> {

  public transform: (chunk: InT) => Promise<OutT> | OutT;
  public writableCount: number;
  constructor(options: AnyTransformToAnyOptions<InT, OutT>, streamOptions?: stream.TransformOptions) {
    super(new stream.Transform({
      ...streamOptions,
      writableObjectMode: true,
      readableObjectMode: true,
      transform: async (chunk: InT, encoding: BufferEncoding, callback: stream.TransformCallback) => {
        try {
          callback(null, await this.transform(chunk));
        }
        catch (err) {
          if (err instanceof Error) {
            callback(err);
          }
        }
      }
    })
    );

    this.transform = options.transform;
    this.writableCount = 0;
    this._stream.on('pipe', () => {
      this.writableCount = this.writableCount + 1;
    });
    this._stream.on('unpipe', () => {
      this.writableCount = this.writableCount - 1;
    });
  }

  get stream(): stream.Readable | stream.Writable {
    return this._stream;
  }
}