import { BigDecimal } from '@graphprotocol/graph-ts/index';
import { Pair, Token } from '../types/schema';
export declare function getEthPriceInUSD(): BigDecimal;
/**
 * Search through graph to find derived Eth per token.
 * @todo update to be derived ETH (add stablecoin estimates)
 **/
export declare function findEthPerToken(token: Token): BigDecimal;
/**
 * Accepts tokens and amounts, return tracked amount based on token whitelist
 * If one token on whitelist, return amount in that token converted to USD.
 * If both are, return average of two amounts
 * If neither is, return 0
 */
export declare function getTrackedVolumeUSD(tokenAmount0: BigDecimal, token0: Token, tokenAmount1: BigDecimal, token1: Token, pair: Pair): BigDecimal;
/**
 * Accepts tokens and amounts, return tracked amount based on token whitelist
 * If one token on whitelist, return amount in that token converted to USD * 2.
 * If both are, return sum of two amounts
 * If neither is, return 0
 */
export declare function getTrackedLiquidityUSD(tokenAmount0: BigDecimal, token0: Token, tokenAmount1: BigDecimal, token1: Token): BigDecimal;
//# sourceMappingURL=pricing.d.ts.map