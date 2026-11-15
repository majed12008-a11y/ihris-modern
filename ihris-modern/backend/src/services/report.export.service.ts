/**
 * تصدير نتائج التقارير إلى CSV و PDF عربي و Excel.
 *
 * PDF: pdfkit لا يُشكّل الحروف العربية بنفسه، لذلك نُطبّع النص قبل الرسم:
 *   1) `ArabicShaper.convertArabic` يحوّل الحروف إلى صورها السياقية (Presentation Forms-B).
 *   2) `bidi-js` يعيد ترتيب النص منطقياً → بصرياً وفق Unicode BiDi (قاعدة RTL).
 *   3) نرسم الناتج بمحاذاة يمين وبأعمدة معكوسة ليطابق القراءة العربية.
 *   الخط المضمَّن: Amiri Regular (رخصة OFL 1.1) في `backend/assets/fonts`.
 *
 * Excel: يُبنى عبر `exceljs` بورقة اتجاهها RTL، ورأس مُثبَّت، وتصفية تلقائية.
 *
 * CSV يبقى كما هو (UTF-8 + BOM) لأن Excel العربي يقرأه مباشرة.
 */
import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import { ArabicShaper } from "arabic-persian-reshaper";
import bidiFactory from "bidi-js";

export interface ExportResult {
  columns: string[];
  rows: Record<string, unknown>[];
}

export interface ExportMetadata {
  /** عنوان التقرير كما عرّفه المستخدم (قد يكون عربياً). */
  title: string;
  /** تسميات بديلة للأعمدة (اختيارية). */
  labels?: Record<string, string>;
  /** وقت التوليد؛ يُمرَّر في الاختبارات لنتائج ثابتة. */
  generatedAt?: Date;
}

const CSV_BOM = "\uFEFF";

/** أعمدة معروفة في تقارير iHRIS — تُعرَض بعنوان عربي في PDF/Excel. */
export const ARABIC_COLUMN_LABELS: Record<string, string> = {
  id: "المعرّف",
  code: "الرمز",
  name: "الاسم",
  firstname: "الاسم الأول",
  othername: "الاسم الأوسط",
  surname: "اللقب",
  gender: "الجنس",
  birthdate: "تاريخ الميلاد",
  birth_date: "تاريخ الميلاد",
  nationalid: "الرقم الوطني",
  national_id: "الرقم الوطني",
  email: "البريد الإلكتروني",
  phone: "الهاتف",
  mobile: "الجوال",
  address: "العنوان",
  notes: "ملاحظات",
  status: "الحالة",
  isactive: "نشط",
  is_active: "نشط",
  createdat: "تاريخ الإنشاء",
  created_at: "تاريخ الإنشاء",
  updatedat: "تاريخ التعديل",
  updated_at: "تاريخ التعديل",
  jobtitle: "المسمى الوظيفي",
  job_title: "المسمى الوظيفي",
  title: "العنوان",
  facility: "المنشأة",
  facilitytype: "نوع المنشأة",
  facility_type: "نوع المنشأة",
  district: "المقاطعة",
  county: "المحافظة",
  region: "المنطقة",
  country: "الدولة",
  positiontype: "نوع الوظيفة",
  position_type: "نوع الوظيفة",
  cadre: "الفئة الوظيفية",
  classification: "التصنيف الوظيفي",
  salarygrade: "درجة الراتب",
  salary_grade: "درجة الراتب",
  salarysource: "مصدر الراتب",
  salary_source: "مصدر الراتب",
  startdate: "تاريخ البداية",
  start_date: "تاريخ البداية",
  enddate: "تاريخ النهاية",
  end_date: "تاريخ النهاية",
  rowcount: "عدد الصفوف",
  row_count: "عدد الصفوف",
};

const bidi = bidiFactory();

/**
 * تحويل النص العربي إلى صوره السياقية (بدون إعادة ترتيب).
 * مُصدَّر للاختبارات.
 */
export function shapeArabic(input: string): string {
  if (!input) return "";
  return ArabicShaper.convertArabic(input);
}

/**
 * تجهيز نص للرسم في PDF: تشكيل عربي ثم إعادة ترتيب BiDi بسياق RTL.
 * الناتج بصري (visual order) وجاهز لرسم pdfkit من اليسار لليمين.
 */
