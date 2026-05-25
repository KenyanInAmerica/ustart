import { getVideoEmbedUrl } from "@/lib/notion/videoEmbed";

interface VideoEmbedProps {
  url: string;
  title?: string;
}

export function VideoEmbed({ url, title }: VideoEmbedProps) {
  const embedUrl = getVideoEmbedUrl(url);

  if (!embedUrl) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[var(--accent)] hover:underline text-sm"
      >
        Watch video →
      </a>
    );
  }

  return (
    // padding-bottom percentage for 16:9 ratio cannot be expressed as a Tailwind class
    <div className="relative w-full mb-6" style={{ paddingBottom: "56.25%" }}>
      <iframe
        src={embedUrl}
        title={title ?? "Video"}
        className="absolute inset-0 w-full h-full rounded-[var(--radius-md)]"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
