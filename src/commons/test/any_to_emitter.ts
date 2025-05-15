import * as stream from "node:stream";
import * as events from "node:events";
import Config from "../../config.js";
import { Node } from "../../node.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class AnyToEmitter<InT = any> extends Node<InT, never> {

  public emitter: events.EventEmitter;
  public writableCount: number;
  constructor(streamOptions?: stream.WritableOptions) {
    super(new stream.Writable({
      ...streamOptions, ...{
        objectMode: true,
        write: (chunk: InT, encoding: BufferEncoding, callback: (error?: Error | null) => void) => {
          try {
            this.emitter.emit("data", chunk);
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

    this.emitter = new events.EventEmitter();
    this._stream.once("error", (err: Error) => { this.emitter.emit("error", err); });
    this.writableCount = 0;
    this._stream.on("pipe", () => {
      this.writableCount = this.writableCount + 1;
    });
    this._stream.on("unpipe", () => {
      this.writableCount = this.writableCount - 1;
    });
  }

  public write(data: InT, encoding?: BufferEncoding): void {
    super._write(data, encoding).catch((err: unknown) => { Config.errorHandler(err instanceof Error ? err : new Error()); });
  }

  get stream(): stream.Readable | stream.Writable {
    return this._stream;
  }
}