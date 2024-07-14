/* eslint-disable @typescript-eslint/no-explicit-any */
import * as net from 'node:net';
import * as assert from 'node:assert';
import { once } from 'node:events';
import { after, describe, test } from 'node:test';
import { StringToBuffer, SocketHandler, BufferToString, AnyToAnyEmitter, Config, AnyTransformToAny, AnyToVoid, AnyTemporalToAny, Node } from '@farar/nodes';
import { PassThrough } from 'node:stream';

// Config.errorHandler = (err: Error) => {
//     throw err;
// };

Config.debug = true;

const DATA = '0123456789';

await describe('Test the integrity of data propagation and error handling.', async () => {

    const temporalNode = new AnyTemporalToAny<string, string>({ time: 0 });
    const stringToBuffer = new StringToBuffer();
    const bufferToString = new BufferToString();
    const server = net.createServer((socket: net.Socket) => {
        const socketHandler1 = new SocketHandler<string, string>({ socket });
        const socketHandler2 = new SocketHandler<string, string>({ socket });
        socketHandler1.connect(socketHandler2);
    }).listen(3000);
    const socket = net.createConnection({ port: 3000 });
    await once(socket, 'connect');
    const socketHandler = new SocketHandler<string, string>({ socket });
    const anyToAnyEmitter = new AnyToAnyEmitter();

    const node = temporalNode.connect(
        stringToBuffer.connect(
            bufferToString.connect(
                socketHandler.connect(
                    anyToAnyEmitter
                )
            )
        )
    );

    after(() => {
        server.close();
        socket.destroy();
    });

    void test('Write a `string` object and assert that it passed through the graph unscathed.', async () => {
        const result = once(anyToAnyEmitter.emitter, 'data');
        await node.write(DATA);
        assert.strictEqual((await result)[0], DATA);
    });

    void test('Test selective detachment of inoperable graph components.', async () => {
        const anyToThrow = new AnyTransformToAny<any, any>({ transform: () => { throw Error('AnyToThrow Error'); } });
        const anyToVoid = new AnyToVoid();
        anyToThrow.connect(anyToVoid);
        socketHandler.connect(
            anyToThrow
        );
        assert.strictEqual(anyToThrow.writableCount, 1);
        assert.strictEqual(anyToVoid.writableCount, 1);
        const result = once(anyToAnyEmitter.emitter, 'data');
        await node.write(DATA);
        await result;
        assert.strictEqual(anyToThrow.writableCount, 0);
        assert.strictEqual(anyToVoid.writableCount, 0);
    });

    void test('Test that a newly added Node continues to flow after reaching its `highWaterMark`.', async () => {
        let i; const ITERATIONS = 1e3;
        const passThrough = new PassThrough({ readableObjectMode: true, writableObjectMode: true, readableHighWaterMark: 1, writableHighWaterMark: 1 });
        socketHandler.connect(new Node<string, string>(passThrough));
        const result = new Promise<Array<string>>((r) => {
            const data: Array<string> = [];
            anyToAnyEmitter.emitter.on('data', (datum: string) => {
                data.push(datum);
                if (data.length == ITERATIONS) {
                    r(data);
                    anyToAnyEmitter.emitter.removeAllListeners('data');
                }
            });
        });
        for (i = 0; i < ITERATIONS; i++) {
            await node.write(DATA);
        }
        const data = (await result).reduce((prev, curr) => prev + curr, '');
        assert.strictEqual(data.length, ITERATIONS * 10);
        assert.strictEqual(DATA.repeat(ITERATIONS), data);
        assert.strictEqual(i, ITERATIONS);
    });
});
