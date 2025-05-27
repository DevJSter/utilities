import { isPeerId } from '@libp2p/interface';
/**
 * Returns the last `length` characters of the peer id
 */
export function shortPeerId(peerId, length = 7) {
    if (isPeerId(peerId)) {
        peerId = peerId.toString();
    }
    return peerId.substring(peerId.length - length);
}
//# sourceMappingURL=short-peer-id.js.map