import { describe, it, expect } from "vitest";
import { normalizeURL, getHeadingFromHTML, getFirstParagraphFromHTML } from "./crawl.js";

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

describe("getHeadingFromHTML", () => {
  it("returns the h1 text content", () => {
    const html = `<html><body><h1>Test Title</h1></body></html>`;
    expect(getHeadingFromHTML(html)).toEqual("Test Title");
  });

  it("falls back to h2 when no h1 is present", () => {
    const html = `<html><body><h2>Sub Title</h2><p>Some text.</p></body></html>`;
    expect(getHeadingFromHTML(html)).toEqual("Sub Title");
  });

  it("prefers h1 over h2 when both are present", () => {
    const html = `<html><body><h1>Main</h1><h2>Secondary</h2></body></html>`;
    expect(getHeadingFromHTML(html)).toEqual("Main");
  });

  it("returns empty string when neither h1 nor h2 is present", () => {
    const html = `<html><body><p>No heading here.</p></body></html>`;
    expect(getHeadingFromHTML(html)).toEqual("");
  });
});

describe("getFirstParagraphFromHTML", () => {
  it("returns the text content of the first p tag", () => {
    const html = `<html><body><p>Hello world.</p><p>Second.</p></body></html>`;
    expect(getFirstParagraphFromHTML(html)).toEqual("Hello world.");
  });

  it("prefers the first p inside main over p outside main", () => {
    const html = `
      <html><body>
        <p>Outside paragraph.</p>
        <main>
          <p>Main paragraph.</p>
        </main>
      </body></html>
    `;
    expect(getFirstParagraphFromHTML(html)).toEqual("Main paragraph.");
  });

  it("falls back to first p in body when there is no main", () => {
    const html = `<html><body><p>Only paragraph.</p></body></html>`;
    expect(getFirstParagraphFromHTML(html)).toEqual("Only paragraph.");
  });

  it("returns empty string when no p tag is found", () => {
    const html = `<html><body><h1>Just a heading</h1></body></html>`;
    expect(getFirstParagraphFromHTML(html)).toEqual("");
  });
});
