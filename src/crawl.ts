import { JSDOM } from "jsdom";
import pLimit from "p-limit";

export function normalizeURL(urlString: string): string {
  const url = new URL(urlString);
  const normalized = url.host + url.pathname + url.search;
  return normalized.endsWith("/") ? normalized.slice(0, -1) : normalized;
}

export function getHeadingFromHTML(html: string): string {
  const dom = new JSDOM(html);
  const { document } = dom.window;
  const heading = document.querySelector("h1") ?? document.querySelector("h2");
  return heading?.textContent ?? "";
}

export function getFirstParagraphFromHTML(html: string): string {
  const dom = new JSDOM(html);
  const { document } = dom.window;
  const container = document.querySelector("main") ?? document;
  return container.querySelector("p")?.textContent ?? "";
}

export function getURLsFromHTML(html: string, baseURL: string): string[] {
  const dom = new JSDOM(html);
  const anchors = dom.window.document.querySelectorAll("a");
  const urls: string[] = [];
  for (const anchor of anchors) {
    const href = anchor.getAttribute("href");
    if (!href) continue;
    try {
      urls.push(new URL(href, baseURL).href);
    } catch {
      // skip malformed hrefs
    }
  }
  return urls;
}

export type ExtractedPageData = {
  url: string;
  heading: string;
  first_paragraph: string;
  outgoing_links: string[];
  image_urls: string[];
};

export function extractPageData(html: string, pageURL: string): ExtractedPageData {
  return {
    url: pageURL,
    heading: getHeadingFromHTML(html),
    first_paragraph: getFirstParagraphFromHTML(html),
    outgoing_links: getURLsFromHTML(html, pageURL),
    image_urls: getImagesFromHTML(html, pageURL),
  };
}

export function getImagesFromHTML(html: string, baseURL: string): string[] {
  const dom = new JSDOM(html);
  const imgs = dom.window.document.querySelectorAll("img");
  const urls: string[] = [];
  for (const img of imgs) {
    const src = img.getAttribute("src");
    if (!src) continue;
    try {
      urls.push(new URL(src, baseURL).href);
    } catch {
      // skip malformed srcs
    }
  }
  return urls;
}

class ConcurrentCrawler {
  private baseURL: string;
  private pages: Record<string, number>;
  private limit: ReturnType<typeof pLimit>;
  private maxPages: number;
  private shouldStop: boolean;
  private allTasks: Set<Promise<void>>;

  constructor(baseURL: string, maxConcurrency: number, maxPages: number) {
    this.baseURL = baseURL;
    this.pages = {};
    this.limit = pLimit(maxConcurrency);
    this.maxPages = maxPages;
    this.shouldStop = false;
    this.allTasks = new Set();
  }

  // Synchronous — atomic in JS's single-threaded event loop.
  // Returns true only on the first visit to a URL.
  private addPageVisit(normalizedURL: string): boolean {
    if (this.shouldStop) return false;

    if (this.pages[normalizedURL] !== undefined) {
      this.pages[normalizedURL]++;
      return false;
    }

    if (Object.keys(this.pages).length >= this.maxPages) {
      this.shouldStop = true;
      console.log("Reached maximum number of pages to crawl.");
      return false;
    }

    this.pages[normalizedURL] = 1;
    return true;
  }

  private async getHTML(currentURL: string): Promise<string | null> {
    return await this.limit(async () => {
      try {
        const response = await fetch(currentURL, {
          headers: { "User-Agent": "BootCrawler/1.0" },
        });

        if (response.status >= 400) {
          console.error(`Error: received status ${response.status} from ${currentURL}`);
          return null;
        }

        const contentType = response.headers.get("content-type") ?? "";
        if (!contentType.includes("text/html")) {
          console.error(`Error: expected text/html but got ${contentType} from ${currentURL}`);
          return null;
        }

        return await response.text();
      } catch (err) {
        console.error(`Error fetching ${currentURL}: ${err}`);
        return null;
      }
    });
  }

  private async crawlPage(currentURL: string): Promise<void> {
    if (this.shouldStop) return;

    let current: URL;
    try {
      current = new URL(currentURL);
    } catch {
      return;
    }

    const base = new URL(this.baseURL);
    if (current.hostname !== base.hostname) return;

    const normalized = normalizeURL(currentURL);
    const isNew = this.addPageVisit(normalized);
    if (!isNew) return;

    console.log(`Crawling: ${currentURL}`);

    const html = await this.getHTML(currentURL);
    if (!html) return;

    const links = getURLsFromHTML(html, this.baseURL);
    const promises = links.map((link) => {
      let task: Promise<void>;
      task = this.crawlPage(link).finally(() => this.allTasks.delete(task));
      this.allTasks.add(task);
      return task;
    });
    await Promise.all(promises);
  }

  async crawl(): Promise<Record<string, number>> {
    let task: Promise<void>;
    task = this.crawlPage(this.baseURL).finally(() => this.allTasks.delete(task));
    this.allTasks.add(task);
    await task;
    while (this.allTasks.size > 0) {
      await Promise.all([...this.allTasks]);
    }
    return this.pages;
  }
}

export async function crawlSiteAsync(
  baseURL: string,
  maxConcurrency: number = 5,
  maxPages: number = 100,
): Promise<Record<string, number>> {
  const crawler = new ConcurrentCrawler(baseURL, maxConcurrency, maxPages);
  return await crawler.crawl();
}