export function rtlText(input: string): string {
  if (!input) return "";
  const shaped = shapeArabic(input);
  try {
    const levels = bidi.getEmbeddingLevels(shaped, "rtl");
    return bidi.getReorderedString(shaped, levels);
  } catch {
    // نص غير متوقع (محارف معزولة) — نكتفي بالتشكيل بدل إسقاط القيمة.
    return shaped;
  }
}

/** تسمية العمود: تسمية صريحة ← قاموس عربي ← اسم العمود كما هو. */
export function columnLabel(column: string, labels?: Record<string, string>): string {
  if (labels && labels[column]) return labels[column];
  return ARABIC_COLUMN_LABELS[column] ?? ARABIC_COLUMN_LABELS[column.toLowerCase()] ?? column;
}

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

/* ------------------------------------------------------------------ */
/* PDF                                                                 */
/* ------------------------------------------------------------------ */

const FONT_RELATIVE = path.join("assets", "fonts", "Amiri-Regular.ttf");
let cachedFontPath: string | null = null;

/**
 * مسار خط Amiri داخل المستودع. نجرّب مسارات عدة لأن `__dirname` يختلف بين
 * تشغيل ts-jest من `src/` وتشغيل البناء من `dist/`.
 */
export function resolveArabicFontPath(): string {
  if (cachedFontPath && fs.existsSync(cachedFontPath)) return cachedFontPath;

  const candidates = [
    path.resolve(__dirname, "..", "..", FONT_RELATIVE), // src/services → backend/assets
    path.resolve(__dirname, "..", "..", "..", FONT_RELATIVE), // dist/src/services → backend/assets
    path.resolve(process.cwd(), FONT_RELATIVE),
    path.resolve(process.cwd(), "..", FONT_RELATIVE),
  ];

  const found = candidates.find((candidate) => fs.existsSync(candidate));
  if (!found) {
    throw new Error(
      `Arabic font not found (${FONT_RELATIVE}). Expected under backend/assets/fonts.`
    );
  }
  cachedFontPath = found;
  return found;
}

