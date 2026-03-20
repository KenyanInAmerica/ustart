// Next.js built-in icon generation — served automatically as the site favicon.
// Renders a plain white "U" on the UStart dark background (#05080F).
// Reference: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/app-icons

import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#05080F",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            color: "#FFFFFF",
            fontSize: 22,
            fontWeight: 800,
            lineHeight: 1,
            fontFamily: "sans-serif",
          }}
        >
          U
        </span>
      </div>
    ),
    size
  );
}
