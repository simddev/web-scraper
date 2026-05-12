import { describe, it, expect } from "vitest";
import { normalizeURL } from "./crawl.js";

describe("normalizeURL", () => {
  it("strips the https scheme", () => {
    expect(normalizeURL("https://www.boot.dev/blog/path")).toBe(
      "www.boot.dev/blog/path"
    );
  });

  it("strips the http scheme", () => {
    expect(normalizeURL("http://www.boot.dev/blog/path")).toBe(
      "www.boot.dev/blog/path"
    );
  });

  it("strips a trailing slash", () => {
    expect(normalizeURL("https://www.boot.dev/blog/path/")).toBe(
      "www.boot.dev/blog/path"
    );
  });

  it("strips both scheme and trailing slash", () => {
    expect(normalizeURL("http://www.boot.dev/blog/path/")).toBe(
      "www.boot.dev/blog/path"
    );
  });

  it("handles a root path with no trailing slash", () => {
    expect(normalizeURL("https://www.boot.dev")).toBe("www.boot.dev");
  });

  it("handles a root path with trailing slash", () => {
    expect(normalizeURL("https://www.boot.dev/")).toBe("www.boot.dev");
  });

  it("preserves query strings", () => {
    expect(normalizeURL("https://www.boot.dev/search?q=hello")).toBe(
      "www.boot.dev/search?q=hello"
    );
  });
});
