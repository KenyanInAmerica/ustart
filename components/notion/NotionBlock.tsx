import type { BlockObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { slugify } from "@/lib/notion/types";
import { NotionRichText } from "./NotionRichText";
import { NotionRenderer } from "./NotionRenderer";

interface NotionBlockProps {
  block: BlockObjectResponse;
  toggleChildren?: Map<string, BlockObjectResponse[]>;
}

export function NotionBlock({ block, toggleChildren }: NotionBlockProps) {
  switch (block.type) {
    case "paragraph":
      return (
        <p className="text-[var(--text)] text-[15px] leading-relaxed mb-3">
          <NotionRichText richText={block.paragraph.rich_text} />
        </p>
      );

    case "heading_1":
      return (
        <h1 className="font-primary font-bold text-2xl text-[var(--text)] mt-8 mb-4 border-b border-[var(--border)] pb-3">
          <NotionRichText richText={block.heading_1.rich_text} />
        </h1>
      );

    case "heading_2":
      return (
        <h2 className="font-primary font-semibold text-xl text-[var(--text)] mt-6 mb-3">
          <NotionRichText richText={block.heading_2.rich_text} />
        </h2>
      );

    case "heading_3":
      return (
        <h3 className="font-primary font-semibold text-base text-[var(--text)] mt-4 mb-2">
          <NotionRichText richText={block.heading_3.rich_text} />
        </h3>
      );

    case "bulleted_list_item":
      return (
        <li className="text-[var(--text)] text-[15px] leading-relaxed ml-4 mb-1 list-disc list-outside">
          <NotionRichText richText={block.bulleted_list_item.rich_text} />
        </li>
      );

    case "numbered_list_item":
      return (
        <li className="text-[var(--text)] text-[15px] leading-relaxed ml-4 mb-1 list-decimal list-outside">
          <NotionRichText richText={block.numbered_list_item.rich_text} />
        </li>
      );

    case "to_do":
      return (
        <div className="flex items-start gap-3 mb-2">
          <input
            type="checkbox"
            checked={block.to_do.checked ?? false}
            readOnly
            className="mt-1 accent-[var(--accent)]"
          />
          <span
            className={
              block.to_do.checked
                ? "line-through text-[var(--text-muted)]"
                : "text-[var(--text)]"
            }
          >
            <NotionRichText richText={block.to_do.rich_text} />
          </span>
        </div>
      );

    case "toggle": {
      const children = toggleChildren?.get(block.id) ?? [];
      return (
        <details className="mb-3 border border-[var(--border)] rounded-[var(--radius-sm)] overflow-hidden">
          <summary className="px-4 py-3 cursor-pointer font-medium text-[var(--text)] hover:bg-[var(--bg-subtle)] list-none flex items-center gap-2">
            ▶ <NotionRichText richText={block.toggle.rich_text} />
          </summary>
          <div className="px-4 py-3 border-t border-[var(--border)]">
            {children.length > 0 && (
              <NotionRenderer blocks={children} toggleChildren={toggleChildren} />
            )}
          </div>
        </details>
      );
    }

    case "callout": {
      const icon = block.callout.icon;
      const emoji = icon?.type === "emoji" ? icon.emoji : "ℹ️";
      return (
        <div className="flex gap-3 p-4 mb-4 bg-[var(--accent)]/5 border border-[var(--accent)]/20 rounded-[var(--radius-md)]">
          <span className="text-xl flex-shrink-0">{emoji}</span>
          <div className="text-[var(--text)] text-[14px] leading-relaxed">
            <NotionRichText richText={block.callout.rich_text} />
          </div>
        </div>
      );
    }

    case "quote":
      return (
        <blockquote className="border-l-4 border-[var(--accent)] pl-4 py-1 mb-4 text-[var(--text-mid)] italic text-[15px]">
          <NotionRichText richText={block.quote.rich_text} />
        </blockquote>
      );

    case "divider":
      return <hr className="border-[var(--border)] my-6" />;

    case "image": {
      const src =
        block.image.type === "external"
          ? block.image.external.url
          : block.image.file.url;
      const caption =
        block.image.caption?.[0]?.plain_text ?? "Image";
      return (
        // next/image requires known dimensions; use <img> for Notion-hosted assets
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={caption}
          className="rounded-[var(--radius-md)] w-full my-4"
        />
      );
    }

    case "bookmark":
      return (
        <a
          href={block.bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 p-3 mb-3 border border-[var(--border)] rounded-[var(--radius-sm)] hover:bg-[var(--bg-subtle)] text-[var(--accent)] text-sm"
        >
          🔗 {block.bookmark.url}
        </a>
      );

    case "code":
      return (
        <pre className="bg-[var(--bg-subtle)] rounded-[var(--radius-md)] p-4 mb-4 overflow-x-auto">
          <code className="text-[13px] font-mono text-[var(--text)]">
            {block.code.rich_text[0]?.plain_text}
          </code>
        </pre>
      );

    case "child_page": {
      const title = block.child_page.title;
      const slug = slugify(title);
      return (
        <a
          href={`./${slug}`}
          className="flex items-center gap-2 p-3 mb-2 border border-[var(--border)] rounded-[var(--radius-sm)] hover:bg-[var(--bg-subtle)] text-[var(--text)] font-medium"
        >
          📄 {title}
        </a>
      );
    }

    default:
      return null;
  }
}
