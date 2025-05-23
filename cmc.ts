import axios, { AxiosResponse } from 'axios';

// Types for CoinMarketCap Free API responses
interface CMCQuote {
  price: number;
  volume_24h: number;
  volume_change_24h: number;
  percent_change_1h: number;
  percent_change_24h: number;
  percent_change_7d: number;
  market_cap: number;
  market_cap_dominance?: number;
  last_updated: string;
}

interface CMCCryptocurrency {
  id: number;
  name: string;
  symbol: string;
  slug: string;
  num_market_pairs: number;
  date_added: string;
  max_supply: number | null;
  circulating_supply: number;
  total_supply: number;
  cmc_rank: number;
  last_updated: string;
  quote: {
    [currency: string]: CMCQuote;
  };
}

interface CMCResponse {
  status: {
    timestamp: string;
    error_code: number;
    error_message: string | null;
    elapsed: number;
    credit_count: number;
  };
  data: CMCCryptocurrency[];
}

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

class CoinMarketCapFreeAPI {
  private apiKey: string;
  private baseUrl: string = 'https://pro-api.coinmarketcap.com/v1';
  private callCount: number = 0;
  private monthlyLimit: number = 10000;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async makeRequest<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
    if (this.callCount >= this.monthlyLimit) {
      throw new Error(`Monthly limit of ${this.monthlyLimit} API calls exceeded`);
    }

    try {
      const response: AxiosResponse<T> = await axios.get(`${this.baseUrl}${endpoint}`, {
        headers: {
          'X-CMC_PRO_API_KEY': this.apiKey,
          'Accept': 'application/json',
        },
        params,
        timeout: 10000
      });

      this.callCount++;
      console.log(`✅ API Call ${this.callCount}/${this.monthlyLimit} - Credits used: ${(response.data as any)?.status?.credit_count || 1}`);
      
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMsg = error.response?.data?.status?.error_message || error.message;
        throw new Error(`CoinMarketCap API Error: ${errorMsg}`);
      }
      throw error;
    }
  }

  // ✅ FREE: Get latest cryptocurrency listings (top cryptos by market cap)
  async getLatestListings(
    start: number = 1,
    limit: number = 100,
    convert: string = 'USD'
  ): Promise<CMCResponse> {
    if (limit > 5000) limit = 5000; // API max limit
    
    return this.makeRequest<CMCResponse>('/cryptocurrency/listings/latest', {
      start,
      limit,
      convert
    });
  }

  // ✅ FREE: Get quotes for specific cryptocurrencies
  async getQuotes(
    symbols?: string[],
    ids?: number[],
    convert: string = 'USD'
  ): Promise<any> {
    const params: Record<string, any> = { convert };
    
    if (symbols && symbols.length > 0) {
      params.symbol = symbols.join(',');
    }
    if (ids && ids.length > 0) {
      params.id = ids.join(',');
    }

    return this.makeRequest('/cryptocurrency/quotes/latest', params);
  }

  // ✅ FREE: Get global cryptocurrency market metrics
  async getGlobalMetrics(convert: string = 'USD'): Promise<{ data: CMCGlobalMetrics }> {
    return this.makeRequest('/global-metrics/quotes/latest', { convert });
  }

  // ✅ FREE: Get cryptocurrency metadata
  async getMetadata(symbols?: string[], ids?: number[]): Promise<any> {
    const params: Record<string, any> = {};
    
    if (symbols && symbols.length > 0) {
      params.symbol = symbols.join(',');
    }
    if (ids && ids.length > 0) {
      params.id = ids.join(',');
    }

    return this.makeRequest('/cryptocurrency/info', params);
  }

  // ✅ FREE: Get fiat currency mapping
  async getFiatMap(): Promise<any> {
    return this.makeRequest('/fiat/map');
  }

  // ✅ FREE: Get cryptocurrency ID mapping
  async getCryptocurrencyMap(
    listing_status: 'active' | 'inactive' | 'untracked' = 'active',
    start: number = 1,
    limit: number = 5000
  ): Promise<any> {
    return this.makeRequest('/cryptocurrency/map', {
      listing_status,
      start,
      limit
    });
  }

  // ✅ FREE: Get key info about the API
  async getKeyInfo(): Promise<any> {
    return this.makeRequest('/key/info');
  }

  // Helper: Display current usage
  getUsageStats(): { callsUsed: number; callsRemaining: number; usagePercentage: number } {
    return {
      callsUsed: this.callCount,
      callsRemaining: this.monthlyLimit - this.callCount,
      usagePercentage: (this.callCount / this.monthlyLimit) * 100
    };
  }

  // Helper: Format and display cryptocurrency data
  static formatCryptoData(cryptos: CMCCryptocurrency[], currency: string = 'USD'): void {
    console.log('\n📊 CRYPTOCURRENCY MARKET DATA\n');
    console.log('Rank | Symbol | Name | Price | 1h % | 24h % | 7d % | Volume 24h | Market Cap');
    console.log(''.padEnd(100, '-'));

    cryptos.forEach(crypto => {
      const quote = crypto.quote[currency];
      
      const rank = crypto.cmc_rank.toString().padStart(4);
      const symbol = crypto.symbol.padEnd(6);
      const name = crypto.name.slice(0, 15).padEnd(15);
      const price = `$${quote.price.toLocaleString(undefined, { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: quote.price < 1 ? 6 : 2 
      })}`.padStart(12);
      const change1h = `${quote.percent_change_1h?.toFixed(2) || 'N/A'}%`.padStart(7);
      const change24h = `${quote.percent_change_24h?.toFixed(2) || 'N/A'}%`.padStart(7);
      const change7d = `${quote.percent_change_7d?.toFixed(2) || 'N/A'}%`.padStart(7);
      const volume = `$${(quote.volume_24h / 1000000).toFixed(2)}M`.padStart(10);
      const marketCap = `$${(quote.market_cap / 1000000000).toFixed(2)}B`.padStart(12);

      console.log(`${rank} | ${symbol} | ${name} | ${price} | ${change1h} | ${change24h} | ${change7d} | ${volume} | ${marketCap}`);
    });
  }

  // Helper: Quick price monitor
  async quickPriceCheck(symbols: string[]): Promise<void> {
    try {
      const data = await this.getQuotes(symbols);
      
      console.log('\n💰 QUICK PRICE CHECK\n');
      
      for (const [symbol, tokenData] of Object.entries(data.data)) {
        const token = tokenData as any;
        const quote = token.quote.USD;
        
        const priceColor = quote.percent_change_24h >= 0 ? '🟢' : '🔴';
        
        console.log(`${priceColor} ${token.name} (${token.symbol}):`);
        console.log(`   Price: $${quote.price.toLocaleString()}`);
        console.log(`   24h: ${quote.percent_change_24h?.toFixed(2)}%`);
        console.log(`   Volume: $${(quote.volume_24h / 1e6).toFixed(2)}M`);
        console.log('');
      }
    } catch (error) {
      console.error('❌ Error fetching prices:', error);
    }
  }
}

