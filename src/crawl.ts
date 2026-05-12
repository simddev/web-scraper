import { JSDOM } from "jsdom";

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
    urls.push(new URL(href, baseURL).href);
  }
  return urls;
}

export function getImagesFromHTML(html: string, baseURL: string): string[] {
  const dom = new JSDOM(html);
  const imgs = dom.window.document.querySelectorAll("img");
  const urls: string[] = [];
  for (const img of imgs) {
    const src = img.getAttribute("src");
    if (!src) continue;
    urls.push(new URL(src, baseURL).href);
  }
  return urls;
}
