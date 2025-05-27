import { type Codec, type DecodeOptions } from 'protons-runtime';
import type { Uint8ArrayList } from 'uint8arraylist';
export interface dm {
}
export declare namespace dm {
    interface DirectMessage {
    }
    namespace DirectMessage {
        const codec: () => Codec<DirectMessage>;
        const encode: (obj: Partial<DirectMessage>) => Uint8Array;
        const decode: (buf: Uint8Array | Uint8ArrayList, opts?: DecodeOptions<DirectMessage>) => DirectMessage;
    }
    interface Metadata {
        clientVersion: string;
        timestamp: bigint;
    }
    namespace Metadata {
        const codec: () => Codec<Metadata>;
        const encode: (obj: Partial<Metadata>) => Uint8Array;
        const decode: (buf: Uint8Array | Uint8ArrayList, opts?: DecodeOptions<Metadata>) => Metadata;
    }
    enum Status {
        UNKNOWN = "UNKNOWN",
        OK = "OK",
        ERROR = "ERROR"
    }
    namespace Status {
        const codec: () => Codec<Status>;
    }
    interface DirectMessageRequest {
        metadata?: dm.Metadata;
        content: string;
        type: string;
    }
    namespace DirectMessageRequest {
        const codec: () => Codec<DirectMessageRequest>;
        const encode: (obj: Partial<DirectMessageRequest>) => Uint8Array;
        const decode: (buf: Uint8Array | Uint8ArrayList, opts?: DecodeOptions<DirectMessageRequest>) => DirectMessageRequest;
    }
    interface DirectMessageResponse {
        metadata?: dm.Metadata;
        status: dm.Status;
        statusText?: string;
    }
    namespace DirectMessageResponse {
        const codec: () => Codec<DirectMessageResponse>;
        const encode: (obj: Partial<DirectMessageResponse>) => Uint8Array;
        const decode: (buf: Uint8Array | Uint8ArrayList, opts?: DecodeOptions<DirectMessageResponse>) => DirectMessageResponse;
    }
    const codec: () => Codec<dm>;
    const encode: (obj: Partial<dm>) => Uint8Array;
    const decode: (buf: Uint8Array | Uint8ArrayList, opts?: DecodeOptions<dm>) => dm;
}
//# sourceMappingURL=direct-message.d.ts.map