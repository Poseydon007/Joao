
import React, { useState, useEffect, useRef } from 'react';
import type { Chat } from '@google/genai';
import { createChatSession } from './services/geminiService';
import type { Message } from './types';
import { Sender } from './types';
import { INITIAL_GREETING, SUGGESTED_PROMPTS } from './constants';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([INITIAL_GREETING]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const chatRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatRef.current = createChatSession();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (userInput: string) => {
    if (!userInput.trim() || isLoading || !chatRef.current) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      text: userInput,
      sender: Sender.USER,
    };

    setMessages((prev) => [
      ...prev,
      userMessage,
      { id: crypto.randomUUID(), text: '', sender: Sender.BOT },
    ]);
    setIsLoading(true);

    try {
      const stream = await chatRef.current.sendMessageStream({ message: userInput });

      let botResponseText = '';
      for await (const chunk of stream) {
        botResponseText += chunk.text;
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].text = botResponseText;
          return newMessages;
        });
      }

    } catch (error) {
      console.error("Gemini API error:", error);
      const errorMessageText = "I'm having trouble connecting right now. Please try again in a moment.";
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        text: errorMessageText,
        sender: Sender.BOT,
      };
      setMessages((prev) => [...prev.slice(0, -1), errorMessage]);
      
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-gray-100 font-sans">
        <header className="flex items-center justify-center p-4 bg-gray-800 border-b border-gray-700 shadow-lg">
            <h1 className="text-xl font-bold text-center text-white">
                <span className="text-cyan-400">Ecosystem Mining</span> Virtual Assistant
            </h1>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="max-w-4xl mx-auto">
                {messages.map((msg) => (
                    <ChatMessage key={msg.id} message={msg} />
                ))}

                {messages.length === 1 && (
                    <div className="mt-8 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                        <h2 className="text-lg font-semibold mb-3 text-cyan-400">Or try one of these:</h2>
                        <div className="flex flex-wrap gap-3">
                            {SUGGESTED_PROMPTS.map((prompt, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSendMessage(prompt.command)}
                                    disabled={isLoading}
                                    className="px-4 py-2 bg-gray-700 text-white rounded-full hover:bg-gray-600 transition-colors disabled:opacity-50 text-left"
                                >
                                    {prompt.displayText}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                
                <div ref={messagesEndRef} />
            </div>
        </main>
        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
    </div>
  );
};

export default App;