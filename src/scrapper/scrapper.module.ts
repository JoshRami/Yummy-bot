import { HttpModule, Module } from '@nestjs/common';
import { ScrapperService } from './scrapper.service';

@Module({
  imports: [HttpModule],
  providers: [ScrapperService],
  exports: [ScrapperService],
})
export class ScrapperModule {}
