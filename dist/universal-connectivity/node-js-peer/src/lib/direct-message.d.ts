import { PeerId, Stream, Connection, TypedEventEmitter, Startable } from '@libp2p/interface';
import { serviceCapabilities, serviceDependencies } from '@libp2p/interface';
import type { ConnectionManager } from '@libp2p/interface-internal';
import type { Registrar } from '@libp2p/interface-internal';
export declare const dmClientVersion = "0.0.1";
export declare const directMessageEvent = "message";
export interface DirectMessageEvent {
    content: string;
    type: string;
    stream: Stream;
    connection: Connection;
}
export interface DirectMessageEvents {
    message: CustomEvent<DirectMessageEvent>;
}
interface DirectMessageComponents {
    registrar: Registrar;
    connectionManager: ConnectionManager;
}
export declare class DirectMessage extends TypedEventEmitter<DirectMessageEvents> implements Startable {
    readonly [serviceDependencies]: string[];
    readonly [serviceCapabilities]: string[];
    private topologyId?;
    private readonly components;
    private dmPeers;
    constructor(components: DirectMessageComponents);
    start(): Promise<void>;
    afterStart(): Promise<void>;
    stop(): void;
    private handleConnect;
    private handleDisconnect;
    isDMPeer(peerId: PeerId): boolean;
    send(peerId: PeerId, message: string): Promise<boolean>;
    receive(stream: Stream, connection: Connection): Promise<void>;
}
export declare function directMessage(): (components: DirectMessageComponents) => DirectMessage;
export {};
//# sourceMappingURL=direct-message.d.ts.map