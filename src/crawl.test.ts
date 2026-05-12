import { describe, it, expect } from "vitest";
import { normalizeURL, getHeadingFromHTML, getFirstParagraphFromHTML, getURLsFromHTML, getImagesFromHTML, extractPageData } from "./crawl.js";

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

describe("getURLsFromHTML", () => {
  it("returns an absolute URL unchanged", () => {
    const html = `<html><body><a href="https://crawler-test.com/about">About</a></body></html>`;
    expect(getURLsFromHTML(html, "https://crawler-test.com")).toEqual([
      "https://crawler-test.com/about",
    ]);
  });

  it("converts a relative URL to absolute", () => {
    const html = `<html><body><a href="/path/one"><span>Boot.dev</span></a></body></html>`;
    expect(getURLsFromHTML(html, "https://crawler-test.com")).toEqual([
      "https://crawler-test.com/path/one",
    ]);
  });

  it("returns all anchor URLs from the page", () => {
    const html = `
      <html><body>
        <a href="/one">One</a>
        <a href="/two">Two</a>
        <a href="https://other.com/three">Three</a>
      </body></html>
    `;
    expect(getURLsFromHTML(html, "https://crawler-test.com")).toEqual([
      "https://crawler-test.com/one",
      "https://crawler-test.com/two",
      "https://other.com/three",
    ]);
  });

  it("skips anchors with no href attribute", () => {
    const html = `<html><body><a>No href</a><a href="/valid">Valid</a></body></html>`;
    expect(getURLsFromHTML(html, "https://crawler-test.com")).toEqual([
      "https://crawler-test.com/valid",
    ]);
  });
});

describe("getImagesFromHTML", () => {
  it("converts a relative image src to absolute", () => {
    const html = `<html><body><img src="/logo.png" alt="Logo"></body></html>`;
    expect(getImagesFromHTML(html, "https://crawler-test.com")).toEqual([
      "https://crawler-test.com/logo.png",
    ]);
  });

  it("returns an absolute image src unchanged", () => {
    const html = `<html><body><img src="https://cdn.example.com/img.jpg" alt=""></body></html>`;
    expect(getImagesFromHTML(html, "https://crawler-test.com")).toEqual([
      "https://cdn.example.com/img.jpg",
    ]);
  });

  it("returns all image URLs from the page", () => {
    const html = `
      <html><body>
        <img src="/a.png" alt="A">
        <img src="/b.png" alt="B">
      </body></html>
    `;
    expect(getImagesFromHTML(html, "https://crawler-test.com")).toEqual([
      "https://crawler-test.com/a.png",
      "https://crawler-test.com/b.png",
    ]);
  });

  it("skips img tags with no src attribute", () => {
    const html = `<html><body><img alt="no src"><img src="/valid.png" alt=""></body></html>`;
    expect(getImagesFromHTML(html, "https://crawler-test.com")).toEqual([
      "https://crawler-test.com/valid.png",
    ]);
  });
});

describe("extractPageData", () => {
  it("extracts all fields from a full page", () => {
    const html = `
      <html><body>
        <h1>Test Title</h1>
        <p>This is the first paragraph.</p>
        <a href="/link1">Link 1</a>
        <img src="/image1.jpg" alt="Image 1">
      </body></html>
    `;
    expect(extractPageData(html, "https://crawler-test.com")).toEqual({
      url: "https://crawler-test.com",
      heading: "Test Title",
      first_paragraph: "This is the first paragraph.",
      outgoing_links: ["https://crawler-test.com/link1"],
      image_urls: ["https://crawler-test.com/image1.jpg"],
    });
  });

  it("returns empty strings and arrays when page has no content", () => {
    const html = `<html><body></body></html>`;
    expect(extractPageData(html, "https://crawler-test.com")).toEqual({
      url: "https://crawler-test.com",
      heading: "",
      first_paragraph: "",
      outgoing_links: [],
      image_urls: [],
    });
  });

  it("resolves multiple relative links and images", () => {
    const html = `
      <html><body>
        <h2>Sub Heading</h2>
        <main><p>Main content.</p></main>
        <a href="/a">A</a>
        <a href="/b">B</a>
        <img src="/x.png" alt="">
        <img src="/y.png" alt="">
      </body></html>
    `;
    expect(extractPageData(html, "https://example.com")).toEqual({
      url: "https://example.com",
      heading: "Sub Heading",
      first_paragraph: "Main content.",
      outgoing_links: ["https://example.com/a", "https://example.com/b"],
      image_urls: ["https://example.com/x.png", "https://example.com/y.png"],
    });
  });
});
