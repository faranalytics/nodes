import * as stream from 'node:stream';
import { once } from 'node:events';
import { Config } from './index.js';

export const $stream = Symbol('stream');
export const $queue = Symbol('queue');
export const $ins = Symbol('ins');
export const $outs = Symbol('outs');
export const $write = Symbol('write');
export const $size = Symbol('size');
export const $errorHandler = Symbol('errorHandler');

export interface NodeOptions {
    errorHandler?: (err: Error, ...params: Array<unknown>) => void;
}

export class Node<InT, OutT> {

    protected [$stream]: stream.Writable | stream.Readable;
    protected [$queue]: Array<InT>;
    protected [$ins]: Array<Node<unknown, InT>>;
    protected [$outs]: Array<Node<OutT, unknown>>;
    protected [$size]: number;
    protected [$errorHandler]?: (err: Error, ...params: Array<unknown>) => void;

    constructor(stream: stream.Writable | stream.Readable, options?: NodeOptions) {
        this[$stream] = stream;
        this[$queue] = [];
        this[$ins] = [];
        this[$outs] = [];
        this[$size] = 0;
        this[$errorHandler] = options?.errorHandler ?? Config.errorHandler;

        this[$stream].once('error', () => {
            try {
                for (const _in of this[$ins]) {
                    _in.disconnect(this);
                }
            }
            catch (err) {
                if (this[$errorHandler] && err instanceof Error) {
                    this[$errorHandler](err);
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
                this[$stream].once('error', () => {
                    this.disconnect(node);
                });
                node[$stream].once('error', () => {
                    try {
                        if (this[$stream] instanceof stream.Readable && node[$stream] instanceof stream.Writable) {
                            this[$stream].unpipe(node[$stream]);
                            this[$outs]?.splice(this[$outs].indexOf(node), 1);
                            if (this[$outs]?.length) {
                                this[$stream].resume();
                            }
                        }
                    }
                    catch (err) {
                        if (this[$errorHandler] && err instanceof Error) {
                            this[$errorHandler](err);
                        }
                    }
                });
            }
        }
        catch (err) {
            if (this[$errorHandler] && err instanceof Error) {
                this[$errorHandler](err);
            }
        }
        return this;
    }

    public disconnect(...nodes: Array<Node<OutT, unknown>>): typeof this {
        try {
            for (const node of nodes) {
                if (this[$stream] instanceof stream.Readable && node[$stream] instanceof stream.Writable) {
                    this[$stream].unpipe(node[$stream]);
                    this[$outs]?.splice(this[$outs].indexOf(node), 1);
                    node[$ins]?.splice(node[$ins].indexOf(this), 1);
                    if (this[$outs]?.length) {
                        this[$stream].resume();
                    }
                }
            }
        }
        catch (err) {
            if (this[$errorHandler] && err instanceof Error) {
                this[$errorHandler](err);
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
            if (this[$errorHandler] && err instanceof Error) {
                this[$errorHandler](err);
            }
        }
    }
}