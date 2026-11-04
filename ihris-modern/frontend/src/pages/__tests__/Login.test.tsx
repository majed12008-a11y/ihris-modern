import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Login from "../Login";

// Mock axios
vi.mock("@/services/api", () => ({
  default: { post: vi.fn() },
}));

// Mock sonner
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

// Mock react-router-dom
vi.mock("react-router-dom", () => ({ useNavigate: vi.fn() }));

const mockApiPost = vi.fn() as any;
vi.mocked((await import("@/services/api")).default).post = mockApiPost;

describe("Login Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApiPost.mockReset();
  });

  it("renders login form", () => {
    render(<Login />);
    expect(screen.getByLabelText(/اسم المستخدم/i)).toBeDefined();
    expect(screen.getByLabelText(/كلمة المرور/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /تسجيل الدخول/i })).toBeDefined();
  });

  it("shows iHRIS Suite title", () => {
    render(<Login />);
    expect(screen.getByText(/iHRIS Suite/i)).toBeDefined();
  });

  it("calls login API on submit", async () => {
    mockApiPost.mockResolvedValue({ data: { user: { id: 1, username: "admin" }, token: "fake-token" } });

    render(<Login />);

    const usernameInput = screen.getByLabelText(/اسم المستخدم/i);
    const passwordInput = screen.getByLabelText(/كلمة المرور/i);
    const submitButton = screen.getByRole("button", { name: /تسجيل الدخول/i });

    fireEvent.change(usernameInput, { target: { value: "admin" } });
    fireEvent.change(passwordInput, { target: { value: "admin123" } });
    fireEvent.click(submitButton);

    expect(mockApiPost).toHaveBeenCalledWith("/auth/login", {
      username: "admin",
      password: "admin123",
    });
  });
});
