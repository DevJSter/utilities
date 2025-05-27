interface PriceEntry {
    timestamp: number;
    date: string;
    symbol: string;
    price: number;
    change24h: number | null;
    volume: number;
    marketCap: number;
}
declare class SimplePriceStorage {
    private fileName;
    constructor(fileName?: string);
    private loadPrices;
    private savePrices;
    fetchAndStore(coinIds: string[]): Promise<void>;
    getLatestPrices(): {
        [symbol: string]: PriceEntry;
    };
    getPriceHistory(symbol: string, limit?: number): PriceEntry[];
    showStats(): void;
}
export { SimplePriceStorage, PriceEntry };
//# sourceMappingURL=pricefetcher.d.ts.map