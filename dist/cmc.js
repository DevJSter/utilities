import axios from 'axios';
import { writeFileSync, readFileSync, existsSync } from 'fs';
class CoinMarketCapPriceLogger {
    constructor(apiKey, fileName = 'prices.json') {
        this.baseUrl = 'https://pro-api.coinmarketcap.com/v1';
        this.callCount = 0;
        this.monthlyLimit = 10000;
        this.apiKey = apiKey;
        this.fileName = fileName;
    }
    async makeRequest(endpoint, params = {}) {
        if (this.callCount >= this.monthlyLimit) {
            throw new Error(`Monthly limit of ${this.monthlyLimit} API calls exceeded`);
        }
        try {
            const response = await axios.get(`${this.baseUrl}${endpoint}`, {
                headers: {
                    'X-CMC_PRO_API_KEY': this.apiKey,
                    'Accept': 'application/json',
                },
                params,
                timeout: 10000
            });
            this.callCount++;
            console.log(`✅ API Call ${this.callCount}/${this.monthlyLimit} - Credits used: ${response.data?.status?.credit_count || 1}`);
            return response.data;
        }
        catch (error) {
            if (axios.isAxiosError(error)) {
                const errorMsg = error.response?.data?.status?.error_message || error.message;
                throw new Error(`CoinMarketCap API Error: ${errorMsg}`);
            }
            throw error;
        }
    }
    // Load existing price data from JSON file
    loadPriceData() {
        try {
            if (existsSync(this.fileName)) {
                const data = readFileSync(this.fileName, 'utf8');
                return JSON.parse(data);
            }
        }
        catch (error) {
            console.log('📄 Creating new price storage file...');
        }
        // Return default structure
        return {
            metadata: {
                created: new Date().toISOString(),
                last_updated: new Date().toISOString(),
                total_entries: 0,
                api_calls_made: 0,
                symbols_tracked: []
            },
            prices: []
        };
    }
    // Save price data to JSON file
    savePriceData(data) {
        try {
            writeFileSync(this.fileName, JSON.stringify(data, null, 2));
            console.log(`💾 Saved ${data.prices.length} total entries to ${this.fileName}`);
        }
        catch (error) {
            console.error('❌ Error saving price data:', error);
        }
    }
    // Convert CMC data to storage format
    convertToStorageFormat(cryptos, callId) {
        const now = new Date();
        const timestamp = now.getTime();
        const datetime = now.toISOString();
        return cryptos.map(crypto => ({
            timestamp,
            datetime,
            symbol: crypto.symbol,
            name: crypto.name,
            price: crypto.quote.USD.price,
            change_1h: crypto.quote.USD.percent_change_1h,
            change_24h: crypto.quote.USD.percent_change_24h,
            change_7d: crypto.quote.USD.percent_change_7d,
            volume_24h: crypto.quote.USD.volume_24h,
            market_cap: crypto.quote.USD.market_cap,
            rank: crypto.cmc_rank,
            api_call_id: callId,
            source: 'coinmarketcap'
        }));
    }
    // ✅ FREE: Get latest cryptocurrency listings and store in JSON
    async getLatestListingsAndStore(start = 1, limit = 100, convert = 'USD') {
        if (limit > 5000)
            limit = 5000;
        try {
            console.log(`🔍 Fetching top ${limit} cryptocurrencies from CoinMarketCap...`);
            const response = await this.makeRequest('/cryptocurrency/listings/latest', {
                start,
                limit,
                convert
            });
            // Load existing data
            const storage = this.loadPriceData();
            // Generate unique call ID
            const callId = `cmc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            // Convert to storage format
            const newEntries = this.convertToStorageFormat(response.data, callId);
            // Append new entries
            storage.prices.push(...newEntries);
            // Update metadata
            storage.metadata.last_updated = new Date().toISOString();
            storage.metadata.total_entries = storage.prices.length;
            storage.metadata.api_calls_made++;
            // Update symbols list
            newEntries.forEach(entry => {
                if (!storage.metadata.symbols_tracked.includes(entry.symbol)) {
                    storage.metadata.symbols_tracked.push(entry.symbol);
                }
            });
            // Save to file
            this.savePriceData(storage);
            // Display what we just stored
            console.log('\n📊 STORED ENTRIES:');
            newEntries.slice(0, 10).forEach(entry => {
                const changeColor = (entry.change_24h || 0) >= 0 ? '🟢' : '🔴';
                console.log(`${changeColor} ${entry.symbol}: $${entry.price.toFixed(4)} (${entry.change_24h?.toFixed(2) || 'N/A'}% 24h)`);
            });
            if (newEntries.length > 10) {
                console.log(`... and ${newEntries.length - 10} more entries`);
            }
            console.log(`\n📈 Total entries in file: ${storage.metadata.total_entries}`);
        }
        catch (error) {
            console.error('❌ Error fetching and storing listings:', error);
        }
    }
    // ✅ FREE: Get quotes for specific cryptocurrencies and store
    async getQuotesAndStore(symbols, convert = 'USD') {
        try {
            console.log(`🎯 Fetching quotes for: ${symbols.join(', ')}`);
            const response = await this.makeRequest('/cryptocurrency/quotes/latest', {
                symbol: symbols.join(','),
                convert
            });
            // Convert response to CMCCryptocurrency format
            const cryptos = Object.values(response.data);
            // Load existing data
            const storage = this.loadPriceData();
            // Generate unique call ID
            const callId = `cmc_quotes_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            // Convert to storage format
            const newEntries = this.convertToStorageFormat(cryptos, callId);
            // Append new entries
            storage.prices.push(...newEntries);
            // Update metadata
            storage.metadata.last_updated = new Date().toISOString();
            storage.metadata.total_entries = storage.prices.length;
            storage.metadata.api_calls_made++;
            // Update symbols list
            newEntries.forEach(entry => {
                if (!storage.metadata.symbols_tracked.includes(entry.symbol)) {
                    storage.metadata.symbols_tracked.push(entry.symbol);
                }
            });
            // Save to file
            this.savePriceData(storage);
            // Display what we just stored
            console.log('\n💰 STORED QUOTES:');
            newEntries.forEach(entry => {
                const changeColor = (entry.change_24h || 0) >= 0 ? '🟢' : '🔴';
                console.log(`${changeColor} ${entry.name} (${entry.symbol}): $${entry.price.toLocaleString()}`);
                console.log(`   24h: ${entry.change_24h?.toFixed(2) || 'N/A'}% | Volume: $${(entry.volume_24h / 1e6).toFixed(2)}M`);
                console.log('');
            });
            console.log(`📈 Total entries in file: ${storage.metadata.total_entries}`);
        }
        catch (error) {
            console.error('❌ Error fetching and storing quotes:', error);
        }
    }
    // Get latest price for each symbol from stored data
    getLatestPrices() {
        const storage = this.loadPriceData();
        const latest = {};
        storage.prices.forEach(entry => {
            if (!latest[entry.symbol] || entry.timestamp > latest[entry.symbol].timestamp) {
                latest[entry.symbol] = entry;
            }
        });
        return latest;
    }
    // Get price history for a specific symbol
    getPriceHistory(symbol, limit = 20) {
        const storage = this.loadPriceData();
        return storage.prices
            .filter(entry => entry.symbol.toUpperCase() === symbol.toUpperCase())
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);
    }
    // Display file statistics
    showStorageStats() {
        const storage = this.loadPriceData();
        console.log('\n📊 PRICE STORAGE STATISTICS');
        console.log('============================');
        console.log(`File: ${this.fileName}`);
        console.log(`Created: ${storage.metadata.created}`);
        console.log(`Last Updated: ${storage.metadata.last_updated}`);
        console.log(`Total Entries: ${storage.metadata.total_entries.toLocaleString()}`);
        console.log(`API Calls Made: ${storage.metadata.api_calls_made}`);
        console.log(`Symbols Tracked: ${storage.metadata.symbols_tracked.length} (${storage.metadata.symbols_tracked.join(', ')})`);
        if (storage.prices.length > 0) {
            const oldest = Math.min(...storage.prices.map(p => p.timestamp));
            const newest = Math.max(...storage.prices.map(p => p.timestamp));
            console.log(`Date Range: ${new Date(oldest).toLocaleDateString()} to ${new Date(newest).toLocaleDateString()}`);
            // Count entries per symbol
            const symbolCounts = {};
            storage.prices.forEach(p => {
                symbolCounts[p.symbol] = (symbolCounts[p.symbol] || 0) + 1;
            });
            console.log('\nEntries per symbol:');
            Object.entries(symbolCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 10)
                .forEach(([symbol, count]) => {
                console.log(`  ${symbol}: ${count} entries`);
            });
        }
    }
    // ✅ FREE: Get global cryptocurrency market metrics
    async getGlobalMetrics(convert = 'USD') {
        return this.makeRequest('/global-metrics/quotes/latest', { convert });
    }
    // ✅ FREE: Get key info about the API
    async getKeyInfo() {
        return this.makeRequest('/key/info');
    }
    // Helper: Display current usage
    getUsageStats() {
        return {
            callsUsed: this.callCount,
            callsRemaining: this.monthlyLimit - this.callCount,
            usagePercentage: (this.callCount / this.monthlyLimit) * 100
        };
    }
    // Clean old entries (keep only last N entries per symbol)
    cleanOldEntries(keepPerSymbol = 100) {
        const storage = this.loadPriceData();
        const cleanedPrices = [];
        // Group by symbol
        const bySymbol = {};
        storage.prices.forEach(price => {
            if (!bySymbol[price.symbol])
                bySymbol[price.symbol] = [];
            bySymbol[price.symbol].push(price);
        });
        // Keep only the most recent entries for each symbol
        Object.values(bySymbol).forEach(symbolPrices => {
            const sorted = symbolPrices.sort((a, b) => b.timestamp - a.timestamp);
            cleanedPrices.push(...sorted.slice(0, keepPerSymbol));
        });
        const originalCount = storage.prices.length;
        storage.prices = cleanedPrices;
        storage.metadata.total_entries = cleanedPrices.length;
        storage.metadata.last_updated = new Date().toISOString();
        this.savePriceData(storage);
        console.log(`🧹 Cleaned ${originalCount - cleanedPrices.length} old entries. Kept ${cleanedPrices.length} entries.`);
    }
}
// Usage examples
async function main() {
    // Your actual API key
    const API_KEY = '4678cde0-6535-4038-850c-9da1fab2e8c3';
    const logger = new CoinMarketCapPriceLogger(API_KEY, 'prices.json');
    try {
        console.log('🚀 Starting CoinMarketCap Price Logging...\n');
        // Check API key info
        console.log('📋 Checking API key info...');
        const keyInfo = await logger.getKeyInfo();
        console.log(`Plan: ${keyInfo.data.plan.name}`);
        console.log(`Credits per month: ${keyInfo.data.plan.credit_limit_monthly}`);
        // Get and store top 20 cryptocurrencies
        await logger.getLatestListingsAndStore(1, 20);
        // Get and store specific cryptocurrency quotes
        await logger.getQuotesAndStore(['BTC', 'ETH', 'BNB', 'ADA', 'SOL']);
        // Show storage statistics
        logger.showStorageStats();
        // Display latest prices from stored data
        console.log('\n💰 LATEST STORED PRICES:');
        const latest = logger.getLatestPrices();
        Object.values(latest).slice(0, 10).forEach(entry => {
            const time = new Date(entry.timestamp).toLocaleTimeString();
            console.log(`${entry.symbol}: $${entry.price.toFixed(4)} at ${time}`);
        });
        // Show Bitcoin price history
        console.log('\n₿ BITCOIN PRICE HISTORY (last 5 entries):');
        const btcHistory = logger.getPriceHistory('BTC', 5);
        btcHistory.forEach((entry, index) => {
            const time = new Date(entry.timestamp).toLocaleString();
            console.log(`${index + 1}. $${entry.price.toFixed(2)} - ${time}`);
        });
        // Show usage statistics
        const usage = logger.getUsageStats();
        console.log(`\n📊 API Usage: ${usage.callsUsed}/${10000} (${usage.usagePercentage.toFixed(2)}%)`);
    }
    catch (error) {
        console.error('❌ Error:', error);
    }
}
// Continuous price monitoring with storage
async function startPriceMonitoring(apiKey, symbols, intervalMinutes = 10, fileName = 'prices.json') {
    const logger = new CoinMarketCapPriceLogger(apiKey, fileName);
    console.log(`🔄 Starting continuous price monitoring...`);
    console.log(`💰 Symbols: ${symbols.join(', ')}`);
    console.log(`⏰ Interval: ${intervalMinutes} minutes`);
    console.log(`📁 File: ${fileName}\n`);
    // Initial fetch
    await logger.getQuotesAndStore(symbols);
    // Set up interval for continuous monitoring
    setInterval(async () => {
        try {
            await logger.getQuotesAndStore(symbols);
            // Show usage stats periodically
            const usage = logger.getUsageStats();
            if (usage.callsUsed % 10 === 0) { // Every 10 calls
                console.log(`📊 API Usage: ${usage.callsUsed}/${usage.callsUsed + usage.callsRemaining}`);
            }
        }
        catch (error) {
            console.error('❌ Monitoring error:', error);
        }
    }, intervalMinutes * 60 * 1000);
}
// Export for use in other modules
export { CoinMarketCapPriceLogger };
// Run if this file is executed directly
if (require.main === module) {
    // Single run
    main();
    // Continuous monitoring (uncomment to use)
    // startPriceMonitoring('4678cde0-6535-4038-850c-9da1fab2e8c3', ['BTC', 'ETH', 'ADA', 'SOL'], 10);
}
//# sourceMappingURL=cmc.js.map