export function toPdf(
  { columns, rows }: ExportResult,
  meta: ExportMetadata
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const generatedAt = meta.generatedAt ?? new Date();
      const doc = new PDFDocument({
        size: "A4",
        layout: "landscape",
        margin: 36,
        info: { Title: meta.title, Creator: "iHRIS Suite", CreationDate: generatedAt },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      doc.registerFont("arabic", resolveArabicFontPath());
      doc.font("arabic");

      const margin = doc.page.margins;
      const usableWidth = doc.page.width - margin.left - margin.right;
      const bottomLimit = () => doc.page.height - margin.bottom;

      // العنوان والبيانات الوصفية — محاذاة يمين لأن المستند عربي.
      doc
        .fontSize(16)
        .fillColor("#111827")
        .text(rtlText(meta.title), margin.left, margin.top, {
          width: usableWidth,
          align: "right",
        });
      doc.moveDown(0.25);
      doc
        .fontSize(9)
        .fillColor("#4B5563")
        .text(
          rtlText(`${rows.length} صفاً — أُنشئ في ${generatedAt.toISOString()}`),
          margin.left,
          doc.y,
          { width: usableWidth, align: "right" }
        );
      doc.moveDown(0.5);

      if (rows.length === 0) {
        doc
          .fontSize(11)
          .fillColor("#6B7280")
          .text(rtlText("لا توجد صفوف لعرضها"), margin.left, doc.y, {
            width: usableWidth,
            align: "center",
          });
        doc.end();
        return;
      }

      const columnCount = columns.length;
      const columnWidth = usableWidth / columnCount;
      const rowHeight = 16;
      const labels = columns.map((column) => columnLabel(column, meta.labels));

      // العمود الأول يظهر في أقصى اليمين.
      const xFor = (displayIndex: number) =>
        margin.left + (columnCount - 1 - displayIndex) * columnWidth;

      let y = doc.y;

      const drawCell = (text: string, displayIndex: number, color = "#111827") => {
        doc
          .fontSize(9)
          .fillColor(color)
          .text(rtlText(text), xFor(displayIndex) + 2, y + 2, {
            width: columnWidth - 4,
            height: rowHeight - 4,
            align: "right",
            ellipsis: true,
            lineBreak: false,
          });
      };

      const drawHeader = () => {
        doc.save();
        doc.rect(margin.left, y, usableWidth, rowHeight).fill("#E8EEF7");
        doc.restore();
        labels.forEach((label, index) => drawCell(label, index, "#1F2937"));
        doc.save();
        doc
          .moveTo(margin.left, y + rowHeight)
          .lineTo(margin.left + usableWidth, y + rowHeight)
          .strokeColor("#9CA3AF")
          .lineWidth(0.6)
          .stroke();
        doc.restore();
        y += rowHeight;
      };

      drawHeader();

      rows.forEach((row, rowIndex) => {
        if (y + rowHeight > bottomLimit()) {
          doc.addPage();
          doc.font("arabic");
          y = doc.page.margins.top;
          drawHeader();
        }

        if (rowIndex % 2 === 1) {
          doc.save();
          doc.rect(margin.left, y, usableWidth, rowHeight).fill("#F7F8FA");
          doc.restore();
        }

        columns.forEach((column, index) => {
          drawCell(formatCell(row[column]), index);
        });
        y += rowHeight;
      });

      doc.y = y;
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/* ------------------------------------------------------------------ */
/* Excel                                                               */
/* ------------------------------------------------------------------ */

const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export const XLSX_CONTENT_TYPE = XLSX_MIME;

function sanitizeSheetName(raw: string): string {
  const cleaned = raw.replace(/[[\]:*?/\\]/g, " ").replace(/\s+/g, " ").trim();
  const safe = cleaned || "Report";
  return safe.slice(0, 31);
}

function toCellValue(value: unknown): string | number | boolean | Date | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value;
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function columnWidth(header: string, rows: Record<string, unknown>[], column: string): number {
  const longest = rows.reduce((max, row) => {
    const length = formatCell(row[column]).length;
    return length > max ? length : max;
  }, header.length);
  return Math.min(50, Math.max(8, longest + 2));
}

export async function toXlsx(
  { columns, rows }: ExportResult,
  meta: ExportMetadata
): Promise<Buffer> {
  const generatedAt = meta.generatedAt ?? new Date();
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "iHRIS Suite";
  workbook.created = generatedAt;
  workbook.modified = generatedAt;

  const sheet = workbook.addWorksheet(sanitizeSheetName(meta.title), {
    views: [{ rightToLeft: true, state: "frozen", xSplit: 0, ySplit: 1 }],
    properties: { defaultRowHeight: 18 },
  });

  const labels = columns.map((column) => columnLabel(column, meta.labels));

  sheet.columns = columns.map((column, index) => ({
    header: labels[index],
    key: column,
    width: columnWidth(labels[index], rows, column),
  }));

  const headerRow = sheet.getRow(1);
  headerRow.height = 22;
  headerRow.font = { bold: true, size: 11, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1F6FEB" },
  };
  headerRow.alignment = { horizontal: "right", vertical: "middle", readingOrder: "rtl", wrapText: true };

  rows.forEach((row) => {
    const values = columns.map((column) => toCellValue(row[column]));
    const added = sheet.addRow(values);
    added.alignment = { horizontal: "right", vertical: "middle", readingOrder: "rtl" };
    added.eachCell({ includeEmpty: false }, (cell) => {
      const raw = cell.value;
      if (typeof raw === "number") {
        cell.numFmt = Number.isInteger(raw) ? "0" : "0.00";
      }
    });
  });

  if (columns.length > 0) {
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: columns.length },
    };
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer as ArrayBuffer);
}

/* ------------------------------------------------------------------ */
/* Content-Disposition                                                 */
/* ------------------------------------------------------------------ */

/**
 * ترويسة تنزيل آمنة: اسم ASCII ثابت + اسم جميل مرمّز (RFC 5987).
 * يمنع حقن الترويسات عبر اسم تقرير يحتوي علامات اقتباس أو أسطراً جديدة.
 */
export function buildContentDisposition(
  reportId: number,
  reportName: string,
  extension: string,
  date: Date = new Date()
): string {
  const stamp = date.toISOString().slice(0, 10);
  const fallback = `report-${reportId}.${extension}`;
  const pretty = `${reportName}-${stamp}.${extension}`.replace(/[\r\n]+/g, " ").trim();
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(pretty)}`;
}
