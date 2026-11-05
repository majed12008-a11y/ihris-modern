/**
 * تصدير نتائج التقارير: CSV (UTF-8 مع BOM) و PDF (نسخة أساسية).
 *
 * ملاحظة PDF: pdfkit لا يدعم تشكيل الحروف العربية (Arabic shaping)، لذا قد
 * تظهر النصوص العربية متقطعة/معكوسة في PDF. هذا مقيّد ومُوثَّق في ADR-004.
 */
import PDFDocument from "pdfkit";

export interface ExportResult {
  columns: string[];
  rows: Record<string, unknown>[];
}

const CSV_BOM = "\uFEFF";

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function escapeCsv(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function toCsv({ columns, rows }: ExportResult): Buffer {
  const header = columns.map(escapeCsv).join(",");
  const body = rows.map((row) =>
    columns.map((c) => escapeCsv(formatCell(row[c]))).join(",")
  );
  const csv = CSV_BOM + [header, ...body].join("\r\n") + "\r\n";
  return Buffer.from(csv, "utf8");
}

export function toPdf({ columns, rows }: ExportResult, title: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        layout: "landscape",
        margin: 36,
        info: { Title: title },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      doc.fontSize(16).text(title, { align: "left" });
      doc.moveDown(0.5);
      doc
        .fontSize(9)
        .text(`${rows.length} rows — generated ${new Date().toISOString()}`, {
          align: "left",
        });
      doc.moveDown(0.5);

      if (rows.length === 0) {
        doc.fontSize(11).text("(no rows)");
      } else {
        const usableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
        const colWidth = usableWidth / columns.length;
        const lineHeight = 14;

        const writeRow = (values: string[], isHeader: boolean) => {
          const y = doc.y;
          if (y + lineHeight > doc.page.height - doc.page.margins.bottom) {
            doc.addPage();
          }
          const startY = doc.y;
          values.forEach((value, i) => {
            doc
              .fontSize(8)
              .text(value, doc.page.margins.left + i * colWidth, startY, {
                width: colWidth - 4,
                height: lineHeight,
                ellipsis: true,
                lineBreak: false,
              });
          });
          if (isHeader) {
            doc
              .moveTo(doc.page.margins.left, startY + lineHeight - 2)
              .lineTo(doc.page.margins.left + usableWidth, startY + lineHeight - 2)
              .strokeColor("#999999")
              .stroke();
          }
          doc.y = startY + lineHeight;
        };

        writeRow(columns, true);
        for (const row of rows) {
          writeRow(columns.map((c) => formatCell(row[c])), false);
        }
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
