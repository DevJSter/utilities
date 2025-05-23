import axios, { AxiosResponse } from 'axios';

// Types for CoinMarketCap API responses
interface CMCQuote {
  price: number;
  volume_24h: number;
  volume_change_24h: number;
  percent_change_1h: number;
  percent_change_24h: number;
  percent_change_7d: number;
  percent_change_30d: number;
  percent_change_60d: number;
  percent_change_90d: number;
  market_cap: number;
  market_cap_dominance: number;
  fully_diluted_market_cap: number;
  tvl: number | null;
  last_updated: string;
}

interface CMCCryptocurrency {
  id: number;
  name: string;
  symbol: string;
  slug: string;
  num_market_pairs: number;
  date_added: string;
  tags: string[];
  max_supply: number | null;
  circulating_supply: number;
  total_supply: number;
  platform: any;
  cmc_rank: number;
  self_reported_circulating_supply: number | null;
  self_reported_market_cap: number | null;
  tvl_ratio: number | null;
  last_updated: string;
  quote: {
    [currency: string]: CMCQuote;
  };
}

interface CMCListingsResponse {
  status: {
    timestamp: string;
    error_code: number;
    error_message: string | null;
    elapsed: number;
    credit_count: number;
    notice: string | null;
  };
  data: CMCCryptocurrency[];
}

interface CMCGlobalMetrics {
  active_cryptocurrencies: number;
  total_cryptocurrencies: number;
  active_market_pairs: number;
  active_exchanges: number;
  total_exchanges: number;
  eth_dominance: number;
  btc_dominance: number;
  eth_dominance_yesterday: number;
  btc_dominance_yesterday: number;
  eth_dominance_24h_percentage_change: number;
  btc_dominance_24h_percentage_change: number;
  defi_volume_24h: number;
  defi_volume_24h_reported: number;
  defi_market_cap: number;
  defi_24h_percentage_change: number;
  stablecoin_volume_24h: number;
  stablecoin_volume_24h_reported: number;
  stablecoin_market_cap: number;
  stablecoin_24h_percentage_change: number;
  derivatives_volume_24h: number;
  derivatives_volume_24h_reported: number;
  derivatives_24h_percentage_change: number;
  quote: {
    [currency: string]: {
      total_market_cap: number;
      total_volume_24h: number;
      total_volume_24h_reported: number;
      altcoin_volume_24h: number;
      altcoin_volume_24h_reported: number;
      altcoin_market_cap: number;
      defi_volume_24h: number;
      defi_volume_24h_reported: number;
      defi_24h_percentage_change: number;
      defi_market_cap: number;
      stablecoin_volume_24h: number;
      stablecoin_volume_24h_reported: number;
      stablecoin_24h_percentage_change: number;
      stablecoin_market_cap: number;
      derivatives_volume_24h: number;
      derivatives_volume_24h_reported: number;
      derivatives_24h_percentage_change: number;
      total_market_cap_yesterday: number;
      total_volume_24h_yesterday: number;
      total_market_cap_yesterday_percentage_change: number;
      total_volume_24h_yesterday_percentage_change: number;
      last_updated: string;
    };
  };
}

class CoinMarketCapAPI {
  private apiKey: string;
  private baseUrl: string = 'https://pro-api.coinmarketcap.com/v1';
  private sandboxUrl: string = 'https://sandbox-api.coinmarketcap.com/v1';

  constructor(apiKey: string, useSandbox: boolean = false) {
    this.apiKey = apiKey;
    if (useSandbox) {
      this.baseUrl = this.sandboxUrl;
    }
  }

