# Web Crawler

A concurrent web crawler written in TypeScript and Node.js. Point it at any website and it will recursively crawl every internal page up to a configurable limit, extracting headings, paragraphs, links, and images from each page, then write the results to a JSON report.

## Features

- Concurrent crawling with configurable parallelism (powered by [p-limit](https://github.com/sindresorhus/p-limit))
- Configurable page limit to avoid crawling indefinitely
- Stays on the same domain — never follows external links
- Extracts from each page: heading, first paragraph, outgoing links, and image URLs
- Outputs a sorted `report.json` file
- HTML parsing via [jsdom](https://github.com/jsdom/jsdom)
- Fully unit tested with [Vitest](https://vitest.dev)

## Requirements

- Node.js 22.15.0 (via [nvm](https://github.com/nvm-sh/nvm))

## Setup

```bash
nvm use
npm install
```

## Usage

```bash
npm run start <URL> <maxConcurrency> <maxPages>
```

| Argument         | Description                                              |
|------------------|----------------------------------------------------------|
| `URL`            | The root URL to start crawling from                      |
| `maxConcurrency` | Number of pages to fetch in parallel (e.g. `3`)         |
| `maxPages`       | Maximum number of unique pages to crawl (e.g. `50`)     |

### Example

```bash
npm run start https://learnwebscraping.dev/practice/ecommerce/ 3 50
```

This will crawl up to 50 pages starting from the given URL, with 3 concurrent requests at a time, and write results to `report.json`.

### Output

While running, each crawled URL is printed to the console. When finished, a `report.json` file is written to the current directory containing a sorted array of page records:

```json
[
  {
    "url": "https://example.com/about",
    "heading": "About Us",
    "first_paragraph": "We build things.",
    "outgoing_links": ["https://example.com/", "https://example.com/contact"],
    "image_urls": ["https://example.com/logo.png"]
  }
]
```

## Testing

```bash
npm test
```

## Project Structure

```
src/
├── index.ts      — CLI entry point, argument parsing
├── crawl.ts      — Core crawler logic and HTML extraction functions
└── report.ts     — JSON report writer
```
