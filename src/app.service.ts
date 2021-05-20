import { Update, Ctx, Help, Command } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { ScrapperService } from './scrapper/scrapper.service';
import * as fs from 'fs';
import * as util from 'util';

const readFile = util.promisify(fs.readFile);

@Update()
export class YummyBot {
  constructor(private readonly scrapper: ScrapperService) {}
  @Help()
  async help(@Ctx() ctx: Context) {
    const helpText = await readFile('src/assets/help.text');
    await ctx.replyWithMarkdownV2(helpText.toString());
  }

  @Command('stats')
  async on(@Ctx() ctx: Context) {
    const { price, cap, lastDayChange, holders } =
      await this.scrapper.getYummyStats();

    const lastDayChangeMessage = lastDayChange.includes('-')
      ? `📉 Last day change - ${lastDayChange}`
      : `📈 Last day change - ${lastDayChange}`;

    await ctx.reply(
      `💰 Price - ${price} \n💸 Market cap - ${cap} \n${lastDayChangeMessage} \n💎 holders - ${holders} `,
    );
  }

  @Command('price')
  async hears(@Ctx() ctx: Context) {
    const price = await this.scrapper.getYummyPrice();
    await ctx.reply(`💰 ${price}`);
  }
}
