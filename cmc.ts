import axios from 'axios';
import * as cheerio from 'cheerio';

// Types for scraped data
interface CryptoData {
  rank: number;
  name: string;
  symbol: string;
  price: number;
  change1h: number | null;
  change24h: number | null;
  change7d: number | null;
  volume24h: number;
  marketCap: number;
  circulatingSupply: number | null;
}

interface GlobalData {
  totalMarketCap: number;
  totalVolume24h: number;
  btcDominance: number;
  ethDominance: number;
  activeCryptocurrencies: number;
}

class CoinMarketCapScraper {
  private baseUrl = 'https://coinmarketcap.com';
  private headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
  };

  private parseNumber(str: string): number {
    if (!str || str === '--' || str === 'N/A') return 0;
    
    // Remove currency symbols and commas
    const cleaned = str.replace(/[$,\s]/g, '');
    
    // Handle suffixes (K, M, B, T)
    const suffixes: { [key: string]: number } = {
      'K': 1000,
      'M': 1000000,
      'B': 1000000000,
      'T': 1000000000000
    };
    
    const lastChar = cleaned.slice(-1).toUpperCase();
    if (suffixes[lastChar]) {
      return parseFloat(cleaned.slice(0, -1)) * suffixes[lastChar];
    }
    
    return parseFloat(cleaned) || 0;
  }

  private parsePercentage(str: string): number | null {
    if (!str || str === '--' || str === 'N/A') return null;
    return parseFloat(str.replace('%', '')) || null;
  }

  async getTopCryptocurrencies(limit: number = 100): Promise<CryptoData[]> {
    try {
      console.log(`🔍 Scraping top ${limit} cryptocurrencies...`);
      
      const response = await axios.get(`${this.baseUrl}/`, {
        headers: this.headers,
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      const cryptos: CryptoData[] = [];

      // Find the cryptocurrency table
      $('table tbody tr').each((index, element) => {
        if (index >= limit) return false;

        const $row = $(element);
        const $cells = $row.find('td');

        if ($cells.length < 8) return true;

        try {
          // Extract data from each cell
          const rank = parseInt($cells.eq(1).text().trim()) || index + 1;
          
          // Name and symbol are usually in the same cell
          const nameCell = $cells.eq(2);
          const name = nameCell.find('a').text().trim() || nameCell.text().trim();
          const symbol = nameCell.find('span').text().trim() || 
                        name.split(' ').pop() || 'UNKNOWN';

          // Price
          const priceText = $cells.eq(3).text().trim();
          const price = this.parseNumber(priceText);

          // 1h change
          const change1hText = $cells.eq(4).text().trim();
          const change1h = this.parsePercentage(change1hText);

          // 24h change  
          const change24hText = $cells.eq(5).text().trim();
          const change24h = this.parsePercentage(change24hText);

          // 7d change
          const change7dText = $cells.eq(6).text().trim();
          const change7d = this.parsePercentage(change7dText);

          // Market cap
          const marketCapText = $cells.eq(7).text().trim();
          const marketCap = this.parseNumber(marketCapText);

          // Volume 24h
          const volume24hText = $cells.eq(8).text().trim();
          const volume24h = this.parseNumber(volume24hText);

          // Circulating supply
          const supplyText = $cells.eq(9).text().trim();
          const circulatingSupply = this.parseNumber(supplyText);

          if (name && price > 0) {
            cryptos.push({
              rank,
              name,
              symbol,
              price,
              change1h,
              change24h,
              change7d,
              volume24h,
              marketCap,
              circulatingSupply
            });
          }
        } catch (error) {
          console.warn(`Error parsing row ${index}:`, error);
        }
      });

      console.log(`✅ Successfully scraped ${cryptos.length} cryptocurrencies`);
      return cryptos;

    } catch (error) {
      console.error('Error scraping CoinMarketCap:', error);
      throw new Error('Failed to scrape cryptocurrency data');
    }
  }

  async getGlobalData(): Promise<GlobalData> {
    try {
      console.log('🌍 Scraping global market data...');
      
      const response = await axios.get(`${this.baseUrl}/charts/`, {
        headers: this.headers,
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      
      // Try to find global stats - structure may vary
      const globalData: GlobalData = {
        totalMarketCap: 0,
        totalVolume24h: 0,
        btcDominance: 0,
        ethDominance: 0,
        activeCryptocurrencies: 0
      };

      // Look for market cap and volume in various places
      $('.global-stats, .stats-container, [data-role="stats"]').each((_, element) => {
        const $element = $(element);
        const text = $element.text();
        
        // Extract numbers from text
        const marketCapMatch = text.match(/market cap[:\s]*\$?([0-9.,]+[KMBT]?)/i);
        if (marketCapMatch) {
          globalData.totalMarketCap = this.parseNumber(marketCapMatch[1]);
        }

        const volumeMatch = text.match(/volume[:\s]*\$?([0-9.,]+[KMBT]?)/i);
        if (volumeMatch) {
          globalData.totalVolume24h = this.parseNumber(volumeMatch[1]);
        }

        const btcDominanceMatch = text.match(/btc dominance[:\s]*([0-9.]+)%/i);
        if (btcDominanceMatch) {
          globalData.btcDominance = parseFloat(btcDominanceMatch[1]);
        }
      });

      return globalData;

    } catch (error) {
      console.error('Error scraping global data:', error);
      return {
        totalMarketCap: 0,
        totalVolume24h: 0,
        btcDominance: 0,
        ethDominance: 0,
        activeCryptocurrencies: 0
      };
    }
  }

  async searchCryptocurrency(symbol: string): Promise<CryptoData | null> {
    try {
      console.log(`🔍 Searching for ${symbol}...`);
      
      const response = await axios.get(`${this.baseUrl}/currencies/${symbol.toLowerCase()}/`, {
        headers: this.headers,
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      
      // Extract data from the currency page
      const name = $('h1, .nameHeader').first().text().trim();
      const priceText = $('.priceValue, [data-role="price"]').first().text().trim();
      const price = this.parseNumber(priceText);

      // Look for percentage changes
      const change24hText = $('.sc-16r8icm-0, [data-direction]').first().text().trim();
      const change24h = this.parsePercentage(change24hText);

      if (name && price > 0) {
        return {
          rank: 0,
          name,
          symbol: symbol.toUpperCase(),
          price,
          change1h: null,
          change24h,
          change7d: null,
          volume24h: 0,
          marketCap: 0,
          circulatingSupply: null
        };
      }

      return null;

    } catch (error) {
      console.error(`Error searching for ${symbol}:`, error);
      return null;
    }
  }

  // Alternative method using CoinMarketCap's API-like endpoints (no auth required)
  async getDataFromAPI(): Promise<CryptoData[]> {
    try {
      console.log('🔍 Trying alternative data source...');
      
      // Some endpoints might work without authentication
      const response = await axios.get(`${this.baseUrl}/api/v1/cryptocurrency/listings/latest`, {
        headers: this.headers,
        params: {
          start: 1,
          limit: 100,
          convert: 'USD'
        },
        timeout: 10000
      });

      if (response.data && response.data.data) {
        return response.data.data.map((item: any) => ({
          rank: item.cmc_rank || 0,
          name: item.name || 'Unknown',
          symbol: item.symbol || 'UNKNOWN',
          price: item.quote?.USD?.price || 0,
          change1h: item.quote?.USD?.percent_change_1h || null,
          change24h: item.quote?.USD?.percent_change_24h || null,
          change7d: item.quote?.USD?.percent_change_7d || null,
          volume24h: item.quote?.USD?.volume_24h || 0,
          marketCap: item.quote?.USD?.market_cap || 0,
          circulatingSupply: item.circulating_supply || null
        }));
      }

      return [];

    } catch (error) {
      console.log('Alternative API method failed, falling back to scraping...');
      return this.getTopCryptocurrencies();
    }
  }

  static formatCryptoData(cryptos: CryptoData[]): void {
    console.log('\n📊 CRYPTOCURRENCY MARKET DATA\n');
    console.log('Rank | Symbol | Name | Price | 1h % | 24h % | 7d % | Volume 24h | Market Cap');
    console.log(''.padEnd(100, '-'));

    cryptos.forEach(crypto => {
      const row = [
        crypto.rank.toString().padStart(4),
        crypto.symbol.padEnd(6),
        crypto.name.slice(0, 15).padEnd(15),
        `$${crypto.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`.padStart(12),
        crypto.change1h ? `${crypto.change1h.toFixed(2)}%`.padStart(7) : 'N/A'.padStart(7),
        crypto.change24h ? `${crypto.change24h.toFixed(2)}%`.padStart(7) : 'N/A'.padStart(7),
        crypto.change7d ? `${crypto.change7d.toFixed(2)}%`.padStart(7) : 'N/A'.padStart(7),
        `$${(crypto.volume24h / 1000000).toFixed(2)}M`.padStart(10),
        `$${(crypto.marketCap / 1000000000).toFixed(2)}B`.padStart(12)
      ].join(' | ');
      console.log(row);
    });
  }
}

// Usage example
async function main() {
  const scraper = new CoinMarketCapScraper();

  try {
    // Get top cryptocurrencies
    const topCryptos = await scraper.getTopCryptocurrencies(20);
    CoinMarketCapScraper.formatCryptoData(topCryptos);

    // Get global market data
    const globalData = await scraper.getGlobalData();
    console.log('\n🌍 GLOBAL MARKET DATA:');
    console.log(`Total Market Cap: $${(globalData.totalMarketCap / 1e12).toFixed(2)}T`);
    console.log(`24h Volume: $${(globalData.totalVolume24h / 1e9).toFixed(2)}B`);
    console.log(`BTC Dominance: ${globalData.btcDominance.toFixed(2)}%`);

    // Search for specific cryptocurrency
    const bitcoin = await scraper.searchCryptocurrency('bitcoin');
    if (bitcoin) {
      console.log(`\n₿ Bitcoin: $${bitcoin.price.toLocaleString()} (${bitcoin.change24h?.toFixed(2)}% 24h)`);
    }

  } catch (error) {
    console.error('Error in main:', error);
  }
}

// Export for use in other modules
export { CoinMarketCapScraper, CryptoData, GlobalData };

// Run example if this file is executed directly
if (require.main === module) {
  main();
}