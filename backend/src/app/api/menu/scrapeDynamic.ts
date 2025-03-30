import { chromium } from 'playwright';
import * as cheerio from 'cheerio';
import { classifyMenuItem } from './classifyMenuItem';

export async function scrapeDynamic(url: string): Promise<string[]> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await autoScroll(page);
    const html = await page.content();
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
        const text = $(el).text().replace(/\s+/g, ' ').trim();
        if (text.length > 2 && text.length <= 100) {
          items.add(text);
        }
      });
    }

    const filteredItems: string[] = [];
    for (const text of items) {
      const result = await classifyMenuItem(text);
      if (result.classification === 'menu' || (result.classification === 'maybe' && result.confidence >= 0.75)) {
        filteredItems.push(text);
      }
    }

    return filteredItems;
  } catch (error) {
    console.error(`❌ Failed to dynamically scrape menu from ${url}:`, error);
    return [];
  } finally {
    await browser.close();
  }
}

async function autoScroll(page: any) {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let totalHeight = 0;
      const distance = 200;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 200);
    });
  });
}
