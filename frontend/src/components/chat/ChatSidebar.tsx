import React, { useState } from 'react';
import {
  Plus,
  MessageSquare,
  Trash2,
  LogOut,
  Search,
  Shield,
  User as UserIcon,
  X,
  FileQuestion,
} from 'lucide-react';
import { Chat } from '../../types/chat';
import { useAuth } from '../../context/AuthContext';
import { formatRelativeTime } from '../../utils/date';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

interface ChatSidebarProps {
  chats: Chat[];
  activeChatId: number | null;
  onSelectChat: (chatId: number) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: number) => Promise<void>;
  isLoadingChats: boolean;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  isLoadingChats,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingChat, setDeletingChat] = useState<Chat | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredChats = chats.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleConfirmDelete = async () => {
    if (!deletingChat) return;
    setIsDeleting(true);
    try {
      await onDeleteChat(deletingChat.id);
      setDeletingChat(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const sidebarContent = (
    <aside className="w-72 sm:w-80 h-full flex flex-col bg-slate-900 text-slate-100 border-r border-slate-800">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-500 text-white flex items-center justify-center font-bold text-sm shadow-sm shadow-sky-500/30">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm tracking-tight text-white">PolicyPilot</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-500/20 text-sky-400 border border-sky-500/30">
                AI
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-none mt-0.5">Policy Assistant</p>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <button
          onClick={() => {
            onNewChat();
            onCloseMobile();
          }}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-medium text-xs shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Conversation</span>
        </button>
      </div>

      {/* Search Bar */}
      {chats.length > 3 && (
        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/80 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>
      )}

      {/* Chat History List */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1">
        <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Chat History
        </div>

        {isLoadingChats ? (
          <div className="p-4 space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-9 rounded-lg bg-slate-800/60 animate-pulse" />
            ))}
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="text-center py-8 px-4 text-slate-400">
            <FileQuestion className="w-8 h-8 mx-auto text-slate-600 mb-2 opacity-60" />
            <p className="text-xs">
              {searchQuery ? 'No matching chats found' : 'No previous conversations'}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {searchQuery ? 'Try another keyword' : 'Start a new conversation above'}
            </p>
          </div>
        ) : (
          filteredChats.map((chat) => {
            const isActive = chat.id === activeChatId;
            return (
              <div
                key={chat.id}
                className={`group relative flex items-center justify-between rounded-lg px-2.5 py-2 text-xs transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-slate-800 text-white font-medium border border-slate-700/80'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-slate-100'
                }`}
                onClick={() => {
                  onSelectChat(chat.id);
                  onCloseMobile();
                }}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                  <MessageSquare
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isActive ? 'text-sky-400' : 'text-slate-500 group-hover:text-slate-400'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs leading-snug">{chat.title || 'Untitled'}</p>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      {formatRelativeTime(chat.created_at)}
                    </p>
                  </div>
                </div>

                {/* Delete button (shows on hover or active) */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeletingChat(chat);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-700/80 text-slate-400 hover:text-rose-400 transition-opacity"
                  title="Delete conversation"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* User Profile & Logout */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-slate-700 text-slate-200 flex items-center justify-center font-medium text-xs shrink-0">
              <UserIcon className="w-4 h-4 text-slate-300" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-200 truncate">{user?.full_name}</p>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400 truncate max-w-[120px]">
                  {user?.email}
                </span>
                <span className="px-1 rounded text-[9px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Employee
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors shrink-0"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingChat}
        onClose={() => setDeletingChat(null)}
        title="Delete Conversation"
        description="Are you sure you want to delete this conversation? This will permanently remove all message history."
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeletingChat(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmDelete}
              isLoading={isDeleting}
            >
              Delete
            </Button>
          </>
        }
      >
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
          <span className="font-semibold text-slate-900">Conversation: </span>
          {deletingChat?.title}
        </div>
      </Modal>
    </aside>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <div className="hidden lg:block h-full shrink-0">{sidebarContent}</div>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
