import { Injectable } from '@nestjs/common';
import { RedisService } from '@redis/redis.service';
import { AppLoggerService } from '../../logger/logger.service';
import axios from 'axios';
import * as cheerio from 'cheerio';

interface ElementWithAttribs {
  attribs?: Record<string, string>;
}

// Cache preview URLs for 7 days (they rarely change)
const CACHE_TTL_SECONDS = 7 * 24 * 60 * 60;
// Cache "not found" results for 1 day (might become available later)
const CACHE_NOT_FOUND_TTL_SECONDS = 24 * 60 * 60;
// Small delay between scrape requests to avoid rate limiting
const SCRAPE_DELAY_MS = 200;

@Injectable()
export class PreviewScraperService {
  private readonly logger: AppLoggerService;

  constructor(
    private readonly redis: RedisService,
    appLogger: AppLoggerService
  ) {
    this.logger = appLogger.child(PreviewScraperService.name);
  }

  /**
   * Get preview URL for a track (checks cache first, scrapes if needed)
   * @param trackId - Spotify track ID
   * @returns Preview URL or null if not found
   */
  async getPreviewUrl(trackId: string): Promise<string | null> {
    const cacheKey = `preview:${trackId}`;

    // Check cache first
    const cached = await this.redis.get(cacheKey);
    if (cached !== null) {
      if (cached === 'NOT_FOUND') {
        this.logger.debug?.(`Cache hit (not found): ${trackId}`);
        return null;
      }
      this.logger.debug?.(`Cache hit: ${trackId}`);
      return cached;
    }

    // Scrape if not cached
    const previewUrl = await this.scrapePreviewUrl(trackId);

    // Cache the result
    if (previewUrl) {
      await this.redis.set(cacheKey, previewUrl, CACHE_TTL_SECONDS);
      this.logger.log(`Cached preview URL for ${trackId}`);
    } else {
      // Cache "not found" to avoid re-scraping tracks without previews
      await this.redis.set(cacheKey, 'NOT_FOUND', CACHE_NOT_FOUND_TTL_SECONDS);
      this.logger.log(`Cached NOT_FOUND for ${trackId}`);
    }

    return previewUrl;
  }

  /**
   * Scrape preview URL from Spotify track page
   */
  private async scrapePreviewUrl(trackId: string): Promise<string | null> {
    try {
      // Small delay to avoid rate limiting
      await this.delay(SCRAPE_DELAY_MS);

      const url = `https://open.spotify.com/track/${trackId}`;
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 10000,
      });

      const $ = cheerio.load(response.data);
      const previewUrls: string[] = [];

      $('*').each((_, node) => {
        const el = node as ElementWithAttribs;
        if (el.attribs) {
          Object.values(el.attribs).forEach((val) => {
            if (val && val.includes('p.scdn.co')) {
              previewUrls.push(val);
            }
          });
        }
      });

      return previewUrls[0] || null;
    } catch (error) {
      this.logger.warn(`Failed to scrape preview for track ${trackId}: ${(error as Error).message}`);
      return null;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Batch scrape preview URLs for multiple tracks
   * @param trackIds - Array of Spotify track IDs
   * @returns Map of trackId -> previewUrl
   */
  async getPreviewUrls(trackIds: string[]): Promise<Map<string, string | null>> {
    const results = new Map<string, string | null>();

    // Process in batches to avoid overwhelming the server
    const batchSize = 5;
    for (let i = 0; i < trackIds.length; i += batchSize) {
      const batch = trackIds.slice(i, i + batchSize);
      const promises = batch.map(async (id) => {
        const url = await this.getPreviewUrl(id);
        results.set(id, url);
      });
      await Promise.all(promises);
    }

    return results;
  }
}
