import * as stream from "node:stream";
import { Node } from "../node.js";

export interface StringToBufferOptions {
  encoding?: NodeJS.BufferEncoding;
}

export class StringToBuffer<InT extends string = string> extends Node<InT, Buffer> {

  public encoding: NodeJS.BufferEncoding;

  constructor(options?: StringToBufferOptions, streamOptions?: stream.TransformOptions) {
    super(new stream.Transform({
      ...streamOptions, ...{
        writableObjectMode: false,
        readableObjectMode: false,
        transform: (chunk: InT, _encoding: BufferEncoding, callback: stream.TransformCallback) => {
          try {
            const data = Buffer.from(chunk, this.encoding);
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
    this.encoding = options?.encoding ?? "utf-8";
  }
}