/* eslint-disable prefer-const */
import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts';
import { ERC20 } from '../types/Factory/ERC20';
import { ERC20NameBytes } from '../types/Factory/ERC20NameBytes';
import { ERC20SymbolBytes } from '../types/Factory/ERC20SymbolBytes';
import { User } from '../types/schema';
import { Factory as FactoryContract } from '../types/templates/Pair/Factory';
import { TokenDefinition } from './tokenDefinition';
export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';
export const FACTORY_ADDRESS = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f';
export let ZERO_BI = BigInt.fromI32(0);
export let ONE_BI = BigInt.fromI32(1);
export let ZERO_BD = BigDecimal.fromString('0');
export let ONE_BD = BigDecimal.fromString('1');
export let BI_18 = BigInt.fromI32(18);
export let factoryContract = FactoryContract.bind(Address.fromString(FACTORY_ADDRESS));
// rebass tokens, dont count in tracked volume
export let UNTRACKED_PAIRS = ['0x9ea3b5b4ec044b70375236a281986106457b20ef'];
export function exponentToBigDecimal(decimals) {
    let bd = BigDecimal.fromString('1');
    for (let i = ZERO_BI; i.lt(decimals); i = i.plus(ONE_BI)) {
        bd = bd.times(BigDecimal.fromString('10'));
    }
    return bd;
}
export function bigDecimalExp18() {
    return BigDecimal.fromString('1000000000000000000');
}
export function convertEthToDecimal(eth) {
    return eth.toBigDecimal().div(exponentToBigDecimal(18));
}
export function convertTokenToDecimal(tokenAmount, exchangeDecimals) {
    if (exchangeDecimals == ZERO_BI) {
        return tokenAmount.toBigDecimal();
    }
    return tokenAmount.toBigDecimal().div(exponentToBigDecimal(exchangeDecimals));
}
export function equalToZero(value) {
    const formattedVal = parseFloat(value.toString());
    const zero = parseFloat(ZERO_BD.toString());
    if (zero == formattedVal) {
        return true;
    }
    return false;
}
export function isNullEthValue(value) {
    return value == '0x0000000000000000000000000000000000000000000000000000000000000001';
}
export function fetchTokenSymbol(tokenAddress) {
    // static definitions overrides
    let staticDefinition = TokenDefinition.fromAddress(tokenAddress);
    if (staticDefinition != null) {
        return staticDefinition.symbol;
    }
    let contract = ERC20.bind(tokenAddress);
    let contractSymbolBytes = ERC20SymbolBytes.bind(tokenAddress);
    // try types string and bytes32 for symbol
    let symbolValue = 'unknown';
    let symbolResult = contract.try_symbol();
    if (symbolResult.reverted) {
        let symbolResultBytes = contractSymbolBytes.try_symbol();
        if (!symbolResultBytes.reverted) {
            // for broken pairs that have no symbol function exposed
            if (!isNullEthValue(symbolResultBytes.value.toHexString())) {
                symbolValue = symbolResultBytes.value.toString();
            }
        }
    }
    else {
        symbolValue = symbolResult.value;
    }
    return symbolValue;
}
export function fetchTokenName(tokenAddress) {
    // static definitions overrides
    let staticDefinition = TokenDefinition.fromAddress(tokenAddress);
    if (staticDefinition != null) {
        return staticDefinition.name;
    }
    let contract = ERC20.bind(tokenAddress);
    let contractNameBytes = ERC20NameBytes.bind(tokenAddress);
    // try types string and bytes32 for name
    let nameValue = 'unknown';
    let nameResult = contract.try_name();
    if (nameResult.reverted) {
        let nameResultBytes = contractNameBytes.try_name();
        if (!nameResultBytes.reverted) {
            // for broken exchanges that have no name function exposed
            if (!isNullEthValue(nameResultBytes.value.toHexString())) {
                nameValue = nameResultBytes.value.toString();
            }
        }
    }
    else {
        nameValue = nameResult.value;
    }
    return nameValue;
}
// HOT FIX: we cant implement try catch for overflow catching so skip total supply parsing on these tokens that overflow
// TODO: find better way to handle overflow
let SKIP_TOTAL_SUPPLY = ['0x0000000000bf2686748e1c0255036e7617e7e8a5'];
export function fetchTokenTotalSupply(tokenAddress) {
    if (SKIP_TOTAL_SUPPLY.includes(tokenAddress.toHexString())) {
        return BigInt.fromI32(0);
    }
    const contract = ERC20.bind(tokenAddress);
    let totalSupplyValue = BigInt.zero();
    const totalSupplyResult = contract.try_totalSupply();
    if (!totalSupplyResult.reverted) {
        totalSupplyValue = totalSupplyResult.value;
    }
    return totalSupplyValue;
}
export function fetchTokenDecimals(tokenAddress) {
    // static definitions overrides
    let staticDefinition = TokenDefinition.fromAddress(tokenAddress);
    if (staticDefinition != null) {
        return staticDefinition.decimals;
    }
    let contract = ERC20.bind(tokenAddress);
    let decimalResult = contract.try_decimals();
    if (!decimalResult.reverted) {
        if (decimalResult.value.lt(BigInt.fromI32(255))) {
            return decimalResult.value;
        }
    }
    return null;
}
export function createUser(address) {
    let user = User.load(address.toHexString());
    if (user === null) {
        user = new User(address.toHexString());
        user.usdSwapped = ZERO_BD;
        user.save();
    }
}
//# sourceMappingURL=helpers.js.map