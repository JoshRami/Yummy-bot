import { HttpService, Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { YummyStats } from './interfaces/stats.interface';

@Injectable()
export class ScrapperService {
  constructor(private readonly httpService: HttpService) {}
  async getYummyPrice() {
    const yummyStats = await this.getYummyStatsPage();
    const $ = cheerio.load(yummyStats);

    const price = $('h4:contains("$0.")').text();
    return price;
  }

  async getYummyStats(): Promise<YummyStats> {
    const yummyStatsPromise = this.getYummyStatsPage();
    const yummyBscScanPagePromise = this.getBscScanYummyPage();

    const [yummyStats, yummyBscScanPage] = await Promise.all([
      yummyStatsPromise,
      yummyBscScanPagePromise,
    ]);

    const yummyBscScanPageHtml = yummyBscScanPage.data;

    const statsCheerio = cheerio.load(yummyStats);
    const bscScanCheerio = cheerio.load(yummyBscScanPageHtml);

    const cap = statsCheerio('h4[aria-label^="Plus"]').text();
    const lastDayChange = statsCheerio('h4:contains("%")').text();
    const price = statsCheerio('h4:contains("$0.")').text();

    const holders = bscScanCheerio('.mr-3').text().split(' ')[0].trim();

    return { cap, price, lastDayChange, holders };
  }

  async getYummyStatsPage() {
    const YummyStatsEndpoint = process.env.POOCOIN_API_ENDPOINT;
    const scrapingAntKey = process.env.SCRAPING_ANT_KEY;

    const {
      data: { content },
    } = await this.httpService
      .get(YummyStatsEndpoint, { headers: { 'x-api-key': scrapingAntKey } })
      .toPromise();

    return content;
  }

  async getBscScanYummyPage() {
    const BscScanYummyUrl = process.env.BS_SCAN_PAGE;
    return await this.httpService.get(BscScanYummyUrl).toPromise();
  }
}
