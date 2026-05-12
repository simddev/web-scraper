import { crawlPage } from "./crawl.js";

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error("Error: no base URL provided");
    process.exit(1);
  }

  if (args.length > 1) {
    console.error("Error: too many arguments");
    process.exit(1);
  }

  const baseURL = args[0];
  console.log(`Starting crawler at ${baseURL}`);

  const pages = await crawlPage(baseURL);
  console.log(pages);
}

main();
