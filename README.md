# Nodes

Nodes provides a framework for building type-safe data transformation graphs using Node.js streams.

## Introduction

Nodes provides an intuitive framework for constructing data transformation graphs using native Node.js streams.  You can use the built-in library of commonly used data transformation `Nodes` or implement your own.

### Features

- A type-safe graph-like API pattern for building data transformation graphs based on Node.js streams.
- Consume any native Node.js Readable, Writable, Duplex, or Transform stream and add it to your graph.
- Error propagation and selective termination of inoperable graph components.
- Automatic message queueing in order to assist with handling of backpressure.

## Table of Contents

- [Installation](#installation)
- [Concepts](#concepts)
- [Examples](#examples)
    - [*A Graph-API-Pattern Logger Implementation*](#a-graph-api-pattern-logger-implementation-example)
- [API](#api)
- [How-Tos](#how-tos)
    - [How to Implement a Data Transformation Node](#how-to-implement-a-node)
    - [How to Consume a Readable, Writable, Duplex, or Transform Node.js Stream](#how-to-consume-a-readable-writable-duplex-or-transform-nodejs-stream)
- [Backpressure](#backpressure)
- [Best Practices](#best-practices)

## Installation

```bash
npm install @farar/nodes
```

## Concepts

### Node

A `Node` is a component of a graph-like data transformation pipeline.  Each `Node` is responsible for transforming its input into an output that can be consumed by its connected Nodes.  By connecting `Nodes` into a network, sophisticated graph-like data transformation pipelines can be constructed.

## Examples

### *A Graph API Pattern Logger Implementation* <sup><sup>(example)</sup></sup>
Please see the [Streams Logger](https://github.com/faranalytics/streams-logger) implementation.

## API

### The Node class.

**new Nodes.Node\<InT, OutT\>(stream)**
- `stream` `<stream.Writable | stream.Readable>` An instance of a `Writable`, `Readable`, `Duplex`, or `Transform` Node.js stream.

*public* **node.connect(...nodes)**
- nodes `<Array<T>>` An array of `Node<OutT, unknown>` to be connected to this `Node`.

Returns: `<Node<InT, OutT>>`

*public* **node.disconnect(...nodes)**
- nodes `<Array<T>>` An array of `Node<OutT, unknown>` to be disconnected from this `Node`.

Returns: `<Node<InT, OutT>>`

*protected* **node\[$write\](data)**
- data `<InT>` Data to write to the writable side of the stream.

Returns: `<Promise<void>>`

## How-Tos

### How to Implement a Data Transformation Node

In order to implement a data transformation `Node`, extend the `Node` class and pass a Node.js `stream.Node` implementation to the super's constructor.  

For example, the following `StringToNumber` implementation will convert a numeric string to a number.  

> NB: `writableObjectMode` and `readableObjectMode` are both set to true in this example; hence, the Node.js stream implementation will handle the input and output as objects.  It's important that `writableObjectMode` and `readableObjectMode` accurately reflect the input and output types of your `Node`.

```ts
import * as stream from 'node:stream';
import { Node } from '@farar/nodes';

class StringToNumber extends Node<string, number> {

    constructor(options: stream.TransformOptions) {
        super(new stream.Node({
            ...options, ...{
                writableObjectMode: true,
                readableObjectMode: true,
                transform: (chunk: string, encoding: BufferEncoding, callback: stream.NodeCallback) => {
                    const result = parseFloat(chunk.toString());
                    callback(null, result);
                }
            }
        }));
    }
}
```

### How to Consume a Readable, Writable, Duplex, or Transform Node.js Stream

In this hypothetical example a type-safe `Node` is constructed from a `net.Socket`.  The resulting `Node` instance can be used in a data transformation graph.

```ts
import * as net from 'node:net';
import { once } from 'node:events';

net.createServer((socket: net.Socket) => socket.pipe(socket)).listen(3000);
const socket = net.createConnection({ port: 3000 });
await once(socket, 'connect');
const socketHandler = new Node<Buffer, Buffer>(socket);
```

## Backpressure
The `Node` class has a `$write` method that respects backpressue; when a stream is draining it will queue messages until a `drain` event is emitted by the Node's stream.  Your application can optionally monitor the size of the queue and respond appropriately.

If you have a stream that is backpressuring, you can increase the high water mark on the stream in order to mitigate drain events.

## Best Practices

### Avoid reuse of Node instances (*unless you know what you are doing!*).
Reusing the same Node instance can result in unexpected phenomena.  If the same Node instance is used in different locations in your graph, you need to think carefully about the resulting edges that are connected to both the input and the output of the Node instance.  Most of the time if you need to use the same class of Node more than once, it's advisable to create a new instance for each use.