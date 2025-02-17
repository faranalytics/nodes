# Nodes

Nodes provides a framework for building type-safe data transformation graphs using Node.js streams.

## Introduction

Nodes provides an intuitive framework for constructing data transformation graphs using native Node.js streams. You can use the built-in library of commonly used data transformation `Node` classes or implement your own.

### Features

- A type-safe graph-like API pattern for building data transformation graphs based on Node.js streams.
- Consume any native Node.js Readable, Writable, Duplex, or Transform stream and add it to your graph.
- Error handling and selective termination of inoperable graph components.
- Automatic message queueing in order to assist with handling of backpressure.

## Table of contents

- [Installation](#installation)
- [Concepts](#concepts)
- [Examples](#examples)
- [API](#api)
- [How-Tos](#how-tos)
- [Backpressure](#backpressure)
- [Best practices](#best-practices)
- [Error handling](#error-handling)
- [Versioning](#versioning)
- [Test](#test)
- [Support](#support)

## Installation

```bash
npm install @farar/nodes
```

## Concepts

### Node

A `Node` is a component of a graph-like data transformation pipeline. Each `Node` is responsible for transforming its input into an output that can be consumed by its connected `Node` instances. By connecting `Node` instances into a network, sophisticated graph-like data transformation pipelines can be constructed.

## Examples

### _A graph API pattern logger implementation_ <sup><sup>\</example\></sup></sup>

Please see the [_Streams_ Logger](https://github.com/faranalytics/streams-logger) implementation.

## API

### The Node class

#### new nodes.Node\<InT, OutT\>(stream, options)

- `<IntT>` The input into the stream.
- `<OutT>` The output from the stream.
- `stream` `<stream.Writable | stream.Readable>` An instance of a `Writable`, `Readable`, `Duplex`, or `Transform` Node.js stream.
- `options` `<NodeOptions>`
  - `errorHandler` `<(err: Error, ...params: Array<unknown>) => void>` An optional error handler that will be used in the event of an internal Error. **Default: `console.error`**

_public_ **node.connect(...nodes)**

- nodes `<Array<T>>` An array of `Node<OutT, unknown>` to be connected to this `Node`.

Returns: `<Node<InT, OutT>>`

_public_ **node.disconnect(...nodes)**

- nodes `<Array<T>>` An array of `Node<OutT, unknown>` to be disconnected from this `Node`.

Returns: `<Node<InT, OutT>>`

_protected_ **node.\_write(data, encoding)**

- data `<InT>` Data to write to the writable side of the stream.
- encoding `<NodeJS.BufferEncoding>` An optional Node.js [encoding](https://nodejs.org/api/buffer.html#buffers-and-character-encodings) **Default: `utf-8`**.

Returns: `<Promise<void>>`

### The Nodes Config settings object

**Config.errorHandler** `<ErrorHandler>` An optional error handler. **Default: `console.error`**

**Config.debug** `<boolean>` Announce internal activities e.g., connectiing and disconnecting from `Node` instances. **Default: `false`**

## How-Tos

### How to implement a data transformation node

In order to implement a data transformation `Node`, extend the `Node` class and pass a Node.js `stream.Writable` implementation to the super's constructor.

For example, the following `StringToNumber` implementation will convert a numeric string to a number.

> **NB** In this example, `writableObjectMode` and `readableObjectMode` are both set to `true`; hence, the Node.js stream implementation will handle the input and output as objects. It's important that `writableObjectMode` and `readableObjectMode` accurately reflect the input and output types of your `Node`.

```ts
import * as stream from "node:stream";
import { Config, Node } from "@farar/nodes";

export class StringToNumber extends Node<string, number> {
  constructor(options: stream.TransformOptions) {
    super(
      new stream.Transform({
        ...options,
        ...{
          writableObjectMode: true,
          readableObjectMode: true,
          transform: (
            chunk: string,
            encoding: BufferEncoding,
            callback: stream.TransformCallback
          ) => {
            try {
              const result = parseFloat(chunk.toString());
              callback(null, result);
            } catch (err) {
              if (err instanceof Error) {
                callback(err);
                Config.errorHandler(err);
              }
            }
          },
        },
      })
    );
  }
}
```

### How to consume a Readable, Writable, Duplex, or Transform Node.js stream

In this hypothetical example a type-safe `Node` is constructed from a `net.Socket`. The resulting `Node` instance can be used in a data transformation graph.

```ts
import * as net from "node:net";
import { once } from "node:events";

net.createServer((socket: net.Socket) => socket.pipe(socket)).listen(3000);
const socket = net.createConnection({ port: 3000 });
await once(socket, "connect");
const socketHandler = new Node<Buffer, Buffer>(socket);
```

## Backpressure

The `Node` class has a `_write` method that respects backpressue; when a stream is draining it will queue messages until a `drain` event is emitted by the Node's stream. Your application can optionally monitor the size of the queue and respond appropriately.

If you have a stream that is backpressuring, you can increase the high water mark on the stream in order to mitigate drain events.

## Best practices

### Avoid reuse of `Node` instances (_unless you know what you are doing!_).

Reusing the same `Node` instance can result in unexpected phenomena. If the same `Node` instance is used in different locations in your graph, you need to think carefully about the resulting edges that are connected to both the input and the output of the `Node` instance. Most of the time if you need to use the same class of `Node` more than once, it's advisable to create a new instance for each use.

## Error handling

Nodes may be used in diverse contexts, each with unique requirements. Nodes _should_ never throw if the API is used in accordance with the documentation. However, "_phenomena happens_"; hence, you may choose to handle errors accordingly!

Nodes defaults to logging its errors to `process.stderr`. If your application requires that errors throw, you may set an `errorHandler` on the `Config` object that does that. Alternatively, your handler may consume the `Error` and handle it otherwise.

### Optionally configure all internal errors to be thrown

```ts
import { Config } from "@farar/nodes";
Config.errorHandler = (err: Error) => {
  throw err;
};
```

## Versioning

The Nodes package adheres to semantic versioning. Breaking changes to the public API will result in a turn of the major. Minor and patch changes will always be backward compatible.

Excerpted from [Semantic Versioning 2.0.0](https://semver.org/):

> Given a version number MAJOR.MINOR.PATCH, increment the:
>
> 1. MAJOR version when you make incompatible API changes
> 2. MINOR version when you add functionality in a backward compatible manner
> 3. PATCH version when you make backward compatible bug fixes
>
> Additional labels for pre-release and build metadata are available as extensions to the MAJOR.MINOR.PATCH format.

## Test

### How to run the test

#### Clone the repository.

```bash
git clone https://github.com/faranalytics/nodes.git
```

#### Change directory into the root of the repository.

```bash
cd nodes
```

#### Install dependencies.

```bash
npm install && npm update
```

#### Run the tests.

```bash
npm test
```

## Support

If you have a feature request or run into any issues, feel free to submit an [issue](https://github.com/faranalytics/nodes/issues) or start a [discussion](https://github.com/faranalytics/nodes/discussions). You’re also welcome to reach out directly to one of the authors.

- [Adam Patterson](https://github.com/adamjpatterson)
