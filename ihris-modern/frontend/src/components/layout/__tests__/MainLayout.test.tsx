import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

/**
 * Sprint 6 — سيناريو القبول 18: تجميع عناصر البيانات المرجعية الخمسة
 * تحت قائمة قابلة للطي في الشريط الجانبي (ADR-009 §9.2 القرار 10).
 *
 * نُحاكي مخزن المصادقة (zustand persist) لأن jsdom في هذه البيئة لا يوفّر
 * localStorage كاملاً، ولا علاقة للمخزن بمنطق التجميع المختبر هنا.
 */
const authState = vi.hoisted(() => ({
  user: null as null | {
    id: number;
    username: string;
    firstname: string;
    lastname: string;
    email: string;
    role: string;
  },
  logout: () => undefined,
}));

vi.mock("@/store/authStore", () => ({
  useAuthStore: () => authState,
}));

import MainLayout from "../MainLayout";

const REFERENCE_LABELS = [
  "درجات الرواتب",
  "الفئات الوظيفية",
  "التصنيفات الوظيفية",
  "أنواع الوظائف",
  "مصادر الرواتب",
];

function setUser(role: string) {
  authState.user = {
    id: 1,
    username: "tester",
    firstname: "مستخدم",
    lastname: "اختبار",
    email: "tester@test.local",
    role,
  };
}

function renderLayout() {
  return render(
    <MemoryRouter initialEntries={["/dashboard"]}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<div>محتوى لوحة التحكم</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe("MainLayout — تجميع البيانات المرجعية", () => {
  beforeEach(() => {
    setUser("admin");
  });

  it("يعرض مجموعة «البيانات المرجعية» وبندها الخمسة", () => {
    renderLayout();

    const toggle = screen.getByRole("button", { name: /البيانات المرجعية/ });
    expect(toggle).toBeDefined();
    expect(toggle.getAttribute("aria-expanded")).toBe("true");

    for (const label of REFERENCE_LABELS) {
      expect(screen.getByText(label)).toBeDefined();
    }
  });

  it("يطوي المجموعة ويخفي بنودها عند النقر", () => {
    renderLayout();

    const toggle = screen.getByRole("button", { name: /البيانات المرجعية/ });
    fireEvent.click(toggle);

    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByText("درجات الرواتب")).toBeNull();
    expect(screen.queryByText("مصادر الرواتب")).toBeNull();

    fireEvent.click(toggle);
    expect(screen.getByText("درجات الرواتب")).toBeDefined();
  });

  it("hr_staff لا يرى إدارة المستخدمين", () => {
    setUser("hr_staff");
    renderLayout();

    expect(screen.queryByText("المستخدمون")).toBeNull();
    expect(screen.getByText("ملفي الشخصي")).toBeDefined();
  });

  it("admin يرى إدارة المستخدمين والمحذوفين", () => {
    renderLayout();

    expect(screen.getByText("المستخدمون")).toBeDefined();
    expect(screen.getByText("المستخدمون المحذوفون")).toBeDefined();
  });
});
