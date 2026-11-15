import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  Calculator,
  Lightbulb,
  ArrowLeft,
  ExternalLink,
  Layers,
  Brain,
} from "lucide-react";
import { ChatMessage } from "../services/storage.ts";

export type MultimodalType =
  | "EXPLANATION"
  | "STEP_BY_STEP"
  | "FORMULA"
  | "DIAGRAM_DESCRIPTION"
  | "EXAMPLE";

export interface ChatBubbleProps {
  message: ChatMessage;
  isLatestAi?: boolean;
  suggestions?: string[];
  onSelectSuggestion?: (suggestion: string) => void;
  onOpenVirtualLab?: () => void;
  socraticStep?: number;
}

export function detectMultimodalType(content: string): MultimodalType {
  if (
    content.includes("[STEP_BY_STEP]") ||
    /هەنگاو(ی)?\s*[١-٩1-9]|هەنگاوەکان:|\b(هەنگاو بە هەنگاو)\b/.test(content)
  ) {
    return "STEP_BY_STEP";
  }
  if (
    content.includes("[FORMULA]") ||
    /(pH\s*=|pOH\s*=|ΔH\s*=|F\s*=\s*m|v\s*=\s*d\/t|P\s*=\s*V\s*\*|E\s*=\s*mc²|PV\s*=\s*nRT|K_eq|K_a|\[H₃O⁺\]|\[OH⁻\])/i.test(
      content
    )
  ) {
    return "FORMULA";
  }
  if (
    content.includes("[EXAMPLE]") ||
    /نموونە(ی)?\s*(شیکارکراو|ڕوونکردنەوە|وەزاری)?:|بۆ نموونە:/.test(content)
  ) {
    return "EXAMPLE";
  }
  if (
    content.includes("[DIAGRAM_DESCRIPTION]") ||
    /دیاگرام|وێنەی ڕوونکردنەوە|تاقیگەی مەجازی|سووڕی کارەبایی|سیمولەیشن|مایکرۆسکۆپ/.test(
      content
    )
  ) {
    return "DIAGRAM_DESCRIPTION";
  }
  return "EXPLANATION";
}

