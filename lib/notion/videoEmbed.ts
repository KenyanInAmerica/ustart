export type VideoProvider = "youtube" | "vimeo" | "loom" | "unknown";

export interface VideoEmbedInfo {
  provider: VideoProvider;
  embedUrl: string | null;
  originalUrl: string;
}

export function detectVideoProvider(url: string): VideoProvider {
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  if (url.includes("vimeo.com")) return "vimeo";
  if (url.includes("loom.com")) return "loom";
  return "unknown";
}

export function getVideoEmbedUrl(url: string): string | null {
  const provider = detectVideoProvider(url);

  if (provider === "youtube") {
    // youtu.be/{id}
    const shortMatch = url.match(/youtu\.be\/([^?&#]+)/);
    if (shortMatch) {
      return `https://www.youtube.com/embed/${shortMatch[1]}?rel=0&modestbranding=1`;
    }
    // youtube.com/watch?v={id}
    const longMatch = url.match(/[?&]v=([^&#]+)/);
    if (longMatch) {
      return `https://www.youtube.com/embed/${longMatch[1]}?rel=0&modestbranding=1`;
    }
    return null;
  }

  if (provider === "vimeo") {
    const match = url.match(/vimeo\.com\/(\d+)/);
    if (match) {
      return `https://player.vimeo.com/video/${match[1]}`;
    }
    return null;
  }

  if (provider === "loom") {
    const match = url.match(/loom\.com\/share\/([^?&#]+)/);
    if (match) {
      return `https://www.loom.com/embed/${match[1]}`;
    }
    return null;
  }

  return null;
}

export function getVideoEmbedInfo(url: string): VideoEmbedInfo {
  return {
    provider: detectVideoProvider(url),
    embedUrl: getVideoEmbedUrl(url),
    originalUrl: url,
  };
}
