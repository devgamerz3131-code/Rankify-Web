import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Sparkles,
  User,
  Paperclip,
  Mic,
  Copy,
  Check,
  Plus,
  Menu,
  BookOpen,
  ArrowRight,
  Zap,
  Image as ImageIcon,
  X,
} from 'lucide-react';
import { ChatConversation, ChatMessage, SubjectType } from './models/ai-tutor';
import { localChatStore } from './services/local-chat-store';
import {
  detectSubjectAndChapter,
  generateStructuredStudyPrompt,
} from './services/auto-detector';
import { ConversationHistoryDrawer } from './components/ConversationHistoryDrawer';
import toast from 'react-hot-toast';

const SUGGESTIONS = [
  { text: 'What is Current Electricity?', subject: 'Physics', chapter: 'Current Electricity' },
  { text: 'Derive Lens Maker Formula step-by-step', subject: 'Physics', chapter: 'Ray Optics and Optical Instruments' },
  { text: 'Explain SN1 vs SN2 reaction mechanisms', subject: 'Chemistry', chapter: 'Haloalkanes and Haloarenes' },
  { text: 'How to evaluate definite integral of sin^4 x', subject: 'Mathematics', chapter: 'Integrals' },
];

export const RankifyAITutor: React.FC = () => {
  const [conversations, setConversations] = useState<ChatConversation[]>(() =>
    localChatStore.getConversations()
  );
  const [activeConvId, setActiveConvId] = useState<string>(
    () => localChatStore.getConversations()[0]?.id || ''
  );
  const [input, setInput] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [copiedMap, setCopiedMap] = useState<Record<string, boolean>>({});
  const [continuedMap, setContinuedMap] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return localChatStore.subscribe(() => {
      const list = localChatStore.getConversations();
      setConversations(list);
    });
  }, []);

  const activeConv = conversations.find((c) => c.id === activeConvId) || conversations[0] || null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConv?.messages.length, activeConv?.messages]);

  const handleNewChat = () => {
    setActiveConvId('');
    setDrawerOpen(false);
  };

  const handleSendMessage = (customText?: string) => {
    const textToSend = (customText || input).trim();
    if (!textToSend) return;

    // Auto detect subject & chapter
    const { subject, chapter } = detectSubjectAndChapter(textToSend);

    let targetConvId = activeConvId;
    if (!targetConvId || !localChatStore.getConversationById(targetConvId)) {
      const newConv = localChatStore.createConversation(textToSend, subject, chapter);
      targetConvId = newConv.id;
      setActiveConvId(newConv.id);
    }

    // 1. User Message
    const userMsg: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp: new Date().toISOString(),
    };
    localChatStore.addMessageToConversation(targetConvId, userMsg);

    // 2. Initial Assistant Message ("Generating the best AI prompt...")
    const assistantMsgId = `msg_ast_${Date.now()}`;
    const assistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      text: 'Generating the best AI prompt...',
      question: textToSend,
      subject,
      chapter,
      timestamp: new Date().toISOString(),
      isGenerating: true,
    };
    localChatStore.addMessageToConversation(targetConvId, assistantMsg);

    setInput('');

    // 3. Resolve generating state with structured study prompt
    setTimeout(() => {
      const structuredPrompt = generateStructuredStudyPrompt(textToSend, subject, chapter);
      localChatStore.updateMessageInConversation(targetConvId, assistantMsgId, {
        generatedPrompt: structuredPrompt,
        isGenerating: false,
      });
    }, 600);
  };

  const handleCopyPrompt = async (msgId: string, promptText: string) => {
    try {
      await navigator.clipboard.writeText(promptText);
      setCopiedMap((prev) => ({ ...prev, [msgId]: true }));
      toast.success('Prompt copied to clipboard!');
      setTimeout(() => {
        setCopiedMap((prev) => ({ ...prev, [msgId]: false }));
      }, 2000);
    } catch {
      toast.error('Failed to copy prompt');
    }
  };

  const handleContinue = (msgId: string) => {
    setContinuedMap((prev) => ({ ...prev, [msgId]: true }));
    toast.success('Study prompt saved! Ready for deep learning session.');
  };

  return (
    <div className="w-full h-[calc(100vh-130px)] min-h-[580px] rounded-3xl border border-slate-200/80 dark:border-white/10 bg-card overflow-hidden flex shadow-2xl relative select-none">
      {/* Desktop Left Drawer */}
      <div className="hidden md:block w-72 lg:w-80 h-full shrink-0">
        <ConversationHistoryDrawer
          conversations={conversations}
          activeId={activeConv?.id || ''}
          onSelectConversation={(id) => setActiveConvId(id)}
          onNewChat={handleNewChat}
          onRenameConversation={(id, newTitle) =>
            localChatStore.renameConversation(id, newTitle)
          }
          onDeleteConversation={(id) => localChatStore.deleteConversation(id)}
        />
      </div>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="relative w-4/5 max-w-xs h-full bg-card shadow-2xl z-10">
            <ConversationHistoryDrawer
              conversations={conversations}
              activeId={activeConv?.id || ''}
              onSelectConversation={(id) => setActiveConvId(id)}
              onNewChat={handleNewChat}
              onRenameConversation={(id, newTitle) =>
                localChatStore.renameConversation(id, newTitle)
              }
              onDeleteConversation={(id) => localChatStore.deleteConversation(id)}
              onCloseMobile={() => setDrawerOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Chat Screen Area */}
      <div className="flex-1 h-full flex flex-col overflow-hidden bg-background">
        {/* Top Header */}
        <div className="p-3.5 sm:px-6 border-b border-slate-200/80 dark:border-white/10 bg-card/80 backdrop-blur-xl flex items-center justify-between gap-3 shrink-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDrawerOpen(!drawerOpen)}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-muted-foreground hover:text-foreground md:hidden cursor-pointer"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-black text-xs sm:text-sm text-foreground">
                  Rankify AI Tutor
                </h2>
                <span className="text-[10px] text-muted-foreground">
                  Structured Study Prompt Crafter
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleNewChat}
            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-500/20 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {!activeConv || activeConv.messages.length === 0 ? (
            /* Empty State */
            <div className="max-w-xl mx-auto py-12 text-center space-y-6">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 mx-auto flex items-center justify-center text-white shadow-2xl shadow-purple-500/30">
                <Zap className="w-8 h-8" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-xl font-black text-foreground">Rankify AI Tutor</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  Ask any CBSE Class 12 doubt. Rankify automatically detects subject and chapter, generating the highest-yield study prompt.
                </p>
              </div>

              {/* Suggestions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left pt-2">
                {SUGGESTIONS.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(item.text)}
                    className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-card hover:border-purple-500 hover:shadow-md transition-all text-left space-y-1 cursor-pointer group"
                  >
                    <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 block">
                      {item.subject} • {item.chapter}
                    </span>
                    <p className="text-xs font-medium text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400">
                      "{item.text}"
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Messages List */
            <div className="max-w-3xl mx-auto space-y-6">
              {activeConv.messages.map((msg) => {
                if (msg.role === 'user') {
                  return (
                    <div key={msg.id} className="flex gap-3 justify-end">
                      <div className="p-4 rounded-3xl rounded-tr-sm bg-purple-600 text-white max-w-[85%] shadow-xs">
                        <p className="text-xs sm:text-sm font-medium">{msg.text}</p>
                      </div>
                      <div className="w-8 h-8 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-black text-xs flex items-center justify-center shrink-0 border border-purple-200 dark:border-purple-800/40">
                        U
                      </div>
                    </div>
                  );
                }

                // Assistant Message Card
                return (
                  <div key={msg.id} className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
                      <Sparkles className="w-4 h-4" />
                    </div>

                    <div className="p-5 rounded-3xl rounded-tl-sm bg-card border border-purple-500/30 text-foreground max-w-[92%] sm:max-w-[88%] space-y-4 shadow-xl">
                      {msg.isGenerating ? (
                        /* Typing / Generating State */
                        <div className="flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400 py-2">
                          <Sparkles className="w-4 h-4 animate-spin" />
                          <span>Generating the best AI prompt...</span>
                          <span className="animate-pulse font-mono">|</span>
                        </div>
                      ) : (
                        /* Resolved State */
                        <>
                          {/* Subject & Chapter Chips */}
                          <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 dark:border-white/5 pb-2.5">
                            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40">
                              ⚡ {msg.subject}
                            </span>
                            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-foreground border border-slate-200/80 dark:border-slate-700/60">
                              📖 {msg.chapter}
                            </span>
                          </div>

                          {/* Formatted Generated Prompt Box */}
                          <pre className="p-4 rounded-2xl bg-slate-900 text-purple-100 text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto border border-purple-500/20 shadow-inner">
                            {msg.generatedPrompt}
                          </pre>

                          {/* Actions: Copy Prompt & Continue */}
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <button
                              onClick={() =>
                                msg.generatedPrompt && handleCopyPrompt(msg.id, msg.generatedPrompt)
                              }
                              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-500/20 transition cursor-pointer"
                            >
                              {copiedMap[msg.id] ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                                  <span>Prompt Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy Prompt</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => handleContinue(msg.id)}
                              className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer border ${
                                continuedMap[msg.id]
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border-emerald-500/30'
                                  : 'bg-slate-100 dark:bg-slate-800 text-foreground hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200/80 dark:border-slate-700/60'
                              }`}
                            >
                              <span>{continuedMap[msg.id] ? 'Continued ✓' : 'Continue'}</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Fixed Input Bar */}
        <div className="p-3 sm:p-4 bg-card/90 backdrop-blur-xl border-t border-slate-200/80 dark:border-white/10 shrink-0 space-y-2">
          <div className="flex items-center gap-2 bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/80 rounded-3xl p-1.5 sm:p-2 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all shadow-inner">
            {/* Attachment Button (UI Only) */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={() => toast.success('Question image attached (UI Demo)')}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 sm:p-2.5 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 text-muted-foreground hover:text-foreground transition cursor-pointer shrink-0"
              title="Attach File (UI Only)"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Input Field */}
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Ask your Physics, Chemistry, or Maths doubt..."
              rows={1}
              className="flex-1 bg-transparent border-0 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none py-2 px-1 max-h-32"
            />

            {/* Mic Button (UI Only) */}
            <button
              onClick={() => toast('Voice Mic ready (UI Demo)', { icon: '🎙️' })}
              className="p-2 sm:p-2.5 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 text-muted-foreground hover:text-foreground transition cursor-pointer shrink-0"
              title="Voice Mic (UI Only)"
            >
              <Mic className="w-4 h-4" />
            </button>

            {/* Send Button */}
            <button
              onClick={() => handleSendMessage()}
              disabled={!input.trim()}
              className="p-2 sm:p-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white transition-all shadow-md shadow-purple-500/30 cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