// Usage examples with free tier
async function exampleUsage() {
  // Replace with your actual API key from coinmarketcap.com/api
  const API_KEY = '4678cde0-6535-4038-850c-9da1fab2e8c3';
  const cmc = new CoinMarketCapFreeAPI(API_KEY);

  try {
    console.log('🚀 Testing CoinMarketCap Free API...\n');

    // Check API key info
    console.log('📋 Checking API key info...');
    const keyInfo = await cmc.getKeyInfo();
    console.log(`Plan: ${keyInfo.data.plan.name}`);
    console.log(`Credits per month: ${keyInfo.data.plan.credit_limit_monthly}`);
    console.log(`Credits per day: ${keyInfo.data.plan.credit_limit_daily}`);

    // Get top 20 cryptocurrencies
    console.log('\n📈 Fetching top 20 cryptocurrencies...');
    const topCryptos = await cmc.getLatestListings(1, 20);
    CoinMarketCapFreeAPI.formatCryptoData(topCryptos.data);

    // Quick price check for specific coins
    console.log('\n🎯 Checking specific cryptocurrency prices...');
    await cmc.quickPriceCheck(['BTC', 'ETH', 'BNB', 'ADA', 'SOL']);

    // Get global market metrics
    console.log('\n🌍 Global market metrics...');
    const globalData = await cmc.getGlobalMetrics();
    const globalQuote = globalData.data.quote.USD;
    
    console.log(`Total Market Cap: $${(globalQuote.total_market_cap / 1e12).toFixed(2)}T`);
    console.log(`24h Volume: $${(globalQuote.total_volume_24h / 1e9).toFixed(2)}B`);
    console.log(`BTC Dominance: ${globalData.data.btc_dominance.toFixed(2)}%`);
    console.log(`Active Cryptocurrencies: ${globalData.data.active_cryptocurrencies.toLocaleString()}`);

    // Show usage statistics
    const usage = cmc.getUsageStats();
    console.log(`\n📊 API Usage: ${usage.callsUsed}/${10000} (${usage.usagePercentage.toFixed(2)}%)`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Lightweight price tracking function
async function trackPrices(apiKey: string, symbols: string[], intervalMinutes: number = 5) {
  const cmc = new CoinMarketCapFreeAPI(apiKey);
  
  console.log(`🔄 Starting price tracking for: ${symbols.join(', ')}`);
  console.log(`⏰ Update interval: ${intervalMinutes} minutes\n`);

  const track = async () => {
    try {
      await cmc.quickPriceCheck(symbols);
      const usage = cmc.getUsageStats();
      console.log(`📊 API calls used: ${usage.callsUsed}/${usage.callsUsed + usage.callsRemaining}\n`);
    } catch (error) {
      console.error('❌ Tracking error:', error);
    }
  };

  // Initial check
  await track();

  // Set interval for continuous tracking
  setInterval(track, intervalMinutes * 60 * 1000);
}

// Export for use in other modules
export { CoinMarketCapFreeAPI, CMCCryptocurrency, CMCQuote, CMCResponse };

// Run example if executed directly
if (require.main === module) {
  exampleUsage();
}