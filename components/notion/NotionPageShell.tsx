import type { BlockObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { NotionRenderer } from "./NotionRenderer";

interface NotionPageShellProps {
  title: string;
  blocks: BlockObjectResponse[];
  children?: React.ReactNode;
}

export function NotionPageShell({
  title,
  blocks,
  children,
}: NotionPageShellProps) {
  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="font-primary font-bold text-2xl text-[var(--text)]">
          {title}
        </h1>
      </div>
      {children}
      <NotionRenderer blocks={blocks} />
    </div>
  );
}
