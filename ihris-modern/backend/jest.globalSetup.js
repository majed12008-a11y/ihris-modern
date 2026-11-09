/**
 * حارس أمان لاختبارات التكامل.
 *
 * الاختبارات تنفّذ عمليات حذف واسعة (deleteMany) في afterAll، لذا يجب ألا
 * تعمل أبداً على قاعدة بيانات غير مخصّصة للاختبار. هذا الحارس يفشل باكراً
 * إذا لم يكن DATABASE_URL مضبوطاً صراحةً على قاعدة اختبار.
 */
module.exports = async () => {
  const url = process.env.DATABASE_URL || "";
  if (!/_test_/i.test(url)) {
    throw new Error(
      "DATABASE_URL must point to an explicit test database (name containing '_test_'). " +
        "Refusing to run integration tests because they clear tables in afterAll hooks. " +
        'Example: DATABASE_URL="postgresql://ihris:***@localhost:5432/ihris_test_gap001"'
    );
  }
};
