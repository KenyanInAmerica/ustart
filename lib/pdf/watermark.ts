// Server-side PDF watermarking utility.
// Stamps the requesting user's email at the bottom-centre of every page so
// that distributed copies can be traced back to the original recipient.
// Uses pdf-lib — runs in Node.js (Server Actions, Route Handlers) only.

import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

// Embeds the email string horizontally at the bottom-centre of each page.
// Font: Helvetica 10pt, colour: light grey (rgb 0.75), opacity: 0.4.
// Returns the modified PDF as a Uint8Array.
export async function watermarkPdf(
  pdfBytes: Uint8Array,
  email: string
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSize = 10;
  const textWidth = font.widthOfTextAtSize(email, fontSize);

  for (const page of pdfDoc.getPages()) {
    const { width } = page.getSize();
    // Centre horizontally, 16pt from the bottom edge.
    page.drawText(email, {
      x: (width - textWidth) / 2,
      y: 16,
      size: fontSize,
      font,
      color: rgb(0.75, 0.75, 0.75),
      opacity: 0.4,
    });
  }

  return pdfDoc.save();
}
