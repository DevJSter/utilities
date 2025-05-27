import { Address, BigInt } from '@graphprotocol/graph-ts';
export declare class TokenDefinition {
    address: Address;
    symbol: string;
    name: string;
    decimals: BigInt;
    static getStaticDefinitions(): Array<TokenDefinition>;
    static fromAddress(tokenAddress: Address): TokenDefinition | null;
}
//# sourceMappingURL=tokenDefinition.d.ts.map