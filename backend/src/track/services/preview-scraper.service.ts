import { Injectable } from '@nestjs/common';
import { AppLoggerService } from '../../logger/logger.service';
import axios from 'axios';
import * as cheerio from 'cheerio';

interface ElementWithAttribs {
  attribs?: Record<string, string>;
}

const SCRAPE_DELAY_MS = 200;
const SCRAPE_TIMEOUT_MS = 10000;

/**
 * Last resort only: reads the web player's markup, which is fragile and on the
 * wrong side of Spotify's ToS. PreviewLookupService tries iTunes and Deezer first.
 */
@Injectable()
export class PreviewScraperService {
  private readonly logger: AppLoggerService;

  constructor(appLogger: AppLoggerService) {
    this.logger = appLogger.child(PreviewScraperService.name);
  }

  async scrape(trackId: string): Promise<string | null> {
    try {
      await this.delay(SCRAPE_DELAY_MS);

      const response = await axios.get<string>(
        `https://open.spotify.com/track/${trackId}`,
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          timeout: SCRAPE_TIMEOUT_MS,
        },
      );

      const $ = cheerio.load(response.data);
      let previewUrl: string | null = null;

      $('*').each((_, node) => {
        if (previewUrl) {
          return false;
        }
        const el = node as ElementWithAttribs;
        for (const value of Object.values(el.attribs ?? {})) {
          if (value?.includes('p.scdn.co')) {
            previewUrl = value;
            return false;
          }
        }
      });

      return previewUrl;
    } catch (error) {
      this.logger.warn(
        `Failed to scrape preview for track ${trackId}: ${(error as Error).message}`,
      );
      return null;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
