var _a, _b;
import { TypedEventEmitter } from '@libp2p/interface';
import { DIRECT_MESSAGE_PROTOCOL, MIME_TEXT_PLAIN } from '../constants.js';
import { serviceCapabilities, serviceDependencies } from '@libp2p/interface';
import { dm } from '../protobuf/direct-message.js';
import { pbStream } from 'it-protobuf-stream';
export const dmClientVersion = '0.0.1';
export const directMessageEvent = 'message';
const ERRORS = {
    EMPTY_MESSAGE: 'Message cannot be empty',
    NO_CONNECTION: 'Failed to create connection',
    NO_STREAM: 'Failed to create stream',
    NO_RESPONSE: 'No response received',
    NO_METADATA: 'No metadata in response',
    STATUS_NOT_OK: (status) => `Received status: ${status}, expected OK`,
};
export class DirectMessage extends TypedEventEmitter {
    constructor(components) {
        super();
        this[_a] = [
            '@libp2p/identify',
            '@libp2p/connection-encryption',
            '@libp2p/transport',
            '@libp2p/stream-multiplexing',
        ];
        this[_b] = ['@universal-connectivity/direct-message'];
        this.dmPeers = new Set();
        this.components = components;
    }
    async start() {
        this.topologyId = await this.components.registrar.register(DIRECT_MESSAGE_PROTOCOL, {
            onConnect: this.handleConnect.bind(this),
            onDisconnect: this.handleDisconnect.bind(this),
        });
    }
    async afterStart() {
        await this.components.registrar.handle(DIRECT_MESSAGE_PROTOCOL, async ({ stream, connection }) => {
            await this.receive(stream, connection);
        });
    }
    stop() {
        if (this.topologyId != null) {
            this.components.registrar.unregister(this.topologyId);
        }
    }
    handleConnect(peerId) {
        this.dmPeers.add(peerId.toString());
    }
    handleDisconnect(peerId) {
        this.dmPeers.delete(peerId.toString());
    }
    isDMPeer(peerId) {
        return this.dmPeers.has(peerId.toString());
    }
    async send(peerId, message) {
        if (!message) {
            throw new Error(ERRORS.EMPTY_MESSAGE);
        }
        let stream;
        try {
            // openConnection will return the current open connection if it already exists, or create a new one
            const conn = await this.components.connectionManager.openConnection(peerId, { signal: AbortSignal.timeout(5000) });
            if (!conn) {
                throw new Error(ERRORS.NO_CONNECTION);
            }
            // Single protocols can skip full negotiation
            const stream = await conn.newStream(DIRECT_MESSAGE_PROTOCOL, {
                negotiateFully: false,
            });
            if (!stream) {
                throw new Error(ERRORS.NO_STREAM);
            }
            const datastream = pbStream(stream);
            const req = {
                content: message,
                type: MIME_TEXT_PLAIN,
                metadata: {
                    clientVersion: dmClientVersion,
                    timestamp: BigInt(Date.now()),
                },
            };
            const signal = AbortSignal.timeout(5000);
            await datastream.write(req, dm.DirectMessageRequest, { signal });
            const res = await datastream.read(dm.DirectMessageResponse, { signal });
            if (!res) {
                throw new Error(ERRORS.NO_RESPONSE);
            }
            if (!res.metadata) {
                throw new Error(ERRORS.NO_METADATA);
            }
            if (res.status !== dm.Status.OK) {
                throw new Error(ERRORS.STATUS_NOT_OK(res.status));
            }
        }
        catch (e) {
            stream?.abort(e);
            throw e;
        }
        finally {
            try {
                await stream?.close({
                    signal: AbortSignal.timeout(5000),
                });
            }
            catch (err) {
                stream?.abort(err);
                throw err;
            }
        }
        return true;
    }
    async receive(stream, connection) {
        try {
            const datastream = pbStream(stream);
            const signal = AbortSignal.timeout(5000);
            const req = await datastream.read(dm.DirectMessageRequest, { signal });
            const res = {
                status: dm.Status.OK,
                metadata: {
                    clientVersion: dmClientVersion,
                    timestamp: BigInt(Date.now()),
                },
            };
            await datastream.write(res, dm.DirectMessageResponse, { signal });
            const detail = {
                content: req.content,
                type: req.type,
                stream: stream,
                connection: connection,
            };
            this.dispatchEvent(new CustomEvent(directMessageEvent, { detail }));
        }
        catch (e) {
            stream?.abort(e);
            throw e;
        }
        finally {
            try {
                await stream?.close({
                    signal: AbortSignal.timeout(5000),
                });
            }
            catch (err) {
                stream?.abort(err);
                throw err;
            }
        }
    }
}
_a = serviceDependencies, _b = serviceCapabilities;
export function directMessage() {
    return (components) => {
        return new DirectMessage(components);
    };
}
//# sourceMappingURL=direct-message.js.map