import axios from 'axios';
import * as cheerio from 'cheerio';
import { classifyMenuItem } from './classifyMenuItem';

export async function scrapeStatic(url: string): Promise<string[]> {
  try {
    const { data: html } = await axios.get(url);
    const $ = cheerio.load(html);

    const selectors = [
      '.menu-item',
      '.item-name',
      '.dish-name',
      '.food-name',
      '.menu_section_item_name',
      '.menu__item__title',
      '.dishTitle',
      'h2', 'h3', 'h4', 'li', 'p', 'strong'
    ];

    const items = new Set<string>();

    for (const selector of selectors) {
      $(selector).each((_, el) => {
        const rawText = $(el).text().trim();
        items.add(rawText);
      });
    }

    const filtered: string[] = [];

    for (const item of items) {
      const { confidence, classification } = await classifyMenuItem(item);
      if (classification === 'menu' || (classification === 'maybe' && confidence >= 0.75)) {
        filtered.push(item);
      }
    }

    return filtered;
  } catch (err) {
    console.error(`❌ Failed to scrape menu from ${url}:`, err);
    return [];
  }
}