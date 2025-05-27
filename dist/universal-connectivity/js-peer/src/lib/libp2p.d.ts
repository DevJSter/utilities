import { Multiaddr } from '@multiformats/multiaddr';
import type { Connection, Message, Libp2p } from '@libp2p/interface';
import type { Libp2pType } from '@/context/ctx';
export declare function startLibp2p(): Promise<Libp2pType>;
export declare function msgIdFnStrictNoSign(msg: Message): Promise<Uint8Array>;
export declare const connectToMultiaddr: (libp2p: Libp2p) => (multiaddr: Multiaddr) => Promise<any>;
export declare const getFormattedConnections: (connections: Connection[]) => {
    peerId: any;
    protocols: unknown[];
}[];
//# sourceMappingURL=libp2p.d.ts.map