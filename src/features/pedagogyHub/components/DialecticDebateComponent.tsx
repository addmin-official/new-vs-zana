import React, { useState } from "react";
import { DialecticDebateTopic, DialecticDebateMessage } from "../pedagogyTypes.ts";
import { PedagogyEngine } from "../pedagogyEngine.ts";
import { ZanaButton } from "../../../components/ZanaButton.tsx";
import {
  Swords,
  Send,
  Lightbulb,
  BookOpen
} from "lucide-react";

export const DialecticDebateComponent: React.FC = () => {
  const topics = PedagogyEngine.getDebateTopics();
  const [selectedTopic, setSelectedTopic] = useState<DialecticDebateTopic>(topics[0]);
  const [messages, setMessages] = useState<DialecticDebateMessage[]>([
    {
      id: "init",
      sender: "ai_devil_advocate",
      text: topics[0].misconceptionClaim,
      timestamp: "١٢:٠٠"
    }
  ]);
  const [studentInput, setStudentInput] = useState("");
  const [showHints, setShowHints] = useState(false);
  const [round, setRound] = useState(1);
  const [msgCounter, setMsgCounter] = useState(1);

  const handleSelectTopic = (topic: DialecticDebateTopic) => {
    setSelectedTopic(topic);
    const nowTime = new Date().toLocaleTimeString("ku");
    const nextCounter = msgCounter + 1;
    setMsgCounter(nextCounter);
    setMessages([
      {
        id: `init-${topic.id}-${nextCounter}`,
        sender: "ai_devil_advocate",
        text: topic.misconceptionClaim,
        timestamp: nowTime
      }
    ]);
    setStudentInput("");
    setShowHints(false);
    setRound(1);
  };

  const handleSendArgument = () => {
    if (!studentInput.trim()) return;

    const nowTime = new Date().toLocaleTimeString("ku");
    const nextCounter = msgCounter + 1;
    setMsgCounter(nextCounter);
    const userMsg: DialecticDebateMessage = {
      id: `user-${nextCounter}`,
      sender: "student",
      text: studentInput,
      timestamp: nowTime
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    const currentInput = studentInput;
    setStudentInput("");

    setTimeout(() => {
      const rebuttal = PedagogyEngine.evaluateDebateArgument(selectedTopic, currentInput, round);
      setMessages((prev) => [...prev, rebuttal]);
      setRound((r) => r + 1);
    }, 600);
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Debate Header */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
        <label className="block text-xs font-bold text-slate-500 mb-2">
          مەیدانی دیبەیت و بەرگری لە ڕاستیی زانستی:
        </label>
        <div className="flex flex-wrap gap-2">
          {topics.map((t: DialecticDebateTopic) => (
            <button
              key={t.id}
              onClick={() => handleSelectTopic(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedTopic.id === t.id
                  ? "bg-rose-600 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              پۆلی {t.grade} • {t.subject}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Debate Arena Chat */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col h-[460px]">
            {/* Top Bar */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Swords className="w-5 h-5 text-rose-500" />
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                    زانا لە ڕۆڵی بەرەی دژ (Devil's Advocate)
                  </h4>
                  <span className="text-[10px] text-slate-400">
                    بیسەلمێنە کە بۆچی ئەم تێگەیشتنە هەڵەیە!
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowHints(!showHints)}
                className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline cursor-pointer"
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>هێڵی هاوکاری</span>
              </button>
            </div>

            {/* Hint Box */}
            {showHints && (
              <div className="bg-amber-50 dark:bg-amber-950/20 p-3 border-b border-amber-200 text-xs text-amber-900 dark:text-amber-200 space-y-1 animate-fade-in">
                <span className="font-bold">سەرەداوەکانی پەڕتووک:</span>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  {selectedTopic.hints.map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {messages.map((m) => {
                const isAI = m.sender === "ai_devil_advocate";
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isAI ? "items-start" : "items-end"} animate-fade-in`}
                  >
                    <div
                      className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                        isAI
                          ? "bg-rose-50 dark:bg-rose-950/40 text-rose-950 dark:text-rose-200 border border-rose-200 dark:border-rose-900/60"
                          : "bg-blue-600 text-white rounded-br-none"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold mb-1 opacity-75">
                        <span>{isAI ? "قسەی دژبەری زانستی" : "تۆ (بەرگریکار)"}</span>
                        <span>{m.timestamp}</span>
                      </div>
                      <p className="font-sans">{m.text}</p>

                      {m.scientificScore !== undefined && (
                        <div className="mt-2 pt-2 border-t border-rose-200 dark:border-rose-900/40 flex items-center justify-between font-bold text-[10px]">
                          <span>نمرەی بەڵگەی پەڕتووک:</span>
                          <span>{m.scientificScore} / ١٠٠</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input Bar */}
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
              <input
                type="text"
                value={studentInput}
                onChange={(e) => setStudentInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendArgument()}
                placeholder="بەڵگەکەت بەپێی یاسای پەڕتووکی وەزاری بنووسە..."
                className="flex-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <ZanaButton
                variant="primary"
                onClick={handleSendArgument}
                disabled={!studentInput.trim()}
                className="px-4 py-2 text-xs font-bold"
              >
                <Send className="w-4 h-4 ml-1" />
                <span>ناردن</span>
              </ZanaButton>
            </div>
          </div>
        </div>

        {/* Right: Topic Context & Curriculum Truth */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <span>ڕاستیی زانستیی مەنهەج</span>
            </span>

            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-xl text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
              <span className="font-bold">ڕاستی: </span>
              <p className="leading-relaxed">{selectedTopic.scientificTruth}</p>
            </div>

            <div className="text-[11px] text-slate-400">
              <span className="font-bold">سەرچاوە: </span>
              {selectedTopic.curriculumReference}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
              💡 پڕۆفیسۆری پێداگۆجی دەڵێت: باشترین فێرخواز ئەو کەسەیە کە کاتێک کەسێک گومانی لێ دەکات بتوانێت بە
              بەڵگەی زانستی و هاوکێشە وەڵام بداتەوە.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
