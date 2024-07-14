import * as stream from 'node:stream';
import { once } from 'node:events';
import { Config } from './index.js';
import * as crypto from 'node:crypto';

export const $stream = Symbol('stream');
export const $queue = Symbol('queue');
export const $ins = Symbol('ins');
export const $outs = Symbol('outs');
export const $write = Symbol('write');
export const $size = Symbol('size');
export const $errorHandler = Symbol('errorHandler');
export const $id = Symbol('id');

export interface NodeOptions {
    id: string;
}

export class Node<InT, OutT> {

    protected [$stream]: stream.Writable | stream.Readable;
    protected [$queue]: Array<InT>;
    protected [$ins]: Array<Node<unknown, InT>>;
    protected [$outs]: Array<Node<OutT, unknown>>;
    protected [$size]: number;
    protected [$id]: string;

    constructor(stream: stream.Writable | stream.Readable, options?: NodeOptions) {
        this[$stream] = stream;
        this[$queue] = [];
        this[$ins] = [];
        this[$outs] = [];
        this[$size] = 0;
        this[$id] = options?.id ?? crypto.randomUUID();

        this[$stream].once('error', (err: Error) => {
            try {
                if (err instanceof Error) {
                    Config.errorHandler(err);
                }
                for (const _in of this[$ins]) {
                    _in.disconnect(this);
                }
                this.disconnect(...this[$outs]);
            }
            catch (err) {
                if (Config.errorHandler && err instanceof Error) {
                    Config.errorHandler(err);
                }
            }
        });
    }

    public connect(...nodes: Array<Node<OutT, unknown>>): typeof this {
        try {
            for (const node of nodes) {
                if (this[$stream] instanceof stream.Readable && node[$stream] instanceof stream.Writable) {
                    this[$stream]?.pipe(node[$stream]);
                }
                node[$ins]?.push(this);
                this[$outs]?.push(node);
                if (Config.verbose) {
                    console.log(`Connected ${this[$id]} to ${node[$id]}.`);
                }
            }
        }
        catch (err) {
            if (Config.errorHandler && err instanceof Error) {
                Config.errorHandler(err);
            }
        }
        return this;
    }

    public disconnect(...nodes: Array<Node<OutT, unknown>>): typeof this {
        try {
            for (const node of nodes) {
                if (this[$stream] instanceof stream.Readable && node[$stream] instanceof stream.Writable) {
                    this[$stream].unpipe(node[$stream]);
                    const nodeIndex = this[$outs].indexOf(node);
                    if (nodeIndex != -1) {
                        this[$outs]?.splice(nodeIndex, 1)[0];
                    }
                    const thisIndex = node[$ins].indexOf(this);
                    if (thisIndex != -1) {
                        node[$ins]?.splice(thisIndex, 1);
                    }
                    if (Config.verbose) {
                        console.log(`Disconnected ${this[$id]} from ${node[$id]}.`);
                    }
                    if (this[$outs]?.length) {
                        this[$stream].resume();
                    }
                }
            }
        }
        catch (err) {
            if (Config.errorHandler && err instanceof Error) {
                Config.errorHandler(err);
            }
        }
        return this;
    }

    protected async [$write](data: InT, encoding?: BufferEncoding): Promise<void> {
        try {
            if (!this[$stream].closed && this[$stream] instanceof stream.Writable) {
                if (!this[$stream].writableNeedDrain) {
                    if (this[$queue].length === 0) {
                        if (this[$stream].write(data, encoding ?? 'utf-8')) {
                            return;
                        }
                        else {
                            await once(this[$stream], 'drain');
                        }
                    }
                    else {
                        this[$queue].push(data);
                        this[$size] += !this[$stream].writableObjectMode && (data instanceof Buffer || typeof data == 'string') ? data.length : 1;
                    }
                    while (this[$queue].length) {
                        const data = this[$queue].shift();
                        this[$size] -= !this[$stream].writableObjectMode && (data instanceof Buffer || typeof data == 'string') ? data.length : 1;
                        if (!this[$stream].write(data, encoding ?? 'utf-8')) {
                            await once(this[$stream], 'drain');
                        }
                    }
                }
                else {
                    this[$queue].push(data);
                    this[$size] += !this[$stream].writableObjectMode && (data instanceof Buffer || typeof data == 'string') ? data.length : 1;
                }
            }
        }
        catch (err) {
            if (Config.errorHandler && err instanceof Error) {
                Config.errorHandler(err);
            }
        }
    }
}