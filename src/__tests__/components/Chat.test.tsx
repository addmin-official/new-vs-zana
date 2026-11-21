import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Chat } from "../../pages/Chat.tsx";
import { useAppStore } from "../../store/appStore.ts";

// Mock Firebase calls
vi.mock("../../services/firebase.ts", () => ({
  getFirestoreDb: vi.fn(() => ({})),
  getFirebaseAuth: vi.fn(() => null),
}));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn(),
  getDoc: vi.fn().mockResolvedValue({ exists: () => false, data: () => null }),
  setDoc: vi.fn().mockResolvedValue(undefined),
}));

// Mock sound effects
vi.mock("../../hooks/useSoundEffects.ts", () => ({
  useSoundEffects: () => ({
    playSuccess: vi.fn(),
    playError: vi.fn(),
    playClick: vi.fn(),
  }),
}));

describe("Chat / AI Tutor Component Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({
      chatMessages: [
        {
          id: "msg_1",
          sender: "zana",
          content: "سڵاو! من مامۆستا زانام، چۆن دەتوانم لە وانەکانی ئەمڕۆدا یارمەتیت بدەم؟",
          timestamp: new Date().toISOString(),
        },
      ],
      isLoading: false,
      isTrialExpired: false,
      fetchChapters: vi.fn().mockResolvedValue(undefined),
      chapters: [
        {
          id: 1,
          title: "ترش و تفتەکان",
          pages: "10-25",
        },
      ],
      activeChapter: 1,
      userRole: "student",
      user: {
        id: "std_test_01",
        name: "کاروان ئەحمەد",
        email: "test@zana.krd",
        grade: "12",
        stream: "scientific",
        activeSubject: "chemistry",
      },
    });
  });

  it("1. Renders initial tutor message and quick suggestion prompt chips in Kurdish", () => {
    render(<Chat />);

    expect(screen.getByText(/سڵاو! من مامۆستا زانام/i)).toBeInTheDocument();
    expect(screen.getByText(/🏆 ڕاهێنانی وانە/i)).toBeInTheDocument();
    expect(screen.getByText(/✨ شیکردنەوەی سوقراتی/i)).toBeInTheDocument();
    expect(screen.getByText(/🧠 هاوکێشە و یاساکان/i)).toBeInTheDocument();
  });

  it("2. Toggles Socratic teaching mode and displays Socratic indicator banner", () => {
    render(<Chat />);

    const socraticTabBtn = screen.getByRole("button", { name: /^سوقراتی/i });
    fireEvent.click(socraticTabBtn);

    expect(screen.getByText(/فێرکاری سوقراتی/i)).toBeInTheDocument();
  });

  it("3. Switches Dual View mode between Tutor Chat and Desk Resources (مێزی وانە)", () => {
    render(<Chat />);

    const workspaceBtn = screen.getByRole("button", { name: /هاوکێشە و مێزی کار/i });
    fireEvent.click(workspaceBtn);

    expect(screen.getAllByText(/یاسا/i).length).toBeGreaterThan(0);

    const tutorBtn = screen.getByRole("button", { name: /پرسیارکردن/i });
    fireEvent.click(tutorBtn);

    expect(screen.getByText(/سڵاو! من مامۆستا زانام/i)).toBeInTheDocument();
  });

  it("4. Allows typing and sending a question via textarea and form submit", async () => {
    const mockSend = vi.fn().mockResolvedValue(undefined);
    useAppStore.setState({ sendChatMessage: mockSend });

    render(<Chat />);

    const textarea = screen.getByRole("textbox", { name: /دەقی پرسیار یان وەڵام/i });
    fireEvent.change(textarea, { target: { value: "یاسای پێوەری pH چییە؟" } });

    const form = textarea.closest("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockSend).toHaveBeenCalledWith(
        expect.stringContaining("یاسای پێوەری pH چییە؟"),
        1
      );
    });
  });

  it("5. Clicking a Kurdish prompt chip sends preset prompt to AI Tutor", async () => {
    const mockSend = vi.fn().mockResolvedValue(undefined);
    useAppStore.setState({ sendChatMessage: mockSend });

    render(<Chat />);

    const chipButton = screen.getByRole("button", { name: /🏆 ڕاهێنانی وانە/i });
    fireEvent.click(chipButton);

    await waitFor(() => {
      expect(mockSend).toHaveBeenCalled();
    });
  });
});
