/* eslint-disable import/export */
/* eslint-disable complexity */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-unnecessary-boolean-literal-compare */
/* eslint-disable @typescript-eslint/no-empty-interface */
import { decodeMessage, encodeMessage, enumeration, message } from 'protons-runtime';
export var dm;
(function (dm) {
    let DirectMessage;
    (function (DirectMessage) {
        let _codec;
        DirectMessage.codec = () => {
            if (_codec == null) {
                _codec = message((obj, w, opts = {}) => {
                    if (opts.lengthDelimited !== false) {
                        w.fork();
                    }
                    if (opts.lengthDelimited !== false) {
                        w.ldelim();
                    }
                }, (reader, length, opts = {}) => {
                    const obj = {};
                    const end = length == null ? reader.len : reader.pos + length;
                    while (reader.pos < end) {
                        const tag = reader.uint32();
                        switch (tag >>> 3) {
                            default: {
                                reader.skipType(tag & 7);
                                break;
                            }
                        }
                    }
                    return obj;
                });
            }
            return _codec;
        };
        DirectMessage.encode = (obj) => {
            return encodeMessage(obj, DirectMessage.codec());
        };
        DirectMessage.decode = (buf, opts) => {
            return decodeMessage(buf, DirectMessage.codec(), opts);
        };
    })(DirectMessage = dm.DirectMessage || (dm.DirectMessage = {}));
    let Metadata;
    (function (Metadata) {
        let _codec;
        Metadata.codec = () => {
            if (_codec == null) {
                _codec = message((obj, w, opts = {}) => {
                    if (opts.lengthDelimited !== false) {
                        w.fork();
                    }
                    if ((obj.clientVersion != null && obj.clientVersion !== '')) {
                        w.uint32(10);
                        w.string(obj.clientVersion);
                    }
                    if ((obj.timestamp != null && obj.timestamp !== 0n)) {
                        w.uint32(16);
                        w.int64(obj.timestamp);
                    }
                    if (opts.lengthDelimited !== false) {
                        w.ldelim();
                    }
                }, (reader, length, opts = {}) => {
                    const obj = {
                        clientVersion: '',
                        timestamp: 0n
                    };
                    const end = length == null ? reader.len : reader.pos + length;
                    while (reader.pos < end) {
                        const tag = reader.uint32();
                        switch (tag >>> 3) {
                            case 1: {
                                obj.clientVersion = reader.string();
                                break;
                            }
                            case 2: {
                                obj.timestamp = reader.int64();
                                break;
                            }
                            default: {
                                reader.skipType(tag & 7);
                                break;
                            }
                        }
                    }
                    return obj;
                });
            }
            return _codec;
        };
        Metadata.encode = (obj) => {
            return encodeMessage(obj, Metadata.codec());
        };
        Metadata.decode = (buf, opts) => {
            return decodeMessage(buf, Metadata.codec(), opts);
        };
    })(Metadata = dm.Metadata || (dm.Metadata = {}));
    let Status;
    (function (Status) {
        Status["UNKNOWN"] = "UNKNOWN";
        Status["OK"] = "OK";
        Status["ERROR"] = "ERROR";
    })(Status = dm.Status || (dm.Status = {}));
    let __StatusValues;
    (function (__StatusValues) {
        __StatusValues[__StatusValues["UNKNOWN"] = 0] = "UNKNOWN";
        __StatusValues[__StatusValues["OK"] = 200] = "OK";
        __StatusValues[__StatusValues["ERROR"] = 500] = "ERROR";
    })(__StatusValues || (__StatusValues = {}));
    (function (Status) {
        Status.codec = () => {
            return enumeration(__StatusValues);
        };
    })(Status = dm.Status || (dm.Status = {}));
    let DirectMessageRequest;
    (function (DirectMessageRequest) {
        let _codec;
        DirectMessageRequest.codec = () => {
            if (_codec == null) {
                _codec = message((obj, w, opts = {}) => {
                    if (opts.lengthDelimited !== false) {
                        w.fork();
                    }
                    if (obj.metadata != null) {
                        w.uint32(10);
                        dm.Metadata.codec().encode(obj.metadata, w);
                    }
                    if ((obj.content != null && obj.content !== '')) {
                        w.uint32(18);
                        w.string(obj.content);
                    }
                    if ((obj.type != null && obj.type !== '')) {
                        w.uint32(26);
                        w.string(obj.type);
                    }
                    if (opts.lengthDelimited !== false) {
                        w.ldelim();
                    }
                }, (reader, length, opts = {}) => {
                    const obj = {
                        content: '',
                        type: ''
                    };
                    const end = length == null ? reader.len : reader.pos + length;
                    while (reader.pos < end) {
                        const tag = reader.uint32();
                        switch (tag >>> 3) {
                            case 1: {
                                obj.metadata = dm.Metadata.codec().decode(reader, reader.uint32(), {
                                    limits: opts.limits?.metadata
                                });
                                break;
                            }
                            case 2: {
                                obj.content = reader.string();
                                break;
                            }
                            case 3: {
                                obj.type = reader.string();
                                break;
                            }
                            default: {
                                reader.skipType(tag & 7);
                                break;
                            }
                        }
                    }
                    return obj;
                });
            }
            return _codec;
        };
        DirectMessageRequest.encode = (obj) => {
            return encodeMessage(obj, DirectMessageRequest.codec());
        };
        DirectMessageRequest.decode = (buf, opts) => {
            return decodeMessage(buf, DirectMessageRequest.codec(), opts);
        };
    })(DirectMessageRequest = dm.DirectMessageRequest || (dm.DirectMessageRequest = {}));
    let DirectMessageResponse;
    (function (DirectMessageResponse) {
        let _codec;
        DirectMessageResponse.codec = () => {
            if (_codec == null) {
                _codec = message((obj, w, opts = {}) => {
                    if (opts.lengthDelimited !== false) {
                        w.fork();
                    }
                    if (obj.metadata != null) {
                        w.uint32(10);
                        dm.Metadata.codec().encode(obj.metadata, w);
                    }
                    if (obj.status != null && __StatusValues[obj.status] !== 0) {
                        w.uint32(16);
                        dm.Status.codec().encode(obj.status, w);
                    }
                    if (obj.statusText != null) {
                        w.uint32(26);
                        w.string(obj.statusText);
                    }
                    if (opts.lengthDelimited !== false) {
                        w.ldelim();
                    }
                }, (reader, length, opts = {}) => {
                    const obj = {
                        status: Status.UNKNOWN
                    };
                    const end = length == null ? reader.len : reader.pos + length;
                    while (reader.pos < end) {
                        const tag = reader.uint32();
                        switch (tag >>> 3) {
                            case 1: {
                                obj.metadata = dm.Metadata.codec().decode(reader, reader.uint32(), {
                                    limits: opts.limits?.metadata
                                });
                                break;
                            }
                            case 2: {
                                obj.status = dm.Status.codec().decode(reader);
                                break;
                            }
                            case 3: {
                                obj.statusText = reader.string();
                                break;
                            }
                            default: {
                                reader.skipType(tag & 7);
                                break;
                            }
                        }
                    }
                    return obj;
                });
            }
            return _codec;
        };
        DirectMessageResponse.encode = (obj) => {
            return encodeMessage(obj, DirectMessageResponse.codec());
        };
        DirectMessageResponse.decode = (buf, opts) => {
            return decodeMessage(buf, DirectMessageResponse.codec(), opts);
        };
    })(DirectMessageResponse = dm.DirectMessageResponse || (dm.DirectMessageResponse = {}));
    let _codec;
    dm.codec = () => {
        if (_codec == null) {
            _codec = message((obj, w, opts = {}) => {
                if (opts.lengthDelimited !== false) {
                    w.fork();
                }
                if (opts.lengthDelimited !== false) {
                    w.ldelim();
                }
            }, (reader, length, opts = {}) => {
                const obj = {};
                const end = length == null ? reader.len : reader.pos + length;
                while (reader.pos < end) {
                    const tag = reader.uint32();
                    switch (tag >>> 3) {
                        default: {
                            reader.skipType(tag & 7);
                            break;
                        }
                    }
                }
                return obj;
            });
        }
        return _codec;
    };
    dm.encode = (obj) => {
        return encodeMessage(obj, dm.codec());
    };
    dm.decode = (buf, opts) => {
        return decodeMessage(buf, dm.codec(), opts);
    };
})(dm || (dm = {}));
//# sourceMappingURL=direct-message.js.map