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
    const BscScanYummyUrl = process.env.BS_SCAN_PAGE;

    const statsPagePromise = this.getYummyStatsPage();
    const bscScanPagePromise = this.getBscScanYummyPage(BscScanYummyUrl);

    const [yummyStats, yummyBscScanPage] = await Promise.all([
      statsPagePromise,
      bscScanPagePromise,
    ]);

    const statsCheerio = cheerio.load(yummyStats);
    const bscScanCheerio = cheerio.load(yummyBscScanPage.data);

    const cap = statsCheerio('h4[aria-label^="Plus"]').text();
    const lastDayChange = statsCheerio('h4:contains("%")').text().trim();
    const price = statsCheerio('h4:contains("$0.")').text();
    const holders = bscScanCheerio('.mr-3').text().split(' ')[0].trim();
    const burnedQuantity = bscScanCheerio(
      '#ContentPlaceHolder1_divFilteredHolderBalance',
    )
      .clone()
      .children()
      .remove()
      .end()
      .text()
      .split(' ')[0]
      .slice(0, -3);

    const burnedQuantityNumber =
      Math.round(parseFloat(burnedQuantity.replace(/,/g, '')) * 100) / 100;

    const SUPPLY = 1000000000000;
    const burnedQuantityPercentage = (
      (burnedQuantityNumber / SUPPLY) *
      100
    ).toFixed(2);

    return {
      cap,
      price,
      lastDayChange,
      holders,
      burnedQuantity: `${burnedQuantity} - ${burnedQuantityPercentage}%`,
    };
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

  async getBscScanYummyPage(url: string) {
    return await this.httpService.get(url).toPromise();
  }
}
