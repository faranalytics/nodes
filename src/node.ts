import { Readable, Writable, PassThrough } from 'node:stream';
import { once } from 'node:events';
import Config from './config.js';
import * as crypto from 'node:crypto';

export interface NodeOptions {
    id: string;
}

export class Node<InT, OutT, StreamT extends Writable | Readable = Writable | Readable> {

    protected _stream: StreamT;
    protected _queue: Array<InT>;
    protected _size: number;
    protected _id: string;

    constructor(stream:StreamT, options?: NodeOptions) {
        this._stream = stream ?? new PassThrough();
        this._queue = [];
        this._size = 0;
        this._id = options?.id ?? crypto.randomUUID();

        this._stream.on('unpipe', (readable: Readable) => {
            readable.resume();
        });

        this._stream.once('error', (err: Error) => {
            try {
                if (Config.debug) {
                    Config.errorHandler(err);
                }
                if (this._stream instanceof Readable) {
                    this._stream.unpipe();
                }
            }
            catch (err) {
                if (Config.errorHandler && err instanceof Error) {
                    Config.errorHandler(err);
                }
            }
        });
    }

    public connect(...nodes: Array<Node<OutT, unknown>>): typeof this {
        for (const node of nodes) {
            if (this._stream instanceof Readable && node._stream instanceof Writable) {
                this._stream?.pipe(node._stream);
                if (node._stream instanceof Readable) {
                    node._stream.resume();
                }
                if (Config.debug) {
                    console.log(`Connected ${this._id} to ${node._id}.`);
                }
            }
        }
        return this;
    }

    public disconnect(...nodes: Array<Node<OutT, unknown>>): typeof this {
        for (const node of nodes) {
            if (this._stream instanceof Readable && node._stream instanceof Writable) {
                this._stream.unpipe(node._stream);
                this._stream.resume();
                if (Config.debug) {
                    console.log(`Disconnected ${this._id} from ${node._id}.`);
                }
            }
        }
        return this;
    }

    public async write(data: InT, encoding?: BufferEncoding): Promise<void> {
        if (!this._stream.closed && this._stream instanceof Writable) {
            if (!this._stream.writableNeedDrain) {
                if (this._queue.length === 0) {
                    if (this._stream.write(data, encoding ?? 'utf-8')) {
                        return;
                    }
                    else {
                        await once(this._stream, 'drain');
                    }
                }
                else {
                    this._queue.push(data);
                    this._size += !this._stream.writableObjectMode && (data instanceof Buffer || typeof data == 'string') ? data.length : 1;
                }
                while (this._queue.length) {
                    const data = this._queue.shift();
                    this._size -= !this._stream.writableObjectMode && (data instanceof Buffer || typeof data == 'string') ? data.length : 1;
                    if (!this._stream.write(data, encoding ?? 'utf-8')) {
                        await once(this._stream, 'drain');
                    }
                }
            }
            else {
                this._queue.push(data);
                this._size += !this._stream.writableObjectMode && (data instanceof Buffer || typeof data == 'string') ? data.length : 1;
            }
        }
    }
}