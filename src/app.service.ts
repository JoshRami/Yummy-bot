import { Update, Ctx, Start, Help, Command } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import * as fs from 'fs';
import * as util from 'util';
const readFile = util.promisify(fs.readFile);

@Update()
export class AppUpdate {
  @Help()
  async help(@Ctx() ctx: Context) {
    const helpText = await readFile('src/assets/help.text');
    await ctx.replyWithMarkdownV2(helpText.toString());
  }

  @Command('full_info')
  async on(@Ctx() ctx: Context) {
    await ctx.reply('👍');
  }

  @Command('price')
  async hears(@Ctx() ctx: Context) {
    await ctx.reply('👩');
  }
}
