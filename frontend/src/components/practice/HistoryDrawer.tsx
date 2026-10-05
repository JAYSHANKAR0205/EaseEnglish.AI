import React, { useEffect, useState } from 'react';
import { X, MessageSquare, Plus, Calendar, Trash2, CheckCircle2 } from 'lucide-react';
import { usePractice } from '../../contexts/PracticeContext';
import { Button } from '../common/Button';

export const HistoryDrawer: React.FC = () => {
  const {
    isHistoryOpen,
    toggleHistory,
    conversations,
    currentConversation,
    loadConversation,
    deleteConversation,
    newChat,
    isSending,
  } = usePractice();

  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isHistoryOpen) {
        toggleHistory(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isHistoryOpen, toggleHistory]);

  if (!isHistoryOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={() => toggleHistory(false)}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div
          className="w-screen max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl p-6 flex flex-col justify-between"
          role="dialog"
          aria-modal="true"
          aria-label="Conversation History"
        >
          {/* Header */}
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">Conversation History</h3>
              </div>
              <button
                onClick={() => toggleHistory(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                aria-label="Close history drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* New Chat Button */}
            <div className="mt-4 mb-6">
              <Button
                variant="primary"
                size="md"
                className="w-full"
                leftIcon={<Plus className="w-4 h-4 text-slate-950" />}
                onClick={() => {
                  toggleHistory(false);
                  newChat();
                }}
                isLoading={isSending}
              >
                Start New Chat
              </Button>
            </div>

            {/* Conversation List */}
            <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-230px)] pr-1">
              {conversations.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  No conversation history yet. Start speaking to record your sessions!
                </div>
              ) : (
                conversations.map((item) => {
                  const isActive = currentConversation?._id === item.id;
                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-2xl border transition-all duration-200 ${
                        isActive
                          ? 'bg-slate-800 border-emerald-500/50 shadow-md shadow-emerald-500/10'
                          : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
                      }`}
                    >
                      <div
                        className="cursor-pointer"
                        onClick={() => loadConversation(item.id)}
                      >
                        {/* Header: Title + Active Badge + Delete Button */}
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <h4 className="text-sm font-semibold text-slate-200 truncate flex-1 min-w-0 hover:text-emerald-400 transition-colors">
                            {item.title}
                          </h4>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {isActive && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                <CheckCircle2 className="w-3 h-3" /> Active
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingId((prev) => (prev === item.id ? null : item.id));
                              }}
                              className={`p-1.5 rounded-lg transition ${
                                deletingId === item.id
                                  ? 'text-rose-400 bg-rose-500/20'
                                  : 'text-slate-400 hover:text-rose-400 hover:bg-slate-800'
                              }`}
                              aria-label="Delete conversation"
                              title="Delete conversation"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {item.lastSnippet && (
                          <p className="text-xs text-slate-400 line-clamp-1 mb-2">
                            {item.lastSnippet}
                          </p>
                        )}

                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <span className="capitalize px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300">
                            {item.level}
                          </span>
                          <span className="capitalize px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300">
                            {item.mode}
                          </span>
                          <span className="flex items-center gap-1 ml-auto text-slate-400">
                            <Calendar className="w-3 h-3" />
                            {new Date(item.updatedAt).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Inline Compact Deletion Confirmation UI */}
                      {deletingId === item.id && (
                        <div
                          className="mt-2.5 pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2 animate-in fade-in duration-150"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="text-[11px] text-rose-300 font-medium">Delete this conversation?</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={async (e) => {
                                e.stopPropagation();
                                await deleteConversation(item.id);
                                setDeletingId(null);
                              }}
                              className="px-2.5 py-1 text-[11px] font-semibold bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition shadow-sm shadow-rose-500/30"
                            >
                              Delete
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingId(null);
                              }}
                              className="px-2 py-1 text-[11px] font-medium text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
            Encrypted MongoDB Storage • User-Owned Data Only
          </div>
        </div>
      </div>
    </div>
  );
};
