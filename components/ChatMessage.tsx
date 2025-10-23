

import React from 'react';
import type { Message } from '../types';
import { Sender } from '../types';
// Fix: Aliased the import from LOGO_URL to BOT_AVATAR_IMAGE to match what is exported from assets.ts.
import { LOGO_URL as BOT_AVATAR_IMAGE } from '../assets';

interface ChatMessageProps {
  message: Message;
}

const BotAvatar = () => (
    <div className="w-10 h-10 rounded-full flex-shrink-0 shadow-md">
       <img 
          src={BOT_AVATAR_IMAGE} 
          alt="Eco, the Ecosystem Mining assistant" 
          className="w-full h-full rounded-full object-cover"
      />
    </div>
);

// Parses inline markdown like **bold** and *italic*
const parseInline = (text: string): React.ReactNode[] => {
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={index}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('*') && part.endsWith('*')) {
            return <em key={index}>{part.slice(1, -1)}</em>;
        }
        return part;
    });
};

// A simple markdown renderer that supports paragraphs, bold, italics, and lists.
const MarkdownRenderer: React.FC<{ text: string }> = ({ text }) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let currentList: 'ul' | 'ol' | null = null;
    let listItems: React.ReactNode[] = [];

    const flushList = () => {
        if (currentList) {
            const ListTag = currentList;
            const listClasses = `list-inside pl-4 space-y-1 ${currentList === 'ul' ? 'list-disc' : 'list-decimal'}`;
            elements.push(
                <ListTag key={`list-${elements.length}`} className={listClasses}>
                    {listItems.map((item, i) => <li key={i}>{item}</li>)}
                </ListTag>
            );
            listItems = [];
            currentList = null;
        }
    };

    lines.forEach((line, index) => {
        const ulMatch = line.match(/^\s*[\*\-]\s+(.*)/);
        const olMatch = line.match(/^\s*\d+\.\s+(.*)/);

        if (ulMatch) {
            if (currentList !== 'ul') flushList();
            currentList = 'ul';
            listItems.push(parseInline(ulMatch[1]));
        } else if (olMatch) {
            if (currentList !== 'ol') flushList();
            currentList = 'ol';
            listItems.push(parseInline(olMatch[1]));
        } else {
            flushList();
            if (line.trim()) {
                elements.push(<p key={`p-${index}`}>{parseInline(line)}</p>);
            }
        }
    });

    flushList();

    return <div className="text-white leading-relaxed space-y-4">{elements}</div>;
};


export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isBot = message.sender === Sender.BOT;

  // Don't render empty bot messages (placeholders for streaming)
  if (isBot && !message.text.trim()) {
    return null;
  }

  return (
    <div className={`flex items-start gap-4 my-4 ${isBot ? '' : 'flex-row-reverse'}`}>
      {isBot && <BotAvatar />}
      <div className={`max-w-lg lg:max-w-xl px-5 py-3 rounded-2xl shadow-md ${
          isBot 
          ? 'bg-gray-700 rounded-bl-none' 
          : 'bg-blue-600 text-white rounded-br-none'
      }`}>
        <MarkdownRenderer text={message.text} />
      </div>
    </div>
  );
};
