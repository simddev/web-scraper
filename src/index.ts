import { crawlSiteAsync } from "./crawl.js";
import { writeJSONReport } from "./report.js";

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 3) {
    console.error("Error: usage: npm run start <URL> <maxConcurrency> <maxPages>");
    process.exit(1);
  }

  if (args.length > 3) {
    console.error("Error: too many arguments");
    process.exit(1);
  }

  const [baseURL, rawConcurrency, rawMaxPages] = args;
  const maxConcurrency = parseInt(rawConcurrency, 10);
  const maxPages = parseInt(rawMaxPages, 10);

  if (isNaN(maxConcurrency) || maxConcurrency < 1) {
    console.error("Error: maxConcurrency must be a positive integer");
    process.exit(1);
  }

  if (isNaN(maxPages) || maxPages < 1) {
    console.error("Error: maxPages must be a positive integer");
    process.exit(1);
  }

  console.log(`Starting crawler at ${baseURL}`);

  const pages = await crawlSiteAsync(baseURL, maxConcurrency, maxPages);

  console.log("Finished crawling.");
  const firstPage = Object.values(pages)[0];
  if (firstPage) {
    console.log(
      `First page record: ${firstPage["url"]} - ${firstPage["heading"]}`,
    );
  }

  writeJSONReport(pages, "report.json");
}

main();
