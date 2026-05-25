/** @jest-environment node */

import {
  detectVideoProvider,
  getVideoEmbedUrl,
  getVideoEmbedInfo,
} from "../../../lib/notion/videoEmbed";

describe("detectVideoProvider", () => {
  it("identifies youtube.com URLs", () => {
    expect(detectVideoProvider("https://www.youtube.com/watch?v=abc123")).toBe("youtube");
  });

  it("identifies youtu.be short URLs", () => {
    expect(detectVideoProvider("https://youtu.be/abc123")).toBe("youtube");
  });

  it("identifies vimeo.com URLs", () => {
    expect(detectVideoProvider("https://vimeo.com/123456789")).toBe("vimeo");
  });

  it("identifies loom.com URLs", () => {
    expect(detectVideoProvider("https://www.loom.com/share/abc123")).toBe("loom");
  });

  it("returns unknown for unrecognised URLs", () => {
    expect(detectVideoProvider("https://example.com/video")).toBe("unknown");
    expect(detectVideoProvider("https://dailymotion.com/video/abc")).toBe("unknown");
  });
});

describe("getVideoEmbedUrl", () => {
  it("converts a youtube.com watch URL", () => {
    const result = getVideoEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    expect(result).toBe("https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1");
  });

  it("converts a youtu.be short URL", () => {
    const result = getVideoEmbedUrl("https://youtu.be/dQw4w9WgXcQ");
    expect(result).toBe("https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1");
  });

  it("converts a YouTube URL with extra query params", () => {
    const result = getVideoEmbedUrl(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s"
    );
    expect(result).toBe("https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1");
  });

  it("converts a vimeo URL", () => {
    const result = getVideoEmbedUrl("https://vimeo.com/123456789");
    expect(result).toBe("https://player.vimeo.com/video/123456789");
  });

  it("converts a loom share URL", () => {
    const result = getVideoEmbedUrl("https://www.loom.com/share/abc123def456");
    expect(result).toBe("https://www.loom.com/embed/abc123def456");
  });

  it("returns null for an unknown provider", () => {
    expect(getVideoEmbedUrl("https://example.com/video")).toBeNull();
  });

  it("returns null for a youtube URL without a video id", () => {
    expect(getVideoEmbedUrl("https://www.youtube.com/channel/abc")).toBeNull();
  });

  it("returns null for a vimeo URL without a numeric id", () => {
    expect(getVideoEmbedUrl("https://vimeo.com/channels/staffpicks")).toBeNull();
  });

  it("returns null for a loom URL that is not a share link", () => {
    expect(getVideoEmbedUrl("https://www.loom.com/my-videos")).toBeNull();
  });
});

describe("getVideoEmbedInfo", () => {
  it("returns full info for a valid YouTube URL", () => {
    const url = "https://youtu.be/dQw4w9WgXcQ";
    const info = getVideoEmbedInfo(url);
    expect(info.provider).toBe("youtube");
    expect(info.embedUrl).toBe(
      "https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1"
    );
    expect(info.originalUrl).toBe(url);
  });

  it("returns null embedUrl and unknown provider for unrecognised URL", () => {
    const url = "https://example.com/video";
    const info = getVideoEmbedInfo(url);
    expect(info.provider).toBe("unknown");
    expect(info.embedUrl).toBeNull();
    expect(info.originalUrl).toBe(url);
  });
});
