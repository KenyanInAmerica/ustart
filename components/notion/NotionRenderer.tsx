import type { BlockObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { NotionBlock } from "./NotionBlock";

interface NotionRendererProps {
  blocks: BlockObjectResponse[];
  className?: string;
  toggleChildren?: Map<string, BlockObjectResponse[]>;
}

export function NotionRenderer({ blocks, className, toggleChildren }: NotionRendererProps) {
  const rendered: React.ReactNode[] = [];
  let i = 0;

  while (i < blocks.length) {
    const block = blocks[i];

    // Group consecutive bulleted list items into a single <ul>
    if (block.type === "bulleted_list_item") {
      const items: BlockObjectResponse[] = [];
      while (i < blocks.length && blocks[i].type === "bulleted_list_item") {
        items.push(blocks[i]);
        i++;
      }
      rendered.push(
        <ul key={`ul-${items[0].id}`} className="list-disc pl-4 mb-3">
          {items.map((b) => (
            <NotionBlock key={b.id} block={b} toggleChildren={toggleChildren} />
          ))}
        </ul>
      );
      continue;
    }

    // Group consecutive numbered list items into a single <ol>
    if (block.type === "numbered_list_item") {
      const items: BlockObjectResponse[] = [];
      while (i < blocks.length && blocks[i].type === "numbered_list_item") {
        items.push(blocks[i]);
        i++;
      }
      rendered.push(
        <ol key={`ol-${items[0].id}`} className="list-decimal pl-4 mb-3">
          {items.map((b) => (
            <NotionBlock key={b.id} block={b} toggleChildren={toggleChildren} />
          ))}
        </ol>
      );
      continue;
    }

    rendered.push(
      <NotionBlock key={block.id} block={block} toggleChildren={toggleChildren} />
    );
    i++;
  }

  return <div className={className}>{rendered}</div>;
}
