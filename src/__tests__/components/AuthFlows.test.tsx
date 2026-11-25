import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Register } from "../../pages/Register.tsx";
import { Login } from "../../pages/Login.tsx";

const mockAuthState = vi.hoisted(() => ({
  registerWithEmail: vi.fn(),
  loginWithEmail: vi.fn(),
  loginWithGoogle: vi.fn(),
  sendVerificationEmail: vi.fn(),
  reloadAndCheckEmailVerified: vi.fn(),
  startStudentTrial: vi.fn(),
  onboardStudent: vi.fn(),
  createUserDocumentIfMissing: vi.fn(),
  initializeTrial: vi.fn(),
  checkUserExists: vi.fn(),
  getMyRole: vi.fn(),
}));

vi.mock("../../services/authService.ts", () => ({
  registerWithEmail: mockAuthState.registerWithEmail,
  loginWithEmail: mockAuthState.loginWithEmail,
  loginWithGoogle: mockAuthState.loginWithGoogle,
  sendVerificationEmail: mockAuthState.sendVerificationEmail,
  reloadAndCheckEmailVerified: mockAuthState.reloadAndCheckEmailVerified,
  startStudentTrial: mockAuthState.startStudentTrial,
  getErrorMessage: (err: unknown) => (err as Error)?.message || "Authentication error",
}));

vi.mock("../../services/subscriptionService.ts", () => ({
  onboardStudent: mockAuthState.onboardStudent,
}));

vi.mock("../../auth/userProfileService.ts", () => ({
  createUserDocumentIfMissing: mockAuthState.createUserDocumentIfMissing,
  checkUserExists: mockAuthState.checkUserExists,
}));

vi.mock("../../auth/trialService.ts", () => ({
  initializeTrial: mockAuthState.initializeTrial,
}));

vi.mock("../../auth/roles.ts", () => ({
  getMyRole: mockAuthState.getMyRole,
}));

