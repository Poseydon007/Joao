
import React, { useState, useEffect, useRef } from 'react';
import type { Chat } from '@google/genai';
import { createChatSession } from './services/geminiService';
import type { Message } from './types';
import { Sender } from './types';
import { INITIAL_GREETING, SUGGESTED_PROMPTS } from './constants';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { MinimizeIcon, ChatBubbleIcon } from './components/Icons';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([INITIAL_GREETING]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const chatRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatRef.current = createChatSession();
  }, []);

  useEffect(() => {
    // Only scroll smoothly if it's not the initial centered view
    if (messages.length > 1) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (userInput: string) => {
    if (!userInput.trim() || isLoading || !chatRef.current) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      text: userInput,
      sender: Sender.USER,
    };

    // If this is the first message, replace the initial greeting, otherwise add to it
    const newMessages = messages.length === 1 
      ? [userMessage]
      : [...messages, userMessage];

    setMessages([
      ...newMessages,
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

  const toggleChat = () => {
    setIsMinimized(prev => !prev);
  };

  if (isMinimized) {
    return (
      <div className="w-full h-full flex justify-end items-end p-4">
        <button
          onClick={toggleChat}
          className="p-4 bg-cyan-600 text-white rounded-full shadow-lg hover:bg-cyan-500 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-white"
          aria-label="Open chat"
        >
          <ChatBubbleIcon />
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-rows-[auto_1fr_auto] h-screen bg-gray-900 text-gray-100 font-sans rounded-xl overflow-hidden shadow-2xl">
        <header className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700 shadow-lg">
             <div className="w-8"></div> {/* Spacer to balance the header */}
            <h1 className="text-xl font-bold text-center text-white">
                <span className="text-cyan-400">Ecosystem Mining</span> Virtual Assistant
            </h1>
             <button 
                onClick={toggleChat} 
                className="p-1 text-gray-400 rounded-full hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white transition-all" 
                aria-label="Minimize chat"
            >
                <MinimizeIcon />
            </button>
        </header>
        {/* When messages.length is 1, we want to center the content. */}
        <main className={`overflow-y-auto p-4 md:p-6 ${messages.length === 1 ? 'flex' : ''}`}>
            {/* 
              When messages.length is 1, this inner div will be centered with `my-auto`.
              Otherwise, it acts as a standard chat content container.
            */}
            <div className={`w-full ${messages.length === 1 ? 'my-auto' : 'max-w-4xl mx-auto'}`}>
                {messages.map((msg) => (
                    <ChatMessage 
                      key={msg.id} 
                      message={msg} 
                      // The `center` prop is passed only when there is exactly one message.
                      center={messages.length === 1} 
                    />
                ))}

                {/* The suggestion box is only shown initially. */}
                {messages.length === 1 && (
                    <div className="mt-8 p-4 bg-gray-800/50 rounded-lg border border-gray-700 max-w-lg lg:max-w-xl mx-auto">
                        <h2 className="text-lg font-semibold mb-3 text-cyan-400 text-center">Or try one of these:</h2>
                        <div className="flex flex-wrap gap-3 justify-center">
                            {SUGGESTED_PROMPTS.map((prompt, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSendMessage(prompt.command)}
                                    disabled={isLoading}
                                    className="px-4 py-2 bg-gray-700 text-white rounded-full hover:bg-gray-600 transition-colors disabled:opacity-50"
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