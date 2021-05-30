import * as fs from 'fs';
import * as util from 'util';
import { Update, Ctx, Help, Command } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { ScrapperService } from './scrapper/scrapper.service';
import * as puppeteer from 'puppeteer';
import * as handlebars from 'handlebars';

import { Storage } from '@google-cloud/storage';
const readFile = util.promisify(fs.readFile);

@Update()
export class YummyBot {
  firebaseStorage: Storage;
  constructor(private readonly scrapper: ScrapperService) {
    this.firebaseStorage = new Storage({
      projectId: process.env.GOOGLE_STORAGE_PROJECT_ID,
      scopes: process.env.GOOGLE_STORAGE_SCOPES,
      credentials: {
        client_email: process.env.GOOGLE_STORAGE_EMAIL,
        private_key: process.env.GOOGLE_STORAGE_PRIVATE_KEY.replace(
          /\\n/gm,
          '\n',
        ),
      },
    });
  }

  @Help()
  async help(@Ctx() ctx: Context) {
    const helpText = await readFile('src/assets/help.text');
    await ctx.replyWithMarkdownV2(helpText.toString());
  }

  @Command('stats')
  async stats(@Ctx() ctx: Context) {
    const { price, cap, lastDayChange, holders } =
      await this.scrapper.getYummyStats();

    const lastDayChangeMessage = lastDayChange.includes('-')
      ? `📉 Last day change - ${lastDayChange}`
      : `📈 Last day change - ${lastDayChange}`;

    await ctx.reply(
      `💰 Price - ${price} \n💸 Market cap - ${cap} \n${lastDayChangeMessage} \n💎 holders - ${holders} `,
    );
  }

  @Command('summary')
  async summary(@Ctx() ctx: Context) {
    const stats = await this.scrapper.getYummyStats();
    const utcDate = new Date().toUTCString();
    const statsCard = await readFile('src/assets/stats-card/card.html');
    const statsTemplate = handlebars.compile(statsCard.toString());
    const statsCardPage = statsTemplate({ ...stats, date: utcDate });

    await this.takeScreenShot(statsCardPage);
    const url = await this.uploadImage();

    await ctx.replyWithPhoto(url);
  }

  @Command('price')
  async hears(@Ctx() ctx: Context) {
    const price = await this.scrapper.getYummyPrice();
    await ctx.reply(`💰 ${price}`);
  }

  async takeScreenShot(html: string) {
    const browser = await puppeteer.launch({
      headless: true,
      ignoreHTTPSErrors: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--single-process',
      ],
    });
    const page = await browser.newPage();
    await page.setContent(html);
    page.setViewport({ width: 488, height: 758, deviceScaleFactor: 2 });
    await page.screenshot({ path: __dirname + 'yummy.png' });

    await page.close();
  }

  async uploadImage() {
    const bucketName = process.env.BUCKET;

    const imageResponse = await this.firebaseStorage
      .bucket(bucketName)
      .upload(__dirname + 'yummy.png');

    const { mediaLink } = imageResponse[imageResponse.length - 1];

    return mediaLink;
  }
}
