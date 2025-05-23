import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

// Types for price data
interface PriceData {
  timestamp: string;
  datetime: string;
  symbol: string;
  name: string;
  price: number;
  change1h: number | null;
  change24h: number | null;
  change7d: number | null;
  volume24h: number;
  marketCap: number;
  rank?: number;
}

interface StoredPrices {
  lastUpdated: string;
  totalEntries: number;
  symbols: string[];
  prices: PriceData[];
}

class CryptoPriceLogger {
  private filePath: string;
  private apiKey?: string;
  private useCoingecko: boolean;

  constructor(filePath: string = './prices.json', apiKey?: string, useCoingecko: boolean = true) {
    this.filePath = filePath;
    this.apiKey = apiKey;
    this.useCoingecko = useCoingecko;
    
    // Ensure the directory exists
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  // Read existing price data from file
  private readPriceData(): StoredPrices {
    try {
      if (fs.existsSync(this.filePath)) {
        const data = fs.readFileSync(this.filePath, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.warn('⚠️ Could not read existing price data:', error);
    }

    // Return default structure if file doesn't exist or is corrupted
    return {
      lastUpdated: new Date().toISOString(),
      totalEntries: 0,
      symbols: [],
      prices: []
    };
  }

  // Write price data to file
  private writePriceData(data: StoredPrices): void {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf8');
      console.log(`💾 Saved ${data.prices.length} price entries to ${this.filePath}`);
    } catch (error) {
      console.error('❌ Error writing price data:', error);
    }
  }

  // Fetch prices from CoinGecko (free, no API key needed)
  async fetchPricesFromCoinGecko(symbols: string[]): Promise<PriceData[]> {
    try {
      // Convert symbols to CoinGecko IDs (lowercase)
      const ids = symbols.map(s => s.toLowerCase()).join(',');
      
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/coins/markets`,
        {
          params: {
            vs_currency: 'usd',
            ids: ids,
            order: 'market_cap_desc',
            per_page: symbols.length,
            page: 1,
            sparkline: false,
            price_change_percentage: '1h,24h,7d'
          },
          headers: {
            'User-Agent': 'CryptoPriceLogger/1.0'
          },
          timeout: 10000
        }
      );

      const now = new Date();
      return response.data.map((coin: any) => ({
        timestamp: now.getTime().toString(),
        datetime: now.toISOString(),
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        price: coin.current_price || 0,
        change1h: coin.price_change_percentage_1h_in_currency || null,
        change24h: coin.price_change_percentage_24h || null,
        change7d: coin.price_change_percentage_7d_in_currency || null,
        volume24h: coin.total_volume || 0,
        marketCap: coin.market_cap || 0,
        rank: coin.market_cap_rank || null
      }));

    } catch (error) {
      console.error('❌ Error fetching from CoinGecko:', error);
      return [];
    }
  }

  // Fetch prices from CoinMarketCap (requires API key)
  async fetchPricesFromCMC(symbols: string[]): Promise<PriceData[]> {
    if (!this.apiKey) {
      throw new Error('API key required for CoinMarketCap');
    }

    try {
      const response = await axios.get(
        'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest',
        {
          params: {
            symbol: symbols.join(','),
            convert: 'USD'
          },
          headers: {
            'X-CMC_PRO_API_KEY': this.apiKey,
            'Accept': 'application/json'
          },
          timeout: 10000
        }
      );

      const now = new Date();
      const priceData: PriceData[] = [];

      for (const [symbol, data] of Object.entries(response.data.data)) {
        const coin = data as any;
        const quote = coin.quote.USD;

        priceData.push({
          timestamp: now.getTime().toString(),
          datetime: now.toISOString(),
          symbol: symbol,
          name: coin.name,
          price: quote.price || 0,
          change1h: quote.percent_change_1h || null,
          change24h: quote.percent_change_24h || null,
          change7d: quote.percent_change_7d || null,
          volume24h: quote.volume_24h || 0,
          marketCap: quote.market_cap || 0,
          rank: coin.cmc_rank || null
        });
      }

      return priceData;

    } catch (error) {
      console.error('❌ Error fetching from CoinMarketCap:', error);
      return [];
    }
  }

  // Main method to fetch and store prices
  async logPrices(symbols: string[]): Promise<void> {
    console.log(`🔍 Fetching prices for: ${symbols.join(', ')}`);

    let newPrices: PriceData[];

    if (this.useCoingecko) {
      newPrices = await this.fetchPricesFromCoinGecko(symbols);
    } else {
      newPrices = await this.fetchPricesFromCMC(symbols);
    }

    if (newPrices.length === 0) {
      console.log('⚠️ No price data fetched');
      return;
    }

    // Read existing data
    const existingData = this.readPriceData();

    // Append new prices
    existingData.prices.push(...newPrices);
    existingData.lastUpdated = new Date().toISOString();
    existingData.totalEntries = existingData.prices.length;
    
    // Update symbols list (add new ones if not present)
    symbols.forEach(symbol => {
      if (!existingData.symbols.includes(symbol.toUpperCase())) {
        existingData.symbols.push(symbol.toUpperCase());
      }
    });

    // Write back to file
    this.writePriceData(existingData);

    // Display what we just logged
    console.log('\n📊 LOGGED PRICES:');
    newPrices.forEach(price => {
      const changeColor = (price.change24h || 0) >= 0 ? '🟢' : '🔴';
      console.log(
        `${changeColor} ${price.symbol}: $${price.price.toFixed(4)} ` +
        `(${price.change24h?.toFixed(2) || 'N/A'}% 24h) ` +
        `at ${price.datetime.split('T')[1].split('.')[0]}`
      );
    });

    console.log(`\n💾 Total entries in file: ${existingData.totalEntries}`);
  }

  // Get price history for a specific symbol
  getPriceHistory(symbol: string, limit?: number): PriceData[] {
    const data = this.readPriceData();
    const symbolPrices = data.prices
      .filter(p => p.symbol.toUpperCase() === symbol.toUpperCase())
      .sort((a, b) => parseInt(b.timestamp) - parseInt(a.timestamp)); // Most recent first

    return limit ? symbolPrices.slice(0, limit) : symbolPrices;
  }

  // Get latest prices for all symbols
  getLatestPrices(): { [symbol: string]: PriceData } {
    const data = this.readPriceData();
    const latest: { [symbol: string]: PriceData } = {};

    // Group by symbol and get the most recent entry for each
    data.prices.forEach(price => {
      if (!latest[price.symbol] || 
          parseInt(price.timestamp) > parseInt(latest[price.symbol].timestamp)) {
        latest[price.symbol] = price;
      }
    });

    return latest;
  }

  // Display statistics about stored data
  displayStats(): void {
    const data = this.readPriceData();
    
    console.log('\n📈 PRICE DATA STATISTICS');
    console.log('========================');
    console.log(`File: ${this.filePath}`);
    console.log(`Last Updated: ${data.lastUpdated}`);
    console.log(`Total Entries: ${data.totalEntries}`);
    console.log(`Tracked Symbols: ${data.symbols.join(', ')}`);
    
    if (data.prices.length > 0) {
      const oldest = new Date(Math.min(...data.prices.map(p => parseInt(p.timestamp))));
      const newest = new Date(Math.max(...data.prices.map(p => parseInt(p.timestamp))));
      
      console.log(`First Entry: ${oldest.toISOString()}`);
      console.log(`Latest Entry: ${newest.toISOString()}`);
      
      // Count entries per symbol
      const symbolCounts: { [key: string]: number } = {};
      data.prices.forEach(p => {
        symbolCounts[p.symbol] = (symbolCounts[p.symbol] || 0) + 1;
      });
      
      console.log('\nEntries per symbol:');
      Object.entries(symbolCounts)
        .sort(([,a], [,b]) => b - a)
        .forEach(([symbol, count]) => {
          console.log(`  ${symbol}: ${count} entries`);
        });
    }
  }

  // Clean old entries (keep only last N entries per symbol)
  cleanOldEntries(keepPerSymbol: number = 100): void {
    const data = this.readPriceData();
    const cleanedPrices: PriceData[] = [];

    // Group by symbol
    const bySymbol: { [key: string]: PriceData[] } = {};
    data.prices.forEach(price => {
      if (!bySymbol[price.symbol]) bySymbol[price.symbol] = [];
      bySymbol[price.symbol].push(price);
    });

    // Keep only the most recent entries for each symbol
    Object.values(bySymbol).forEach(symbolPrices => {
      const sorted = symbolPrices.sort((a, b) => parseInt(b.timestamp) - parseInt(a.timestamp));
      cleanedPrices.push(...sorted.slice(0, keepPerSymbol));
    });

    const originalCount = data.prices.length;
    data.prices = cleanedPrices;
    data.totalEntries = cleanedPrices.length;
    data.lastUpdated = new Date().toISOString();

    this.writePriceData(data);
    
    console.log(`🧹 Cleaned ${originalCount - cleanedPrices.length} old entries. Kept ${cleanedPrices.length} entries.`);
  }
}

// Usage examples
async function main() {
  // Create logger instance
  // Use CoinGecko (free, no API key needed)
  const logger = new CryptoPriceLogger('./prices.json', undefined, true);
  
  // Or use CoinMarketCap (requires API key)
  // const logger = new CryptoPriceLogger('./prices.json', 'YOUR_CMC_API_KEY', false);

  const symbols = ['bitcoin', 'ethereum', 'cardano', 'polkadot', 'chainlink'];

  try {
    // Log current prices
    await logger.logPrices(symbols);

    // Display statistics
    logger.displayStats();

    // Show latest prices
    console.log('\n💰 LATEST PRICES:');
    const latest = logger.getLatestPrices();
    Object.values(latest).forEach(price => {
      console.log(`${price.symbol}: $${price.price.toFixed(4)} (${price.datetime})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Continuous price monitoring
async function startMonitoring(intervalMinutes: number = 5) {
  const logger = new CryptoPriceLogger('./prices.json');
  const symbols = ['bitcoin', 'ethereum', 'cardano', 'polkadot', 'solana'];

  console.log(`🚀 Starting price monitoring every ${intervalMinutes} minutes...`);
  console.log(`📁 Saving to: ${path.resolve('./prices.json')}\n`);

  // Log prices immediately
  await logger.logPrices(symbols);

  // Set up interval for continuous monitoring
  setInterval(async () => {
    try {
      await logger.logPrices(symbols);
    } catch (error) {
      console.error('❌ Monitoring error:', error);
    }
  }, intervalMinutes * 60 * 1000);
}

// Export for use in other modules
export { CryptoPriceLogger, PriceData, StoredPrices };

// Run if this file is executed directly
if (require.main === module) {
  // Choose what to run:
  main(); // Single run
  // startMonitoring(5); // Continuous monitoring every 5 minutes
}