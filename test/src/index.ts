/* eslint-disable @typescript-eslint/no-unused-vars */
import * as net from 'node:net';
import * as assert from 'node:assert';
import { once } from 'node:events';
import { describe, test } from 'node:test';
import { ObjectToBuffer, BufferToObject, ConsoleHandler, SocketHandler, BufferToString, AnyToTest, Node } from '@farar/nodes';
import { TemporalNode } from './temporal_node.js';

class Greeter {
    public greeting: string = '0'.repeat(1e6);
}

async function test1() {

    const suite = async (chunk: string, encoding: BufferEncoding, callback: (error?: Error | null | undefined) => void) => {
        if (typeof chunk != 'string') {
            chunk = JSON.stringify(chunk);
        }
        await describe('Test.', async () => {
            await test('Assert that `chunk` is strictly equal to `expected`.', async () => {
                assert.strictEqual(chunk, JSON.stringify(new Greeter()));
            });
        });
        callback();
    };

    const anyToTest = new AnyToTest<string>({ suite });

    const temporalNode = new TemporalNode({ time: 1000 });
    const objectToBuffer1 = new ObjectToBuffer<Greeter>();
    const objectToBuffer2 = new ObjectToBuffer<Greeter>();
    const bufferToString = new BufferToString();
    const bufferToObject = new BufferToObject<Greeter>();
    const consoleHandler = new ConsoleHandler();

    net.createServer((socket: net.Socket) => {
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
                            consoleHandler,
                            anyToTest
                        )
                    )
                )
            )
        )
    );

    node.write(new Greeter());
    node.write(new Greeter());
}

test1();

// net.createServer((socket: net.Socket) => socket.pipe(socket)).listen(3000);
// const socket = net.createConnection({ port: 3000 });
// await once(socket, 'connect');
// const socketHandler = new Node<Buffer, Buffer>(socket);