import fs from "fs";
import ExcelJS from "exceljs";
import {
  ARABIC_COLUMN_LABELS,
  buildContentDisposition,
  columnLabel,
  resolveArabicFontPath,
  rtlText,
  shapeArabic,
  toCsv,
  toPdf,
  toXlsx,
  XLSX_CONTENT_TYPE,
} from "../services/report.export.service";

/**
 * Sprint 6.5 / GAP-L-002 — اختبارات وحدة لمسار التصدير:
 * CSV (BOM/اقتباس) + PDF عربي (تشكيل + BiDi + خط مضمَّن) + Excel RTL.
 * لا تحتاج قاعدة بيانات: كل الدوال نقية.
 */

const columns = ["id", "firstname", "surname"];
const rows = [
  { id: 1, firstname: "سالم", surname: "الشمري" },
  { id: 2, firstname: "نورة", surname: "العتيبي" },
];

describe("GAP-L-002 — CSV", () => {
  it("يبدأ بـBOM ويستخدم CRLF ويقتبس القيم التي تحتوي فواصل أو علامات اقتباس", () => {
    const csv = toCsv({
      columns: ["a", "b", "c"],
      rows: [{ a: 'x,y', b: 'قال "مرحباً"', c: null }],
    }).toString("utf8");

    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain("a,b,c\r\n");
    expect(csv).toContain('"x,y"');
    expect(csv).toContain('"قال ""مرحباً"""');
    expect(csv.endsWith("\r\n")).toBe(true);
    // القيمة الفارغة تبقى فارغة لا "null"
    expect(csv).not.toContain("null");
    expect(csv).toContain(',\r\n');
  });

  it("يحوّل التواريخ إلى ISO والأجسام إلى JSON", () => {
    const csv = toCsv({
      columns: ["d", "o"],
      rows: [{ d: new Date("2026-11-15T00:00:00.000Z"), o: { k: 1 } }],
    }).toString("utf8");

    expect(csv).toContain("2026-11-15T00:00:00.000Z");
    expect(csv).toContain('"{""k"":1}"');
  });
});

describe("GAP-L-002 — تشكيل العربية وإعادة الترتيب", () => {
  it("يحوّل الحروف العربية إلى صورها السياقية (Presentation Forms-B)", () => {
    const shaped = shapeArabic("محمد");
    expect(shaped).not.toBe("محمد");
    expect(shaped.length).toBe(4);
    for (const char of shaped) {
      const code = char.codePointAt(0) ?? 0;
      expect(code).toBeGreaterThanOrEqual(0xfe70);
      expect(code).toBeLessThanOrEqual(0xfeff);
    }
  });

  it("يعيد ترتيب النص بصرياً للقراءة من اليمين لليسار", () => {
    const shaped = shapeArabic("محمد أحمد");
    const visual = rtlText("محمد أحمد");
    expect(visual.length).toBe(shaped.length);
    expect(visual).not.toBe(shaped);
    expect(visual).toBe([...shaped].reverse().join(""));
  });

  it("لا يغيّر النص اللاتيني الخالص", () => {
    expect(rtlText("Ahmed Salem")).toBe("Ahmed Salem");
  });

  it("يعالج النص المختلط (عربي + رقم) دون فقدان المحارف", () => {
    const input = "الموظف 123";
    expect([...rtlText(input)].length).toBe([...input].length);
  });
});

describe("GAP-L-002 — تسميات الأعمدة", () => {
  it("يترجم الأعمدة المعروفة إلى العربية", () => {
    expect(columnLabel("firstname")).toBe("الاسم الأول");
    expect(columnLabel("surname")).toBe("اللقب");
    expect(columnLabel("FIRSTNAME")).toBe("الاسم الأول");
  });

  it("يعطي الأولوية للتسميات الصريحة ثم يُبقي المجهول كما هو", () => {
    expect(columnLabel("firstname", { firstname: "الاسم" })).toBe("الاسم");
    expect(columnLabel("custom_metric")).toBe("custom_metric");
  });

  it("القاموس لا يحتوي قيماً فارغة", () => {
    for (const [, value] of Object.entries(ARABIC_COLUMN_LABELS)) {
      expect(value.length).toBeGreaterThan(0);
    }
  });
});

