import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { YummyBot } from './app.service';
import { ScrapperModule } from './scrapper/scrapper.module';
import { registerHelper } from 'handlebars';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: process.env.NODE_ENV === 'production',
    }),
    TelegrafModule.forRootAsync({
      imports: [ConfigModule.forRoot()],
      useFactory: async (configService: ConfigService) => ({
        token: configService.get<string>('TELEGRAM_BOT_TOKEN'),
      }),
      inject: [ConfigService],
    }),
    ScrapperModule,
  ],
  providers: [YummyBot],
})
export class AppModule {
  constructor() {
    registerHelper('contains', (a: string, b: string, opts) => {
      if (a.includes(b)) {
        return opts.fn(this);
      } else {
        return opts.inverse(this);
      }
    });
  }
}