  private async makeRequest<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
    try {
      const response: AxiosResponse<T> = await axios.get(`${this.baseUrl}${endpoint}`, {
        headers: {
          'X-CMC_PRO_API_KEY': this.apiKey,
          'Accept': 'application/json',
          'Accept-Encoding': 'deflate, gzip'
        },
        params
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`CoinMarketCap API Error: ${error.response?.data?.status?.error_message || error.message}`);
      }
      throw error;
    }
  }

  // Get latest cryptocurrency listings with price changes, volume, etc.
  async getLatestListings(
    start: number = 1,
    limit: number = 100,
    convert: string = 'USD',
    sort: 'market_cap' | 'name' | 'symbol' | 'date_added' | 'market_cap_strict' | 'price' | 'circulating_supply' | 'total_supply' | 'max_supply' | 'num_market_pairs' | 'volume_24h' | 'percent_change_1h' | 'percent_change_24h' | 'percent_change_7d' | 'market_cap_by_total_supply_strict' | 'volume_7d' | 'volume_30d' = 'market_cap'
  ): Promise<CMCListingsResponse> {
    return this.makeRequest<CMCListingsResponse>('/cryptocurrency/listings/latest', {
      start,
      limit,
      convert,
      sort
    });
  }

  // Get quotes for specific cryptocurrencies by symbol or ID
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

  // Get global cryptocurrency market metrics
  async getGlobalMetrics(convert: string = 'USD'): Promise<{ data: CMCGlobalMetrics }> {
    return this.makeRequest('/global-metrics/quotes/latest', { convert });
  }

  // Get trending cryptocurrencies
  async getTrending(limit: number = 10): Promise<any> {
    return this.makeRequest('/cryptocurrency/trending/latest', { limit });
  }

  // Get cryptocurrency metadata (description, logo, etc.)
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

  // Helper method to format and display token data
  static formatTokenData(tokens: CMCCryptocurrency[], currency: string = 'USD'): void {
    console.log('\n📊 Cryptocurrency Market Data\n');
    console.log('Rank | Symbol | Name | Price | 1h % | 24h % | 7d % | Volume 24h | Market Cap');
    console.log(''.padEnd(100, '-'));

    tokens.forEach(token => {
      const quote = token.quote[currency];
      const row = [
        token.cmc_rank.toString().padStart(4),
        token.symbol.padEnd(6),
        token.name.slice(0, 15).padEnd(15),
        `$${quote.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`.padStart(12),
        `${quote.percent_change_1h?.toFixed(2) || 'N/A'}%`.padStart(7),
        `${quote.percent_change_24h?.toFixed(2) || 'N/A'}%`.padStart(7),
        `${quote.percent_change_7d?.toFixed(2) || 'N/A'}%`.padStart(7),
        `$${(quote.volume_24h / 1000000).toFixed(2)}M`.padStart(10),
        `$${(quote.market_cap / 1000000000).toFixed(2)}B`.padStart(12)
      ].join(' | ');
      console.log(row);
    });
  }
}

// Usage example
async function main() {
  // Get your API key from https://coinmarketcap.com/api/
  const apiKey = process.env.CMC_API_KEY || 'YOUR_API_KEY_HERE';
  const cmc = new CoinMarketCapAPI(apiKey);

  try {
    // Get top 20 cryptocurrencies
    console.log('Fetching top 20 cryptocurrencies...');
    const listings = await cmc.getLatestListings(1, 20, 'USD', 'market_cap');
    
    CoinMarketCapAPI.formatTokenData(listings.data);

    // Get specific tokens by symbol
    console.log('\n\nFetching specific tokens (BTC, ETH, ADA)...');
    const specificTokens = await cmc.getQuotes(['BTC', 'ETH', 'ADA']);
    
    Object.values(specificTokens.data).forEach((token: any) => {
      const quote = token.quote.USD;
      console.log(`\n${token.name} (${token.symbol}):`);
      console.log(`  Price: $${quote.price.toLocaleString()}`);
      console.log(`  1h Change: ${quote.percent_change_1h?.toFixed(2) || 'N/A'}%`);
      console.log(`  24h Change: ${quote.percent_change_24h?.toFixed(2) || 'N/A'}%`);
      console.log(`  24h Volume: $${(quote.volume_24h / 1000000).toFixed(2)}M`);
      console.log(`  Market Cap: $${(quote.market_cap / 1000000000).toFixed(2)}B`);
    });

    // Get global market metrics
    console.log('\n\nFetching global market metrics...');
    const globalMetrics = await cmc.getGlobalMetrics();
    const globalQuote = globalMetrics.data.quote.USD;
    
    console.log('\n🌍 Global Cryptocurrency Market:');
    console.log(`  Total Market Cap: $${(globalQuote.total_market_cap / 1000000000000).toFixed(2)}T`);
    console.log(`  24h Volume: $${(globalQuote.total_volume_24h / 1000000000).toFixed(2)}B`);
    console.log(`  BTC Dominance: ${globalMetrics.data.btc_dominance.toFixed(2)}%`);
    console.log(`  ETH Dominance: ${globalMetrics.data.eth_dominance.toFixed(2)}%`);
    console.log(`  Active Cryptocurrencies: ${globalMetrics.data.active_cryptocurrencies.toLocaleString()}`);

  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

// Export the class for use in other modules
export { CoinMarketCapAPI, CMCCryptocurrency, CMCQuote, CMCListingsResponse };

// Run the example if this file is executed directly
if (require.main === module) {
  main();
}