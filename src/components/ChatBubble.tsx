import React from "react";
import ReactMarkdown from "react-markdown";
import { Sparkles } from "lucide-react";
import { ChatMessage } from "../store/appStore.ts";

export interface ChatBubbleProps {
  message: ChatMessage;
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.sender === "user";

  return (
    <div
      className={`flex items-end gap-2.5 my-3.5 w-full ${
        isUser ? "justify-start flex-row-reverse" : "justify-start"
      }`}
      dir="rtl"
    >
      {/* Avatar for ZANA AI */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 mb-1 shadow-2xs">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
      )}

      {/* Message Bubble Container */}
      <div
        className={`relative px-4 py-3 shadow-xs text-sm font-sans leading-relaxed break-words max-w-[90%] md:max-w-[80%] ${
          isUser
            ? "bg-indigo-600 text-white rounded-2xl rounded-br-none"
            : "bg-white text-slate-800 border border-slate-200 rounded-2xl rounded-bl-none"
        }`}
        style={{ unicodeBidi: "isolate" }}
      >
        <div
          className="prose prose-sm max-w-none text-inherit leading-relaxed [&>p]:my-1 [&>ul]:list-disc [&>ul]:pr-5 [&>ol]:list-decimal [&>ol]:pr-5"
          style={{ unicodeBidi: "isolate" }}
        >
          <ReactMarkdown
            components={{
              p({ children }) {
                return (
                  <p style={{ unicodeBidi: "isolate" }}>
                    {children}
                  </p>
                );
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
              strong({ children }) {
                return (
                  <strong style={{ unicodeBidi: "isolate" }}>
                    {children}
                  </strong>
                );
              },
              li({ children }) {
                return (
                  <li style={{ unicodeBidi: "isolate" }}>
                    {children}
                  </li>
                );
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>

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
  );
}

export default ChatBubble;
