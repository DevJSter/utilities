import axios from 'axios';
import { writeFileSync, readFileSync, existsSync } from 'fs';

interface PriceEntry {
  timestamp: number;
  date: string;
  symbol: string;
  price: number;
  change24h: number | null;
  volume: number;
  marketCap: number;
}

class SimplePriceStorage {
  private fileName: string;

  constructor(fileName: string = 'prices.json') {
    this.fileName = fileName;
  }

  // Load existing prices from file
  private loadPrices(): PriceEntry[] {
    try {
      if (existsSync(this.fileName)) {
        const data = readFileSync(this.fileName, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.log('📄 Creating new price file...');
    }
    return [];
  }

  // Save prices to file
  private savePrices(prices: PriceEntry[]): void {
    try {
      writeFileSync(this.fileName, JSON.stringify(prices, null, 2));
      console.log(`💾 Saved ${prices.length} entries to ${this.fileName}`);
    } catch (error) {
      console.error('❌ Error saving prices:', error);
    }
  }

  // Fetch prices from CoinGecko and append to file
  async fetchAndStore(coinIds: string[]): Promise<void> {
    try {
      console.log(`🔍 Fetching prices for: ${coinIds.join(', ')}`);

      const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
        params: {
          ids: coinIds.join(','),
          vs_currencies: 'usd',
          include_24hr_change: true,
          include_24hr_vol: true,
          include_market_cap: true
        }
      });

      const currentTime = Date.now();
      const currentDate = new Date().toISOString();

      // Load existing prices
      const existingPrices = this.loadPrices();

      // Create new entries
      const newEntries: PriceEntry[] = [];
      
      for (const [coinId, data] of Object.entries(response.data)) {
        const coinData = data as any;
        newEntries.push({
          timestamp: currentTime,
          date: currentDate,
          symbol: coinId.toUpperCase(),
          price: coinData.usd || 0,
          change24h: coinData.usd_24h_change || null,
          volume: coinData.usd_24h_vol || 0,
          marketCap: coinData.usd_market_cap || 0
        });
      }

      // Append new entries to existing ones
      const allPrices = [...existingPrices, ...newEntries];

      // Save back to file
      this.savePrices(allPrices);

      // Display what we just added
      console.log('\n📊 NEW ENTRIES ADDED:');
      newEntries.forEach(entry => {
        const changeColor = (entry.change24h || 0) >= 0 ? '🟢' : '🔴';
        console.log(`${changeColor} ${entry.symbol}: $${entry.price.toFixed(4)} (${entry.change24h?.toFixed(2) || 'N/A'}%)`);
      });

      console.log(`\n📈 Total entries in file: ${allPrices.length}`);

    } catch (error) {
      console.error('❌ Error fetching prices:', error);
    }
  }

  // Get the latest price for each symbol
  getLatestPrices(): { [symbol: string]: PriceEntry } {
    const prices = this.loadPrices();
    const latest: { [symbol: string]: PriceEntry } = {};

    prices.forEach(price => {
      if (!latest[price.symbol] || price.timestamp > latest[price.symbol].timestamp) {
        latest[price.symbol] = price;
      }
    });

    return latest;
  }

  // Get price history for a specific symbol
  getPriceHistory(symbol: string, limit: number = 10): PriceEntry[] {
    const prices = this.loadPrices();
    return prices
      .filter(p => p.symbol.toUpperCase() === symbol.toUpperCase())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  // Display file statistics
  showStats(): void {
    const prices = this.loadPrices();
    
    if (prices.length === 0) {
      console.log('📄 No price data found');
      return;
    }

    const symbols = [...new Set(prices.map(p => p.symbol))];
    const latest = Math.max(...prices.map(p => p.timestamp));
    const oldest = Math.min(...prices.map(p => p.timestamp));

    console.log('\n📊 PRICE FILE STATISTICS');
    console.log('========================');
    console.log(`File: ${this.fileName}`);
    console.log(`Total entries: ${prices.length}`);
    console.log(`Symbols tracked: ${symbols.length} (${symbols.join(', ')})`);
    console.log(`Date range: ${new Date(oldest).toLocaleDateString()} to ${new Date(latest).toLocaleDateString()}`);
    
    // Count per symbol
    const counts: { [key: string]: number } = {};
    prices.forEach(p => counts[p.symbol] = (counts[p.symbol] || 0) + 1);
    
    console.log('\nEntries per symbol:');
    Object.entries(counts).forEach(([symbol, count]) => {
      console.log(`  ${symbol}: ${count}`);
    });
  }
}

// Quick usage functions
async function logPricesNow(coins: string[] = ['bitcoin', 'ethereum', 'cardano']) {
  const storage = new SimplePriceStorage();
  await storage.fetchAndStore(coins);
}

async function startPriceLogging(coins: string[], intervalMinutes: number = 5) {
  const storage = new SimplePriceStorage();
  
  console.log(`🚀 Starting automatic price logging...`);
  console.log(`⏰ Interval: ${intervalMinutes} minutes`);
  console.log(`💰 Coins: ${coins.join(', ')}\n`);

  // Log immediately
  await storage.fetchAndStore(coins);

  // Set up recurring logging
  setInterval(async () => {
    await storage.fetchAndStore(coins);
  }, intervalMinutes * 60 * 1000);
}

// Example usage
async function main() {
  const storage = new SimplePriceStorage('my-crypto-prices.json');

  // Popular cryptocurrencies (use CoinGecko IDs)
  const coins = [
    'bitcoin',
    'ethereum', 
    'cardano',
    'polkadot',
    'chainlink',
    'solana',
    'avalanche-2',
    'polygon',
    'uniswap'
  ];

  try {
    // Fetch and store current prices
    await storage.fetchAndStore(coins);

    // Show what's in the file
    storage.showStats();

    // Display latest prices
    console.log('\n💰 LATEST PRICES:');
    const latest = storage.getLatestPrices();
    Object.values(latest).forEach(price => {
      const time = new Date(price.timestamp).toLocaleTimeString();
      console.log(`${price.symbol}: $${price.price.toFixed(4)} at ${time}`);
    });

    // Show price history for Bitcoin
    console.log('\n₿ BITCOIN PRICE HISTORY (last 5 entries):');
    const btcHistory = storage.getPriceHistory('BITCOIN', 5);
    btcHistory.forEach((entry, index) => {
      const time = new Date(entry.timestamp).toLocaleString();
      console.log(`${index + 1}. $${entry.price.toFixed(2)} - ${time}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Export for use in other files
export { SimplePriceStorage, PriceEntry };

// Uncomment to run different examples:
if (require.main === module) {
  // Single price fetch
  main();
  
  // Continuous logging every 10 minutes
  // startPriceLogging(['bitcoin', 'ethereum', 'cardano'], 10);
}