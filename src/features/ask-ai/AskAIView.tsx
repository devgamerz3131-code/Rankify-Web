import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import {
  promptChatHistoryService,
  PromptChatItem,
} from '@/services/prompt-chat-history';
import { PromptSidebar } from './components/PromptSidebar';
import { PromptChatArea } from './components/PromptChatArea';
import { RankifyAIComingSoonModal } from './components/RankifyAIComingSoonModal';

export const AskAIView: React.FC = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState<PromptChatItem[]>(() =>
    promptChatHistoryService.getChats()
  );
  const [activeChat, setActiveChat] = useState<PromptChatItem | null>(() =>
    promptChatHistoryService.getActiveChat()
  );
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [comingSoonModalOpen, setComingSoonModalOpen] = useState(false);

  useEffect(() => {
    return promptChatHistoryService.subscribe((updatedList) => {
      setChats(updatedList);
      setActiveChat(promptChatHistoryService.getActiveChat());
    });
  }, []);

  const handleSelectChat = (id: string) => {
    promptChatHistoryService.setActiveChatId(id);
    setActiveChat(promptChatHistoryService.getActiveChat());
    setMobileSidebarOpen(false);
  };

  const handleNewDoubt = () => {
    setActiveChat(null);
    setMobileSidebarOpen(false);
  };

  return (
    <div className="w-full h-[calc(100vh-130px)] min-h-[580px] rounded-3xl border border-slate-200/80 dark:border-white/10 bg-card overflow-hidden flex shadow-2xl relative select-none">
      {/* Desktop Left Sidebar */}
      <div className="hidden md:block w-72 lg:w-80 h-full shrink-0">
        <PromptSidebar
          chats={chats}
          activeId={activeChat?.id || ''}
          onSelectChat={handleSelectChat}
          onNewDoubt={handleNewDoubt}
          onOpenComingSoonModal={() => setComingSoonModalOpen(true)}
        />
      </div>

      {/* Mobile Drawer (Left overlay) */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative w-4/5 max-w-xs h-full bg-card shadow-2xl z-10">
            <PromptSidebar
              chats={chats}
              activeId={activeChat?.id || ''}
              onSelectChat={handleSelectChat}
              onNewDoubt={handleNewDoubt}
              onOpenComingSoonModal={() => setComingSoonModalOpen(true)}
              onCloseMobile={() => setMobileSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Prompt Generator & Launcher Arena */}
      <div className="flex-1 h-full flex flex-col overflow-hidden">
        <PromptChatArea
          key={activeChat?.id || 'new_prompt'}
          chat={activeChat}
          onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          onOpenComingSoonModal={() => setComingSoonModalOpen(true)}
          userId={user?.uid}
        />
      </div>

      {/* Rankify AI "Coming Soon" Modal */}
      <RankifyAIComingSoonModal
        isOpen={comingSoonModalOpen}
        onClose={() => setComingSoonModalOpen(false)}
      />
    </div>
  );
};
