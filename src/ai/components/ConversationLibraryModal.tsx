import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  Pin,
  Star,
  Trash2,
  Edit2,
  Check,
  Archive,
  MessageSquare,
  Clock,
  BookOpen,
  Zap,
  Atom,
  Calculator,
  Calendar,
  Filter,
  ArrowRight,
} from 'lucide-react';
import { Conversation, DetectedSubject } from '../model/types';
import { TimeFilterOption } from './ChatSidebar';

interface ConversationLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  activeId: string | null;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onRenameChat: (id: string, newTitle: string) => void;
  onTogglePin: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onNewChat: () => void;
}

export const ConversationLibraryModal: React.FC<ConversationLibraryModalProps> = ({
  isOpen,
  onClose,
  conversations,
  activeId,
  onSelectChat,
  onDeleteChat,
  onRenameChat,
  onTogglePin,
  onToggleFavorite,
  onNewChat,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [groupBy, setGroupBy] = useState<'date' | 'subject'>('date');
  const [filterType, setFilterType] = useState<TimeFilterOption>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [archivedIds, setArchivedIds] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const toggleArchive = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setArchivedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleStartRename = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id);
    setEditTitle(currentTitle);
  };

  const handleSaveRename = (id: string, e: React.FormEvent | React.MouseEvent) => {
    e.stopPropagation();
    if (e.preventDefault) e.preventDefault();
    if (editTitle.trim()) {
      onRenameChat(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const getSubjectIcon = (subj?: DetectedSubject) => {
    switch (subj) {
      case 'Physics':
        return <Zap className="w-4 h-4 text-blue-500 shrink-0" />;
      case 'Chemistry':
        return <Atom className="w-4 h-4 text-emerald-500 shrink-0" />;
      case 'Mathematics':
        return <Calculator className="w-4 h-4 text-purple-500 shrink-0" />;
      default:
        return <BookOpen className="w-4 h-4 text-slate-400 shrink-0" />;
    }
  };

  // Filter conversations
  const filteredList = conversations.filter((c) => {
    const isArchived = archivedIds.has(c.id);
    if (filterType === 'all' && isArchived) return false;
    if (filterType === 'pinned' && !c.pinned) return false;
    if (filterType === 'favorites' && !c.isFavorite && !c.messages.some((m) => m.isFavorite))
      return false;

    if (!searchQuery.trim()) return true;

    const q = searchQuery.toLowerCase();
    const titleMatch = c.title.toLowerCase().includes(q);
    const subjectMatch = c.detectedSubject?.toLowerCase().includes(q);
    const chapterMatch = c.detectedChapter?.name.toLowerCase().includes(q);
    const messageMatch = c.messages.some((m) => m.content.toLowerCase().includes(q));

    return titleMatch || subjectMatch || chapterMatch || messageMatch;
  });

  // Grouping logic
  const renderGroupedConversations = () => {
    if (filteredList.length === 0) {
      return (
        <div className="p-8 text-center text-sm text-muted-foreground space-y-2">
          <MessageSquare className="w-8 h-8 mx-auto text-muted-foreground/60" />
          <p className="font-semibold">No study conversations found.</p>
          <p className="text-xs">Try searching for a topic or start a new chat!</p>
        </div>
      );
    }

    if (groupBy === 'subject') {
      const subjects: DetectedSubject[] = ['Physics', 'Chemistry', 'Mathematics', 'General CBSE'];
      return subjects.map((subj) => {
        const groupItems = filteredList.filter(
          (c) => (c.detectedSubject || 'General CBSE') === subj
        );
        if (groupItems.length === 0) return null;

        return (
          <div key={subj} className="space-y-2 mb-6">
            <div className="flex items-center gap-2 px-1 text-xs font-black uppercase tracking-wider text-muted-foreground">
              {getSubjectIcon(subj)}
              <span>{subj} ({groupItems.length})</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {groupItems.map((conv) => renderCard(conv))}
            </div>
          </div>
        );
      });
    }

    // Group by Date (Pinned first, then Today, Yesterday, Earlier)
    const pinned = filteredList.filter((c) => c.pinned);
    const unpinned = filteredList.filter((c) => !c.pinned);

    return (
      <div className="space-y-5">
        {pinned.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1 px-1">
              <Pin className="w-3.5 h-3.5 fill-current" />
              <span>Pinned Sessions ({pinned.length})</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {pinned.map((conv) => renderCard(conv))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <span className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1 px-1">
            <Clock className="w-3.5 h-3.5" />
            <span>All Study Sessions ({unpinned.length})</span>
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {unpinned.map((conv) => renderCard(conv))}
          </div>
        </div>
      </div>
    );
  };

  const renderCard = (conv: Conversation) => {
    const isActive = conv.id === activeId;
    const isEditing = editingId === conv.id;
    const isArchived = archivedIds.has(conv.id);

    return (
      <div
        key={conv.id}
        onClick={() => {
          onSelectChat(conv.id);
          onClose();
        }}
        className={`p-3.5 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between ${
          isActive
            ? 'bg-purple-500/10 border-purple-500/50 shadow-sm'
            : 'bg-card border-border hover:border-purple-500/40 hover:shadow-md'
        }`}
      >
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              {getSubjectIcon(conv.detectedSubject)}
              {isEditing ? (
                <form
                  onSubmit={(e) => handleSaveRename(conv.id, e)}
                  className="flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    autoFocus
                    className="h-7 px-2 rounded-lg bg-background text-xs text-foreground border border-purple-500 focus:outline-hidden font-bold"
                  />
                  <button
                    type="submit"
                    className="p-1 rounded text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </form>
              ) : (
                <p className="font-bold text-xs sm:text-sm text-foreground truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  {conv.title}
                </p>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {conv.pinned && <Pin className="w-3.5 h-3.5 text-purple-500 fill-purple-500" />}
              {conv.isFavorite && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
            </div>
          </div>

          {conv.detectedChapter && (
            <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20 mb-2 truncate max-w-full">
              {conv.detectedChapter.name}
            </span>
          )}

          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
            {conv.messages.length > 0
              ? conv.messages[conv.messages.length - 1].content
              : 'Empty session'}
          </p>
        </div>

        {/* Bottom Actions Bar */}
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-border/60 text-[10px] text-muted-foreground">
          <span>
            {conv.messages.length} msgs •{' '}
            {new Date(conv.updatedAt || conv.createdAt).toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
            })}
          </span>

          <div
            className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onTogglePin(conv.id);
              }}
              className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-purple-500"
              title={conv.pinned ? 'Unpin' : 'Pin'}
            >
              <Pin className="w-3 h-3" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(conv.id);
              }}
              className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-amber-500"
              title={conv.isFavorite ? 'Unfavorite' : 'Favorite'}
            >
              <Star className="w-3 h-3" />
            </button>

            <button
              type="button"
              onClick={(e) => handleStartRename(conv.id, conv.title, e)}
              className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
              title="Rename"
            >
              <Edit2 className="w-3 h-3" />
            </button>

            <button
              type="button"
              onClick={(e) => toggleArchive(conv.id, e)}
              className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-blue-500"
              title={isArchived ? 'Unarchive' : 'Archive'}
            >
              <Archive className="w-3 h-3" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteChat(conv.id);
              }}
              className="p-1 rounded-md hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500"
              title="Delete"
            >
              <Trash2 className="w-3 h-3" />
            </button>

            <button
              type="button"
              onClick={() => {
                onSelectChat(conv.id);
                onClose();
              }}
              className="ml-1 px-2 py-0.5 rounded-lg bg-purple-600 text-white font-bold text-[10px] flex items-center gap-1 shadow-2xs"
            >
              <span>Continue</span>
              <ArrowRight className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-4xl h-[85vh] rounded-3xl bg-card border border-border shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between shrink-0 bg-card/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-purple-600/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-base sm:text-lg text-foreground">
                Conversation Library
              </h2>
              <p className="text-xs text-muted-foreground">
                Search, group, favorite, and continue all your AI study sessions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onNewChat();
                onClose();
              }}
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            >
              <span>New Session</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar: Search, Filter & Grouping */}
        <div className="p-3 sm:p-4 border-b border-border bg-muted/30 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations by title, subject, chapter or keyword..."
              className="w-full h-9 pl-9 pr-8 rounded-xl bg-card border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-purple-500 font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Grouping Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground hidden sm:inline">
              Group by:
            </span>
            <div className="flex items-center gap-1 p-0.5 bg-card border border-border rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setGroupBy('date')}
                className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                  groupBy === 'date'
                    ? 'bg-purple-600 text-white shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Date
              </button>
              <button
                type="button"
                onClick={() => setGroupBy('subject')}
                className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                  groupBy === 'subject'
                    ? 'bg-purple-600 text-white shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Subject
              </button>
            </div>
          </div>
        </div>

        {/* Conversations Grid View */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {renderGroupedConversations()}
        </div>
      </motion.div>
    </div>
  );
};