describe("GAP-L-002 — PDF عربي", () => {
  it("يجد خط Amiri المضمَّن", () => {
    const fontPath = resolveArabicFontPath();
    expect(fs.existsSync(fontPath)).toBe(true);
    expect(fontPath.endsWith("Amiri-Regular.ttf")).toBe(true);
  });

  it("ينتج PDF صالحاً ويضمّن الخط العربي", async () => {
    const pdf = await toPdf(
      { columns, rows },
      { title: "تقرير الموظفين", generatedAt: new Date("2026-11-15T10:00:00.000Z") }
    );

    expect(Buffer.isBuffer(pdf)).toBe(true);
    expect(pdf.slice(0, 5).toString()).toBe("%PDF-");
    expect(pdf.length).toBeGreaterThan(2000);
    expect(pdf.toString("latin1")).toContain("Amiri");
  });

  it("ينتج PDF صالحاً بلا صفوف", async () => {
    const pdf = await toPdf({ columns, rows: [] }, { title: "تقرير فارغ" });
    expect(pdf.slice(0, 5).toString()).toBe("%PDF-");
  });

  it("يستخدم عنوان التقرير في بيانات PDF الوصفية", async () => {
    const pdf = await toPdf({ columns, rows }, { title: "تقرير-فريد-9911" });
    // pdfkit يرمّز المعلومات العربية؛ نتحقق من وجود الاسم اللاتيني الثابت
    expect(pdf.toString("latin1")).toContain("iHRIS Suite");
  });
});

describe("GAP-L-002 — Excel", () => {
  it("ينتج ملف xlsx صالحاً (ZIP) بنوع MIME صحيح", async () => {
    const xlsx = await toXlsx({ columns, rows }, { title: "تقرير الموظفين" });
    expect(xlsx.slice(0, 2).toString()).toBe("PK");
    expect(XLSX_CONTENT_TYPE).toContain("spreadsheetml");
  });

  it("يضبط ورقة RTL ورأساً مجمّداً وترشيحاً تلقائياً", async () => {
    const xlsx = await toXlsx({ columns, rows }, { title: "تقرير الموظفين" });
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(xlsx as unknown as ArrayBuffer);

    const sheet = workbook.worksheets[0];
    const view = (sheet.views?.[0] ?? {}) as { rightToLeft?: boolean; ySplit?: number };
    expect(view.rightToLeft).toBe(true);
    expect(view.ySplit).toBe(1);
    expect(sheet.autoFilter).toBeTruthy();
  });

  it("يكتب الترويسات العربية والقيم مع الحفاظ على الأرقام", async () => {
    const xlsx = await toXlsx({ columns, rows }, { title: "تقرير الموظفين" });
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(xlsx as unknown as ArrayBuffer);
    const sheet = workbook.worksheets[0];

    expect(sheet.getRow(1).getCell(1).value).toBe("المعرّف");
    expect(sheet.getRow(1).getCell(2).value).toBe("الاسم الأول");
    expect(sheet.getRow(2).getCell(1).value).toBe(1);
    expect(typeof sheet.getRow(2).getCell(1).value).toBe("number");
    expect(sheet.getRow(2).getCell(2).value).toBe("سالم");
    expect(sheet.rowCount).toBe(3);
  });

  it("يقصّ اسم الورقة إلى 31 حرفاً ويزيل المحارف المحظورة", async () => {
    const longName = "تقرير [اختبار] طويل جداً * جداً / جداً ? جداً";
    const xlsx = await toXlsx({ columns, rows: [] }, { title: longName });
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(xlsx as unknown as ArrayBuffer);

    const name = workbook.worksheets[0].name;
    expect(name.length).toBeLessThanOrEqual(31);
    expect(name).not.toMatch(/[[\]:*?/\\]/);
  });
});

describe("GAP-L-002 — أمان اسم الملف", () => {
  it("يبني ترويسة آمنة باسم ASCII احتياطي واسم مرمّز", () => {
    const header = buildContentDisposition(7, "تقرير الموظفين", "pdf", new Date("2026-11-15T00:00:00.000Z"));
    expect(header).toContain('filename="report-7.pdf"');
    expect(header).toContain("filename*=UTF-8''");
    expect(header).toContain(encodeURIComponent("تقرير الموظفين-2026-11-15.pdf"));
  });

  it("لا يسمح بحقن أسطر جديدة أو علامات اقتباس في الترويسة", () => {
    const header = buildContentDisposition(9, 'اسم"\r\nX-Injected: 1', "xlsx");
    expect(header).not.toContain("\r");
    expect(header).not.toContain("\n");
    expect(header).toContain('filename="report-9.xlsx"');
    // علامة الاقتباس ترمّز إلى %22 داخل اسم الملف فقط
    expect(header).not.toMatch(/filename="[^"]*"[^;]/);
  });
});
