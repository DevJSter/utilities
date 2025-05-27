import { ethereum } from '@graphprotocol/graph-ts';
import { PairDayData, Token, TokenDayData, UniswapDayData } from '../types/schema';
import { PairHourData } from './../types/schema';
export declare function updateUniswapDayData(event: ethereum.Event): UniswapDayData;
export declare function updatePairDayData(event: ethereum.Event): PairDayData;
export declare function updatePairHourData(event: ethereum.Event): PairHourData;
export declare function updateTokenDayData(token: Token, event: ethereum.Event): TokenDayData;
//# sourceMappingURL=dayUpdates.d.ts.map