describe("Verified Email Registration & Login Component Flows", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthState.sendVerificationEmail.mockResolvedValue({ ok: true });
    mockAuthState.startStudentTrial.mockResolvedValue({ ok: true });
    mockAuthState.createUserDocumentIfMissing.mockResolvedValue(undefined);
    mockAuthState.initializeTrial.mockResolvedValue(undefined);
    mockAuthState.checkUserExists.mockResolvedValue({ exists: true, isNewUser: false });
    mockAuthState.getMyRole.mockResolvedValue("student");
    mockAuthState.onboardStudent.mockResolvedValue({ ok: true, message: "ok" });
  });

  it("Register hides unsupported phone OTP UI & National ID, enforces email verification, and submits only Full Name, Email, Grade, Stream, and School Name", async () => {
    mockAuthState.registerWithEmail.mockResolvedValue({
      uid: "stu_email_001",
      email: "shilan.ali@example.com",
      emailVerified: false,
      displayName: "شیلان عەلی",
    });

    mockAuthState.reloadAndCheckEmailVerified
      .mockResolvedValueOnce({ verified: false, user: { uid: "stu_email_001", emailVerified: false } })
      .mockResolvedValueOnce({
        verified: true,
        user: { uid: "stu_email_001", email: "shilan.ali@example.com", emailVerified: true },
      });

    const onRegisterSuccess = vi.fn();
    const { container } = render(
      <Register onNavigateToLogin={vi.fn()} onRegisterSuccess={onRegisterSuccess} />
    );

    // Unsupported phone UI and National ID must never be rendered
    expect(container.querySelector("input[type='tel']")).toBeNull();
    expect(screen.queryByText(/مۆبایل/)).toBeNull();
    expect(screen.queryByText(/کارتی نیشتمانی/i)).toBeNull();

    fireEvent.change(screen.getByPlaceholderText("ناوی قوتابی"), { target: { value: "شیلان عەلی" } });
    fireEvent.change(screen.getByPlaceholderText("student@example.com"), { target: { value: "shilan.ali@example.com" } });
    const passInputs = screen.getAllByPlaceholderText("••••••••");
    fireEvent.change(passInputs[0], { target: { value: "StrongPass123!" } });
    fireEvent.change(passInputs[1], { target: { value: "StrongPass123!" } });

    fireEvent.click(screen.getByRole("button", { name: /بەردەوام بە بەرەو قۆناغی دواتر/i }));

    await waitFor(() => {
      expect(mockAuthState.registerWithEmail).toHaveBeenCalledWith(
        "shilan.ali@example.com",
        "StrongPass123!",
        "شیلان عەلی"
      );
      expect(mockAuthState.sendVerificationEmail).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText(/دڵنیاکردنەوەی ئیمەیڵ پێویستە/)).toBeInTheDocument();

    // Clicking "verified" while still unverified keeps user on verification gate
    fireEvent.click(screen.getByRole("button", { name: /پشتڕاستم کردەوە، بەردەوام بە/i }));
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/هێشتا ئیمەیڵەکەت پشتڕاست نەکراوەتەوە/);
    });
    expect(screen.queryByPlaceholderText(/ئامادەیی کوردستان/)).toBeNull();

    // Second check succeeds -> advances to Step 2 (no National ID field)
    fireEvent.click(screen.getByRole("button", { name: /پشتڕاستم کردەوە، بەردەوام بە/i }));
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/ئامادەیی کوردستان/)).toBeInTheDocument();
    });

    expect(screen.queryByText(/کارتی نیشتمانی|national.?id/i)).toBeNull();
    fireEvent.change(screen.getByPlaceholderText(/ئامادەیی کوردستان/), {
      target: { value: "ئامادەیی ڕزگاری" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^بەردەوام بە$/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /دەستپێبکە/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: /دەستپێبکە/i }));

    await waitFor(() => {
      expect(mockAuthState.onboardStudent).toHaveBeenCalledWith({
        name: "شیلان عەلی",
        email: "shilan.ali@example.com",
        grade: "12",
        stream: "scientific",
        schoolName: "ئامادەیی ڕزگاری",
      });
      expect(onRegisterSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "شیلان عەلی",
          school: "ئامادەیی ڕزگاری",
        })
      );
    });
  });

  it("Register blocks admin email signup client-side before Firebase call", async () => {
    render(<Register onNavigateToLogin={vi.fn()} onRegisterSuccess={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText("ناوی قوتابی"), { target: { value: "قوتابی" } });
    fireEvent.change(screen.getByPlaceholderText("student@example.com"), {
      target: { value: "addmin.official.idg@gmail.com" },
    });
    const passInputs = screen.getAllByPlaceholderText("••••••••");
    fireEvent.change(passInputs[0], { target: { value: "Pass1234" } });
    fireEvent.change(passInputs[1], { target: { value: "Pass1234" } });
    fireEvent.click(screen.getByRole("button", { name: /بەردەوام بە بەرەو قۆناغی دواتر/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/ڕێپێدراو نییە/);
    });
    expect(mockAuthState.registerWithEmail).not.toHaveBeenCalled();
  });

  it("Login hides phone tab, intercepts unverified email login, and reconciles verified login without overwriting grade/stream", async () => {
    const onLoginSuccess = vi.fn();
    mockAuthState.loginWithEmail
      .mockResolvedValueOnce({
        uid: "stu_unverified",
        email: "unverified@example.com",
        emailVerified: false,
        displayName: "Unverified Student",
        getIdToken: vi.fn(async () => "tok"),
      })
      .mockResolvedValueOnce({
        uid: "stu_verified",
        email: "verified@example.com",
        emailVerified: true,
        displayName: "دارا ئەحمەد",
        getIdToken: vi.fn(async () => "tok-verified"),
      });

    const { container } = render(
      <Login
        onNavigateToRegister={vi.fn()}
        onNavigateToForgotPassword={vi.fn()}
        onLoginSuccess={onLoginSuccess}
      />
    );

    expect(container.querySelector("input[type='tel']")).toBeNull();
    expect(screen.queryByText(/مۆبایل/)).toBeNull();

    // 1. Unverified account is paused at inline verification prompt
    fireEvent.change(screen.getByPlaceholderText("student@example.com"), {
      target: { value: "unverified@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), { target: { value: "Secret123" } });
    fireEvent.click(screen.getByRole("button", { name: /^چوونەژوورەوە$/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /پشتڕاستم کردەوە، بچۆ ژوورەوە/i })).toBeInTheDocument();
    });
    expect(onLoginSuccess).not.toHaveBeenCalled();

    // Return to login form and sign in as verified account
    fireEvent.click(screen.getByRole("button", { name: /گەڕانەوە بۆ چوونەژوورەوە/i }));
    fireEvent.change(screen.getByPlaceholderText("student@example.com"), {
      target: { value: "verified@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), { target: { value: "Secret123" } });
    fireEvent.click(screen.getByRole("button", { name: /^چوونەژوورەوە$/i }));

    await waitFor(() => {
      expect(mockAuthState.startStudentTrial).toHaveBeenCalledWith("stu_verified", {
        name: "دارا ئەحمەد",
        email: "verified@example.com",
      });
      const callPayload = mockAuthState.startStudentTrial.mock.calls[0]?.[1];
      expect(callPayload.grade).toBeUndefined();
      expect(callPayload.stream).toBeUndefined();
      expect(onLoginSuccess).toHaveBeenCalledWith(false, "student");
    });
  });
});
