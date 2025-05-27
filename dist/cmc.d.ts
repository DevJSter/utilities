interface CMCGlobalMetrics {
    active_cryptocurrencies: number;
    total_cryptocurrencies: number;
    active_market_pairs: number;
    active_exchanges: number;
    btc_dominance: number;
    eth_dominance: number;
    quote: {
        [currency: string]: {
            total_market_cap: number;
            total_volume_24h: number;
            last_updated: string;
        };
    };
}
interface StoredPriceEntry {
    timestamp: number;
    datetime: string;
    symbol: string;
    name: string;
    price: number;
    change_1h: number | null;
    change_24h: number | null;
    change_7d: number | null;
    volume_24h: number;
    market_cap: number;
    rank: number;
    api_call_id: string;
    source: 'coinmarketcap';
}
interface PriceStorage {
    metadata: {
        created: string;
        last_updated: string;
        total_entries: number;
        api_calls_made: number;
        symbols_tracked: string[];
    };
    prices: StoredPriceEntry[];
}
declare class CoinMarketCapPriceLogger {
    private apiKey;
    private baseUrl;
    private callCount;
    private monthlyLimit;
    private fileName;
    constructor(apiKey: string, fileName?: string);
    private makeRequest;
    private loadPriceData;
    private savePriceData;
    private convertToStorageFormat;
    getLatestListingsAndStore(start?: number, limit?: number, convert?: string): Promise<void>;
    getQuotesAndStore(symbols: string[], convert?: string): Promise<void>;
    getLatestPrices(): {
        [symbol: string]: StoredPriceEntry;
    };
    getPriceHistory(symbol: string, limit?: number): StoredPriceEntry[];
    showStorageStats(): void;
    getGlobalMetrics(convert?: string): Promise<{
        data: CMCGlobalMetrics;
    }>;
    getKeyInfo(): Promise<any>;
    getUsageStats(): {
        callsUsed: number;
        callsRemaining: number;
        usagePercentage: number;
    };
    cleanOldEntries(keepPerSymbol?: number): void;
}
export { CoinMarketCapPriceLogger, StoredPriceEntry, PriceStorage };
//# sourceMappingURL=cmc.d.ts.map