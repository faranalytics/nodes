/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import * as net from 'node:net';
import * as assert from 'node:assert';
import { once } from 'node:events';
import { after, describe, test } from 'node:test';
import { ObjectToBuffer, BufferToObject, ConsoleHandler, SocketHandler, BufferToString, AnyToEmitter, Node, Config, AnyTransformToAny, AnyToVoid, AnyTemporalToAny } from '@farar/nodes';

Config.setErrorHandler((err: Error) => {
    throw err;
});

class Greeter {
    public greeting: string;
    constructor(greeating: string = 'Hello, World!', repeat: number = 1) {
        this.greeting = greeating.repeat(repeat);
    }
}

const anyToVoid = new AnyToVoid();
const anyToThrow = new AnyTransformToAny({ transform: (chunk) => { throw Error('Error'); } });
const anyToThrowChild = new AnyToVoid();
const anyToEmitter = new AnyToEmitter<string>();
const temporalNode = new AnyTemporalToAny<Greeter, Greeter>({ time: 1000 });
const objectToBuffer1 = new ObjectToBuffer<Greeter>();
const objectToBuffer2 = new ObjectToBuffer<Greeter>();
const bufferToString = new BufferToString();
const bufferToObject = new BufferToObject<Greeter>();
const server = net.createServer((socket: net.Socket) => {
    const socketHandler1 = new SocketHandler<Greeter, Greeter>({ socket });
    const socketHandler2 = new SocketHandler<Greeter, Greeter>({ socket });
    socketHandler1.connect(socketHandler2);
}).listen(3000);
const socket = net.createConnection({ port: 3000 });
await once(socket, 'connect');
const socketHandler = new SocketHandler<Greeter, Greeter>({ socket });

const node = temporalNode.connect(
    objectToBuffer1.connect(
        bufferToObject.connect(
            socketHandler.connect(
                objectToBuffer2.connect(
                    bufferToString.connect(
                        anyToVoid
                    ),
                )
            )
        )
    )
);

describe('Test all.', () => {
    after(() => {
        server.close();
        socket.destroy();
    });
    describe('Test the integrity of data propagation.', () => {
        bufferToString.connect(anyToEmitter);
        void test('Write a `Greeter` object and assert that it passed through the graph unscathed.', async () => {
            const result = once(anyToEmitter.emitter, 'data');
            node.write(new Greeter());
            assert.strictEqual((await result)[0], JSON.stringify(new Greeter()));
        });
    });

    describe('Test error handling.', () => {
        void test('Test selective termination of inoperable graph components.', async () => {
            anyToThrow.connect(anyToThrowChild);
            bufferToString.connect(anyToThrow);
            assert.strictEqual(anyToThrow.ins.length, 1);
            assert.strictEqual(anyToThrow.outs.length, 1);
            node.write(new Greeter());
            await once(anyToEmitter.emitter, 'data');
            assert.strictEqual(anyToThrow.ins.length, 0);
            assert.strictEqual(anyToThrow.outs.length, 0);
        });
    });
});
