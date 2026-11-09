import { prisma, setCurrentTransaction } from "../lib/prisma";

/**
 * Sprint 5.5 — Transaction wrapper لكل اختبار.
 *
 * كل `it`/`test` يُغلَّف داخل معاملة Prisma، ثم تُلغى (ROLLBACK) بعد انتهائه
 * عبر رمز خاص. هذا يضمن ألا تتسرب كتابات الاختبار إلى قاعدة الاختبار، ويحمي
 * البيانات المرجعية (Seed) من الحذف العرضي.
 *
 * ملاحظة: بيانات beforeAll (المستخدمون/الأدوار/البيانات الأساسية) تبقى خارج
 * المعاملة عمداً، وتُنظَّف في afterAll كما كان سابقاً.
 */
const ROLLBACK = Symbol("test-rollback");

const hasCallback = (fn: unknown): fn is () => unknown => typeof fn === "function";

function wrapTest(original: any): any {
  const wrapped = function (name: any, fn?: any, timeout?: number) {
    if (!hasCallback(fn)) return original(name, fn, timeout);

    return original(
      name,
      async () => {
        try {
          await prisma.$transaction(
            async (tx) => {
              setCurrentTransaction(tx);
              try {
                await fn();
              } finally {
                setCurrentTransaction(null);
              }
              // إجبار Rollback بعد نجاح الاختبار.
              throw ROLLBACK;
            },
            { timeout: 28000, maxWait: 15000 }
          );
        } catch (error) {
          if (error !== ROLLBACK) throw error;
        }
      },
      timeout
    );
  };

  // الحفاظ على .each/.skip/.only/.todo/.concurrent
  Object.assign(wrapped, original);
  return wrapped;
}

const globals = global as any;
globals.it = wrapTest(globals.it);
globals.test = wrapTest(globals.test);
