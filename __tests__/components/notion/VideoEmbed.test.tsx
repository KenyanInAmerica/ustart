import { render, screen } from "@testing-library/react";
import { VideoEmbed } from "@/components/notion/VideoEmbed";

describe("VideoEmbed", () => {
  it("renders an iframe for a recognised YouTube URL", () => {
    render(<VideoEmbed url="https://www.youtube.com/watch?v=dQw4w9WgXcQ" title="Test video" />);
    const iframe = screen.getByTitle("Test video");
    expect(iframe.tagName).toBe("IFRAME");
    expect(iframe).toHaveAttribute(
      "src",
      "https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1"
    );
  });

  it("uses default title 'Video' when title is omitted", () => {
    render(<VideoEmbed url="https://vimeo.com/123456789" />);
    expect(screen.getByTitle("Video").tagName).toBe("IFRAME");
  });

  it("renders an iframe for a Loom share URL", () => {
    render(<VideoEmbed url="https://www.loom.com/share/abc123" title="Loom video" />);
    const iframe = screen.getByTitle("Loom video");
    expect(iframe).toHaveAttribute("src", "https://www.loom.com/embed/abc123");
  });

  it("renders a plain link for an unrecognised URL", () => {
    render(<VideoEmbed url="https://example.com/video" />);
    const link = screen.getByRole("link", { name: /watch video/i });
    expect(link).toHaveAttribute("href", "https://example.com/video");
    expect(link).toHaveAttribute("target", "_blank");
    expect(screen.queryByTitle("Video")).not.toBeInTheDocument();
  });

  it("renders a plain link when the YouTube URL has no video id", () => {
    render(<VideoEmbed url="https://www.youtube.com/channel/abc" />);
    expect(screen.getByRole("link", { name: /watch video/i })).toBeInTheDocument();
  });
});
