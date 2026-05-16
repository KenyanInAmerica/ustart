import type { RichTextItemResponse } from "@notionhq/client/build/src/api-endpoints";

interface NotionRichTextProps {
  richText: RichTextItemResponse[];
}

// Maps Notion annotation colors to Tailwind text utilities
function colorClass(color: string): string {
  const map: Record<string, string> = {
    gray: "text-gray-500",
    gray_background: "bg-gray-100",
    brown: "text-amber-800",
    brown_background: "bg-amber-50",
    orange: "text-orange-500",
    orange_background: "bg-orange-50",
    yellow: "text-yellow-500",
    yellow_background: "bg-yellow-50",
    green: "text-green-600",
    green_background: "bg-green-50",
    blue: "text-blue-500",
    blue_background: "bg-blue-50",
    purple: "text-purple-500",
    purple_background: "bg-purple-50",
    pink: "text-pink-500",
    pink_background: "bg-pink-50",
    red: "text-red-500",
    red_background: "bg-red-50",
  };
  return map[color] ?? "";
}

export function NotionRichText({ richText }: NotionRichTextProps) {
  return (
    <>
      {richText.map((item, i) => {
        const { annotations, plain_text, href } = item;
        const classes = [
          annotations.bold ? "font-bold" : "",
          annotations.italic ? "italic" : "",
          annotations.strikethrough ? "line-through" : "",
          annotations.underline ? "underline" : "",
          annotations.code
            ? "font-mono bg-[var(--bg-subtle)] px-1 rounded text-sm text-[var(--accent)]"
            : "",
          annotations.color !== "default" ? colorClass(annotations.color) : "",
        ]
          .filter(Boolean)
          .join(" ");

        const content = classes ? (
          <span key={i} className={classes}>
            {plain_text}
          </span>
        ) : (
          <span key={i}>{plain_text}</span>
        );

        if (href) {
          return (
            <a
              key={i}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent)] underline hover:text-[var(--accent-hover)]"
            >
              {plain_text}
            </a>
          );
        }

        return content;
      })}
    </>
  );
}