export const ChatBubble = React.memo(function ChatBubble({
  message,
  isLatestAi = false,
  suggestions = [],
  onSelectSuggestion,
  onOpenVirtualLab,
  socraticStep,
}: ChatBubbleProps) {
  const isUser = message.sender === "user";
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({
    0: true,
    1: true,
  });

  const responseType = !isUser
    ? detectMultimodalType(message.content)
    : "EXPLANATION";

  const toggleStep = (idx: number) => {
    setExpandedSteps((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Parse Step-by-Step content if present
  const parseSteps = (text: string) => {
    const rawLines = text.split("\n");
    const steps: { title: string; content: string }[] = [];
    let currentTitle = "";
    let currentBody: string[] = [];

    rawLines.forEach((line) => {
      const match = line.match(/^(?:[-*#\s]*)(هەنگاو(?:ی)?\s*[١-٩1-9][^:\n]*:?|Step\s*\d+:?)(.*)/i);
      if (match) {
        if (currentTitle) {
          steps.push({ title: currentTitle, content: currentBody.join("\n").trim() });
          currentBody = [];
        }
        currentTitle = line.replace(/^[#*-\s]+/, "").trim();
      } else {
        currentBody.push(line);
      }
    });

    if (currentTitle) {
      steps.push({ title: currentTitle, content: currentBody.join("\n").trim() });
    }

    return steps;
  };

  const stepsList = responseType === "STEP_BY_STEP" ? parseSteps(message.content) : [];

  return (
    <div
      className={`flex flex-col my-3.5 w-full ${
        isUser ? "items-start" : "items-start"
      }`}
      dir="rtl"
    >
      <div
        className={`flex items-end gap-2.5 w-full ${
          isUser ? "justify-start flex-row-reverse" : "justify-start"
        }`}
      >
        {/* Avatar for ZANA AI */}
        {!isUser && (
          <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 mb-1 shadow-2xs">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
        )}

        {/* Message Bubble Container */}
        <div
          className={`relative px-4 py-3 shadow-xs text-sm font-sans leading-relaxed break-words max-w-[92%] md:max-w-[82%] ${
            isUser
              ? "bg-indigo-600 text-white rounded-2xl rounded-br-none"
              : "bg-white text-slate-800 border border-slate-200 rounded-2xl rounded-bl-none"
          }`}
          style={{ unicodeBidi: "isolate" }}
        >
          {/* Socratic indicator tag */}
          {!isUser && socraticStep !== undefined && socraticStep > 0 && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold mb-2">
              <Brain className="w-3 h-3 text-amber-600" />
              <span>شێوازی سوقراتی • هەنگاوی {socraticStep} لە ٤</span>
            </div>
          )}

          {/* 1. Multimodal: STEP_BY_STEP with Collapsible Cards */}
          {!isUser && responseType === "STEP_BY_STEP" && stepsList.length > 0 ? (
            <div className="space-y-2.5 py-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50/70 px-2.5 py-1 rounded-lg border border-indigo-100">
                <Layers className="w-3.5 h-3.5" />
                <span>شیکارکردنی هەنگاو بە هەنگاو:</span>
              </div>
              <div className="space-y-2">
                {stepsList.map((step, idx) => {
                  const isOpen = expandedSteps[idx] ?? true;
                  return (
                    <div
                      key={idx}
                      className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50 shadow-2xs transition-all"
                    >
                      <button
                        type="button"
                        onClick={() => toggleStep(idx)}
                        className="w-full flex items-center justify-between p-2.5 bg-white text-right hover:bg-slate-50 cursor-pointer font-bold text-xs text-slate-900 border-b border-slate-100"
                        aria-expanded={isOpen}
                        aria-label={`پیشاندان یان شاردنەوەی ${step.title}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">
                            {idx + 1}
                          </span>
                          <span className="truncate">{step.title}</span>
                        </div>
                        {isOpen ? (
                          <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="p-3 text-xs text-slate-700 leading-relaxed font-sans bg-slate-50/60">
                          <ReactMarkdown>{step.content || step.title}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : !isUser && responseType === "FORMULA" ? (
            /* 2. Multimodal: FORMULA with styled Unicode math card */
            <div className="space-y-2 py-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50/70 px-2.5 py-1 rounded-lg border border-indigo-100">
                <Calculator className="w-3.5 h-3.5" />
                <span>هاوکێشە و یاسای زانستی (Unicode Math):</span>
              </div>
              <div className="p-3.5 bg-slate-900 text-amber-300 rounded-xl border border-slate-800 font-mono text-center text-sm font-black shadow-xs tracking-wide select-all dir-ltr">
                <bdi>{message.content.match(/(pH\s*=[^\n]+|ΔH[^\n]+|F\s*=\s*[^\n]+|v\s*=[^\n]+|E\s*=[^\n]+|PV\s*=[^\n]+)/i)?.[0] || message.content}</bdi>
              </div>
              <div className="text-xs text-slate-700 leading-relaxed">
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
            </div>
          ) : !isUser && responseType === "EXAMPLE" ? (
            /* 3. Multimodal: EXAMPLE with colored accent card */
            <div className="space-y-2 py-1">
              <div className="p-3.5 bg-emerald-50/60 border-r-4 border-r-emerald-500 rounded-xl border border-emerald-200 text-slate-800 shadow-2xs space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-black text-emerald-900">
                  <Lightbulb className="w-4 h-4 text-emerald-600" />
                  <span>نموونەی شیکارکراوی مەنهەجی</span>
                </div>
                <div className="text-xs leading-relaxed text-slate-700">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ) : !isUser && responseType === "DIAGRAM_DESCRIPTION" ? (
            /* 4. Multimodal: DIAGRAM_DESCRIPTION with link to VirtualScienceLab */
            <div className="space-y-2.5 py-1">
              <div className="p-3.5 bg-sky-50/60 border-r-4 border-r-sky-500 rounded-xl border border-sky-200 text-slate-800 shadow-2xs space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-black text-sky-900">
                  <FlaskConical className="w-4 h-4 text-sky-600" />
                  <span>شیکاری دیاگرامی زانستی و تاقیگەی مەجازی</span>
                </div>
                <div className="text-xs leading-relaxed text-slate-700">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
                {onOpenVirtualLab && (
                  <button
                    type="button"
                    onClick={onOpenVirtualLab}
                    className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-sans text-xs font-bold transition shadow-2xs cursor-pointer"
                    aria-label="کردنەوەی تاقیگەی مەجازی لە پەڕەی تایبەت"
                  >
                    <FlaskConical className="w-3.5 h-3.5 text-amber-300" />
                    <span>تاقیکردنەوە لە تاقیگەی مەجازی (Virtual Science Lab)</span>
                    <ExternalLink className="w-3 h-3 text-white/80" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* 5. Standard Markdown EXPLANATION */
            <div
              className="prose prose-sm max-w-none text-inherit leading-relaxed [&>p]:my-1 [&>ul]:list-disc [&>ul]:pr-5 [&>ol]:list-decimal [&>ol]:pr-5"
              style={{ unicodeBidi: "isolate" }}
            >
              <ReactMarkdown
                components={{
                  p({ children }) {
                    return <p style={{ unicodeBidi: "isolate" }}>{children}</p>;
                  },
                  code({ className, children, ...props }) {
                    return (
                      <code
                        dir="ltr"
                        className={`font-mono text-xs bg-slate-100 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded inline-block ${className || ""}`}
                        style={{ unicodeBidi: "isolate" }}
                        {...props}
                      >
                        <bdi>{children}</bdi>
                      </code>
                    );
                  },
                  pre({ children }) {
                    return (
                      <pre
                        dir="ltr"
                        className="font-mono text-xs bg-slate-900 text-slate-100 p-3 rounded-xl overflow-x-auto my-2"
                        style={{ unicodeBidi: "isolate" }}
                      >
                        <bdi>{children}</bdi>
                      </pre>
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}

          {/* Timestamp */}
          {message.timestamp && (
            <div
              className={`text-[10px] mt-1.5 font-sans font-medium text-left ${
                isUser ? "text-indigo-100" : "text-slate-500"
              }`}
            >
              {message.timestamp}
            </div>
          )}
        </div>
      </div>

      {/* 4. Smart Prompt Suggestions (Rendered directly under latest AI message) */}
      {!isUser && isLatestAi && suggestions.length > 0 && (
        <div className="pr-10 mt-2 space-y-1.5 animate-in fade-in max-w-2xl">
          <span className="text-[10px] font-bold text-slate-400 font-sans flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-500" />
            <span>پرسیاری پێشنیارکراوی پەیوەندیدار:</span>
          </span>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((sug, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectSuggestion?.(sug)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white hover:bg-indigo-50 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 border border-slate-200 text-xs font-sans font-medium shadow-2xs transition-all cursor-pointer group"
                aria-label={`پرسیار لەسەر: ${sug}`}
              >
                <span>{sug}</span>
                <ArrowLeft className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 transition-transform group-hover:-translate-x-0.5" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

export default ChatBubble;

