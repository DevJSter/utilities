 import axios from 'axios';

// Simple price fetcher without complex scraping
class SimplePriceFetcher {
  private headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  };

  // Alternative: Use CoinGecko (no API key required for basic usage)
  async getPricesFromCoinGecko(symbols: string[]) {
    try {
      const ids = symbols.join(',').toLowerCase();
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`,
        { headers: this.headers }
      );
      
      return response.data;
    } catch (error) {
      console.error('CoinGecko error:', error);
      return {};
    }
  }

  // Get top coins from CoinGecko
  async getTopCoinsFromCoinGecko(limit: number = 50) {
    try {
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false&price_change_percentage=1h,24h,7d`,
        { headers: this.headers }
      );
      
      return response.data.map((coin: any) => ({
        rank: coin.market_cap_rank,
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        price: coin.current_price,
        change1h: coin.price_change_percentage_1h_in_currency,
        change24h: coin.price_change_percentage_24h,
        change7d: coin.price_change_percentage_7d_in_currency,
        volume24h: coin.total_volume,
        marketCap: coin.market_cap,
        image: coin.image
      }));
    } catch (error) {
      console.error('Error fetching from CoinGecko:', error);
      return [];
    }
  }

  // Simple CoinMarketCap mobile API (sometimes works without auth)
  async getCMCMobileData() {
    try {
      const response = await axios.get(
        'https://coinmarketcap.com/api/v2/cryptocurrency/quotes/latest?CMC_PRO_API_KEY=UNIFIED-CRYPTOAPI-DEFAULT-API-KEY',
        { 
          headers: this.headers,
          timeout: 5000 
        }
      );
      
      return response.data;
    } catch (error) {
      console.log('CMC mobile API failed, using alternative...');
      return null;
    }
  }

  // Display formatted results
  displayResults(coins: any[]) {
    console.log('\n🚀 CRYPTOCURRENCY PRICES\n');
    console.log('Rank | Symbol | Name | Price | 1h % | 24h % | 7d % | Volume | Market Cap');
    console.log(''.padEnd(95, '-'));

    coins.forEach(coin => {
      const price = coin.price ? `$${coin.price.toFixed(4)}` : 'N/A';
      const change1h = coin.change1h ? `${coin.change1h.toFixed(2)}%` : 'N/A';
      const change24h = coin.change24h ? `${coin.change24h.toFixed(2)}%` : 'N/A';
      const change7d = coin.change7d ? `${coin.change7d.toFixed(2)}%` : 'N/A';
      const volume = coin.volume24h ? `$${(coin.volume24h / 1e6).toFixed(1)}M` : 'N/A';
      const marketCap = coin.marketCap ? `$${(coin.marketCap / 1e9).toFixed(2)}B` : 'N/A';

      console.log(
        `${coin.rank?.toString().padStart(4) || 'N/A'.padStart(4)} | ` +
        `${coin.symbol.padEnd(6)} | ` +
        `${coin.name.slice(0, 12).padEnd(12)} | ` +
        `${price.padStart(10)} | ` +
        `${change1h.padStart(6)} | ` +
        `${change24h.padStart(6)} | ` +
        `${change7d.padStart(6)} | ` +
        `${volume.padStart(8)} | ` +
        `${marketCap.padStart(10)}`
      );
    });
  }

  // Monitor specific coins
  async monitorCoins(symbols: string[]) {
    console.log(`📊 Monitoring: ${symbols.join(', ')}\n`);
    
    // Try CoinGecko first
    const coinGeckoIds = symbols.map(s => s.toLowerCase());
    const prices = await this.getPricesFromCoinGecko(coinGeckoIds);
    
    for (const [id, data] of Object.entries(prices)) {
      const priceData = data as any;
      console.log(`${id.toUpperCase()}:`);
      console.log(`  💰 Price: $${priceData.usd}`);
      console.log(`  📈 24h Change: ${priceData.usd_24h_change?.toFixed(2)}%`);
      console.log(`  💹 24h Volume: $${(priceData.usd_24h_vol / 1e6)?.toFixed(2)}M`);
      console.log('');
    }
  }
}

// Usage examples
async function main() {
  const fetcher = new SimplePriceFetcher();

  try {
    console.log('🔄 Fetching cryptocurrency data...');

    // Get top 20 coins from CoinGecko
    const topCoins = await fetcher.getTopCoinsFromCoinGecko(20);
    if (topCoins.length > 0) {
      fetcher.displayResults(topCoins);
    }

    // Monitor specific coins
    console.log('\n' + '='.repeat(50));
    await fetcher.monitorCoins(['bitcoin', 'ethereum', 'cardano', 'polkadot']);

  } catch (error) {
    console.error('Error:', error);
  }
}

// Quick price check function
async function quickPriceCheck(coinIds: string[]) {
  const fetcher = new SimplePriceFetcher();
  const prices = await fetcher.getPricesFromCoinGecko(coinIds);
  
  console.log('💰 Quick Price Check:');
  for (const [id, data] of Object.entries(prices)) {
    const priceData = data as any;
    console.log(`${id}: $${priceData.usd} (${priceData.usd_24h_change?.toFixed(2)}%)`);
  }
  
  return prices;
}

export { SimplePriceFetcher, quickPriceCheck };

if (require.main === module) {
  main();
}