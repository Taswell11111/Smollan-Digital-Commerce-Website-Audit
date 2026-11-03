import * as cheerio from 'cheerio';

export interface ParsedCrawlerHtml {
  $: cheerio.CheerioAPI;
  $clean: cheerio.CheerioAPI;
  visibleText: string;
  bodyText: string;
}

export function parseCrawlerHtml(html: string): ParsedCrawlerHtml {
  const $ = cheerio.load(html);
  const $clean = cheerio.load(html);
  $clean('script, style, noscript, svg').remove();
  const visibleText = $clean('body').text() || '';
  const bodyText = visibleText.toLowerCase();
  return { $, $clean, visibleText, bodyText };
}
