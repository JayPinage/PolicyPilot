import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Menu, Shield, Plus, Sparkles, AlertCircle } from 'lucide-react';
import { Chat, Message } from '../../types/chat';
import {
  getChatsApi,
  createChatApi,
  getMessagesApi,
  deleteChatApi,
  streamChatApi,
} from '../../api/chat';
import { ChatSidebar } from '../../components/chat/ChatSidebar';
import { ChatMessage } from '../../components/chat/ChatMessage';
import { ChatInput } from '../../components/chat/ChatInput';
import { WelcomeScreen } from '../../components/chat/WelcomeScreen';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ToastContainer } from '../../components/common/Toast';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../api/axios';

export const ChatPage: React.FC = () => {
  const { error: showErrorToast } = useToast();

  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState<boolean>(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [streamError, setStreamError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  useEffect(() => {
    scrollToBottom(true);
  }, [messages, isStreaming, scrollToBottom]);

  // Load chat conversations on mount
  const loadChats = useCallback(async () => {
    setIsLoadingChats(true);
    try {
      const data = await getChatsApi();
      setChats(data);
      // If there are previous chats and none selected, leave activeChatId null to show Welcome Screen
      // or user can click into an existing conversation
    } catch (err) {
      showErrorToast(getErrorMessage(err), 'Failed to load conversations');
    } finally {
      setIsLoadingChats(false);
    }
  }, [showErrorToast]);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  // Load messages when active chat changes
  const loadMessages = useCallback(
    async (chatId: number) => {
      setIsLoadingMessages(true);
      setStreamError(null);
      try {
        const data = await getMessagesApi(chatId);
        setMessages(data);
      } catch (err) {
        showErrorToast(getErrorMessage(err), 'Failed to load chat history');
      } finally {
        setIsLoadingMessages(false);
      }
    },
    [showErrorToast]
  );

  const handleSelectChat = (chatId: number) => {
    if (isStreaming) {
      abortControllerRef.current?.abort();
      setIsStreaming(false);
    }
    setActiveChatId(chatId);
    loadMessages(chatId);
  };

  const handleNewChat = () => {
    if (isStreaming) {
      abortControllerRef.current?.abort();
      setIsStreaming(false);
    }
    setActiveChatId(null);
    setMessages([]);
    setStreamError(null);
  };

  const handleDeleteChat = async (chatId: number) => {
    try {
      await deleteChatApi(chatId);
      setChats((prev) => prev.filter((c) => c.id !== chatId));
      if (activeChatId === chatId) {
        setActiveChatId(null);
        setMessages([]);
      }
    } catch (err) {
      showErrorToast(getErrorMessage(err), 'Failed to delete conversation');
    }
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isStreaming) return;

    setStreamError(null);
    let currentChatId = activeChatId;

    // If no chat is active, create a new chat first
    if (!currentChatId) {
      try {
        const trimmedTitle =
          content.length > 35 ? `${content.substring(0, 32)}...` : content;
        const newChat = await createChatApi(trimmedTitle);
        setChats((prev) => [newChat, ...prev]);
        setActiveChatId(newChat.id);
        currentChatId = newChat.id;
      } catch (err) {
        const msg = getErrorMessage(err);
        showErrorToast(msg, 'Unable to initialize chat');
        return;
      }
    }

    // 1. Optimistic user message
    const tempUserMessage: Message = {
      id: -Date.now(),
      chat_id: currentChatId,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };

    // 2. Empty assistant message placeholder for streaming
    const tempAssistantMessage: Message = {
      id: -(Date.now() + 1),
      chat_id: currentChatId,
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMessage, tempAssistantMessage]);
    setIsStreaming(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    await streamChatApi({
      chatId: currentChatId,
      content,
      onToken: (token) => {
        setMessages((prev) => {
          const next = [...prev];
          const lastIndex = next.length - 1;
          if (lastIndex >= 0 && next[lastIndex].role === 'assistant') {
            next[lastIndex] = {
              ...next[lastIndex],
              content: next[lastIndex].content + token,
            };
          }
          return next;
        });
      },
      onDone: () => {
        setIsStreaming(false);
        abortControllerRef.current = null;
        // Fetch accurate persisted messages
        if (currentChatId) {
          getMessagesApi(currentChatId)
            .then(setMessages)
            .catch(() => {});
        }
      },
      onError: (err) => {
        setIsStreaming(false);
        abortControllerRef.current = null;
        setStreamError(err.message || 'Failed to complete verified response.');
        // Remove empty assistant placeholder if nothing arrived
        setMessages((prev) => {
          const next = [...prev];
          const lastIndex = next.length - 1;
          if (lastIndex >= 0 && next[lastIndex].role === 'assistant' && !next[lastIndex].content) {
            next.pop();
          }
          return next;
        });
      },
      signal: controller.signal,
    });
  };

  const activeChat = chats.find((c) => c.id === activeChatId);

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 overflow-hidden">
      {/* Sidebar with Chat History & Profile */}
      <ChatSidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        isLoadingChats={isLoadingChats}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Chat Workspace */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-white">
        {/* Chat Header Bar */}
        <header className="h-14 border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between shrink-0 bg-white shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
              aria-label="Open conversation sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-slate-900 truncate">
                {activeChat ? activeChat.title : 'New Policy Inquiry'}
              </h2>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <Shield className="w-3 h-3 text-sky-600" />
                <span>Grounded in Company Policy Manuals</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleNewChat}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Chat</span>
            </button>
          </div>
        </header>

        {/* Chat Messages Body */}
        <div
          ref={messageContainerRef}
          className="flex-1 overflow-y-auto flex flex-col min-h-0 bg-white"
        >
          {isLoadingMessages ? (
            <div className="flex-1 flex items-center justify-center">
              <LoadingSpinner size="md" text="Loading conversation..." />
            </div>
          ) : !activeChatId && messages.length === 0 ? (
            <WelcomeScreen onSelectPrompt={handleSendMessage} />
          ) : messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400">
              <Sparkles className="w-8 h-8 text-sky-500 mb-2 opacity-80" />
              <p className="text-xs font-medium text-slate-600">Conversation started</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Type your policy question below to receive an answer with source citations.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100/60 pb-6">
              {messages.map((message, index) => {
                const isLast = index === messages.length - 1;
                return (
                  <ChatMessage
                    key={message.id || index}
                    message={message}
                    isStreaming={isStreaming && isLast && message.role === 'assistant'}
                  />
                );
              })}
            </div>
          )}

          {/* Stream Error Banner */}
          {streamError && (
            <div className="p-4 max-w-3xl mx-auto w-full">
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-rose-800">Unable to generate response</p>
                  <p className="mt-0.5">{streamError}</p>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Message Input */}
        <ChatInput
          onSendMessage={handleSendMessage}
          onStopStreaming={handleStopStreaming}
          isStreaming={isStreaming}
        />
      </div>

      <ToastContainer />
    </div>
  );
};
