import React, { useState, useRef } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Paperclip,
  Mic,
  MicOff,
  Copy,
  Check,
  ExternalLink,
  RotateCcw,
  Trash2,
  Share2,
  Image as ImageIcon,
  X,
  ChevronDown,
  Menu,
  Lock,
  Zap,
  ArrowUpRight,
  BookOpen,
} from 'lucide-react';
import { PromptChatItem, promptChatHistoryService } from '@/services/prompt-chat-history';
import {
  generateStudyPrompt,
  detectSubjectAndChapter,
  CBSE_12_CHAPTERS,
} from '@/services/prompt-engine';
import { launchAIApp, copyToClipboard } from '@/services/ai-launcher';
import toast from 'react-hot-toast';

interface PromptChatAreaProps {
  chat: PromptChatItem | null;
  onToggleSidebar?: () => void;
  onOpenComingSoonModal: () => void;
  userId?: string;
}

const EXAMPLE_SUGGESTIONS = [
  {
    subject: 'Physics' as const,
    chapter: 'Current Electricity',
    text: 'Explain Current Electricity & Kirchhoff’s Laws step-by-step with loop rules',
    tag: '3-Mark Board Q',
  },
  {
    subject: 'Chemistry' as const,
    chapter: 'Haloalkanes and Haloarenes',
    text: 'Explain SN1 vs SN2 reaction mechanisms with carbocation stability and stereochemical inversion',
    tag: 'Organic Mechanism',
  },
  {
    subject: 'Physics' as const,
    chapter: 'Ray Optics and Optical Instruments',
    text: 'Derive Lens Maker’s Formula with Cartesian sign conventions and list 2 applications',
    tag: '5-Mark Derivation',
  },
  {
    subject: 'Mathematics' as const,
    chapter: 'Integrals',
    text: 'Solve definite integral ∫₀^(π/2) (sin^4(x) / (sin^4(x) + cos^4(x))) dx showing all properties',
    tag: 'Calculus Property',
  },
];

export const PromptChatArea: React.FC<PromptChatAreaProps> = ({
  chat,
  onToggleSidebar,
  onOpenComingSoonModal,
  userId,
}) => {
  const [input, setInput] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<'Auto' | 'Physics' | 'Chemistry' | 'Mathematics'>('Auto');
  const [attachedImage, setAttachedImage] = useState<{
    name: string;
    base64: string;
  } | null>(null);

  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleGeneratePrompt = (customQuestion?: string) => {
    const qText = (customQuestion || input).trim();
    if (!qText && !attachedImage) return;

    // Detect subject and chapter
    const overrideSub = selectedSubject === 'Auto' ? undefined : selectedSubject;
    const result = generateStudyPrompt(qText || 'Question in uploaded image/diagram', overrideSub);

    // Save prompt to history
    const newChat = promptChatHistoryService.addPromptChat(
      {
        question: qText || 'Uploaded Question Diagram',
        generatedPrompt: result.generatedPrompt,
        subject: result.subject,
        chapter: result.chapter,
      },
      userId
    );

    setInput('');
    setAttachedImage(null);
    toast.success('High-Yield Masterclass Prompt Created!', { icon: '✨' });
  };

  const handleCopyPrompt = async () => {
    if (!chat?.generatedPrompt) return;
    const ok = await copyToClipboard(chat.generatedPrompt);
    if (ok) {
      setCopiedPrompt(true);
      toast.success('Prompt copied to clipboard!');
      setTimeout(() => setCopiedPrompt(false), 2000);
    }
  };

  const handleRefinePrompt = (instruction: string) => {
    if (!chat) return;
    const refinedQuery = `${chat.question} (${instruction})`;
    handleGeneratePrompt(refinedQuery);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      toast.error('File size exceeds 8MB limit');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setAttachedImage({
        name: file.name,
        base64: event.target?.result as string,
      });
      toast.success(`Attached photo: ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  const handleVoiceInput = () => {
    toast('Voice input ready! Type or speak your doubt.', { icon: '🎙️' });
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-background relative overflow-hidden select-none">
      {/* 1. Header Bar */}
      <div className="p-3.5 sm:px-6 border-b border-slate-200/80 dark:border-white/10 bg-card/80 backdrop-blur-xl flex items-center justify-between gap-3 shrink-0 z-10">
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-muted-foreground hover:text-foreground cursor-pointer transition-colors md:hidden"
              title="Toggle sidebar"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xs sm:text-sm text-foreground">
                  Rankify Master Prompt Engine
                </span>
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
              </div>
              <span className="text-[10px] text-muted-foreground hidden sm:block">
                CBSE Class 12 PCM Prompt Synthesizer
              </span>
            </div>
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-2">
          {/* Rankify AI "Coming Soon" Button */}
          <button
            onClick={onOpenComingSoonModal}
            className="px-2.5 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-500/30 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center gap-1.5 hover:bg-purple-100 transition-colors cursor-pointer"
          >
            <Bot className="w-3.5 h-3.5 text-purple-600" />
            <span className="hidden sm:inline">Rankify AI</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200 font-extrabold flex items-center gap-0.5">
              <Lock className="w-2.5 h-2.5" />
              <span>Coming Soon</span>
            </span>
          </button>

          {chat && (
            <button
              onClick={() => {
                if (confirm('Delete this doubt prompt?')) {
                  promptChatHistoryService.deleteChat(chat.id);
                }
              }}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Delete prompt"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Central Prompt & Content View */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {!chat ? (
          /* Empty State */
          <div className="max-w-2xl mx-auto py-10 text-center space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 mx-auto flex items-center justify-center text-white shadow-2xl shadow-purple-500/30">
              <Zap className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-foreground">
                Ask Any CBSE Class 12 PCM Doubt
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                Rankify understands your doubt and automatically formulates the masterclass study prompt for <strong>ChatGPT</strong> and <strong>Gemini</strong>.
              </p>
            </div>

            {/* Suggested Doubt Chips */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left pt-2">
              {EXAMPLE_SUGGESTIONS.map((item, i) => (
                <button
                  key={i}
                  onClick={() => handleGeneratePrompt(item.text)}
                  className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-card hover:border-purple-500 hover:shadow-md transition-all text-left space-y-1.5 cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                      {item.tag}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{item.subject}</span>
                  </div>
                  <p className="text-xs font-semibold text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-2">
                    {item.text}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Generated Masterclass Prompt View */
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Student Doubt Bubble */}
            <div className="flex gap-3 justify-end">
              <div className="max-w-[85%] rounded-3xl rounded-tr-sm bg-purple-600 text-white p-4 sm:p-5 shadow-md space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-white/80 border-b border-white/10 pb-1">
                  <span className="font-bold">Student Doubt</span>
                  <span>{chat.date}</span>
                </div>
                <p className="text-xs sm:text-sm font-medium">{chat.question}</p>
              </div>
              <div className="w-8 h-8 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-black text-xs flex items-center justify-center shrink-0 border border-purple-200 dark:border-purple-800/40">
                U
              </div>
            </div>

            {/* Rankify Generated Master Prompt Card */}
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <Sparkles className="w-4 h-4" />
              </div>

              <div className="flex-1 rounded-3xl rounded-tl-sm bg-card border border-purple-500/30 text-foreground p-4 sm:p-6 shadow-xl space-y-4">
                {/* Header Tag */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black px-2.5 py-1 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40">
                      {chat.subject}
                    </span>
                    <span className="text-xs font-bold text-foreground">
                      Chapter: {chat.chapter}
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800/30">
                    ⚡ Formulated for ChatGPT & Gemini
                  </span>
                </div>

                {/* Formatted Prompt Box */}
                <div className="relative group">
                  <pre className="p-4 rounded-2xl bg-slate-900 text-purple-100 text-xs leading-relaxed font-mono whitespace-pre-wrap max-h-96 overflow-y-auto border border-purple-500/20 shadow-inner">
                    {chat.generatedPrompt}
                  </pre>
                  <button
                    onClick={handleCopyPrompt}
                    className="absolute top-3 right-3 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                  >
                    {copiedPrompt ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Prompt</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Primary Action Buttons: Open ChatGPT or Gemini */}
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground block">
                    Continue & Solve With:
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* ChatGPT Button */}
                    <button
                      onClick={() => launchAIApp('chatgpt', chat.generatedPrompt)}
                      className="p-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-between shadow-lg shadow-emerald-500/20 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center font-black">
                          🟢
                        </div>
                        <span>Open in ChatGPT</span>
                      </div>
                      <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </button>

                    {/* Gemini Button */}
                    <button
                      onClick={() => launchAIApp('gemini', chat.generatedPrompt)}
                      className="p-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-between shadow-lg shadow-blue-500/20 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center font-black">
                          🔵
                        </div>
                        <span>Open in Gemini</span>
                      </div>
                      <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </button>
                  </div>
                </div>

                {/* Prompt Refinement Bar */}
                <div className="pt-2 border-t border-slate-100 dark:border-white/5 space-y-2">
                  <span className="text-[10px] font-bold text-muted-foreground">
                    Refine or Customize Prompt Focus:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => handleRefinePrompt('Focus heavily on 5-Mark Derivation steps')}
                      className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:text-foreground text-[10px] font-bold transition cursor-pointer"
                    >
                      + Add Derivation Steps
                    </button>
                    <button
                      onClick={() => handleRefinePrompt('Include numerical calculation with SI units')}
                      className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:text-foreground text-[10px] font-bold transition cursor-pointer"
                    >
                      + Add Numericals
                    </button>
                    <button
                      onClick={() => handleRefinePrompt('Explain in simple Hinglish conversational tone')}
                      className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:text-foreground text-[10px] font-bold transition cursor-pointer"
                    >
                      + Hinglish Tone
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Floating Input Dock */}
      <div className="p-3 sm:p-4 bg-card/90 backdrop-blur-xl border-t border-slate-200/80 dark:border-white/10 shrink-0 space-y-2">
        {/* Attachment preview if selected */}
        {attachedImage && (
          <div className="flex items-center justify-between p-2 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-500/30 text-xs">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-purple-600" />
              <span className="font-bold text-foreground truncate max-w-[200px]">
                {attachedImage.name}
              </span>
            </div>
            <button
              onClick={() => setAttachedImage(null)}
              className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="flex items-end gap-2 bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/80 rounded-3xl p-1.5 sm:p-2 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all shadow-inner">
          {/* Subject override selector */}
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value as any)}
            className="bg-transparent text-[11px] font-bold text-purple-700 dark:text-purple-300 focus:outline-none cursor-pointer py-2 pl-1"
          >
            <option value="Auto">Auto Detect Subject</option>
            <option value="Physics">Physics (042)</option>
            <option value="Chemistry">Chemistry (043)</option>
            <option value="Mathematics">Mathematics (041)</option>
          </select>

          {/* Attachment button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*,.pdf"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 sm:p-2.5 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 text-muted-foreground hover:text-foreground transition cursor-pointer shrink-0"
            title="Attach question photo or notes"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Input Textarea */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleGeneratePrompt();
              }
            }}
            placeholder="Type your Physics, Chemistry or Maths doubt..."
            rows={1}
            className="flex-1 bg-transparent border-0 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none py-2 px-1 max-h-32"
          />

          {/* Mic Button UI */}
          <button
            onClick={handleVoiceInput}
            className="p-2 sm:p-2.5 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 text-muted-foreground hover:text-foreground transition cursor-pointer shrink-0"
            title="Voice input"
          >
            <Mic className="w-4 h-4" />
          </button>

          {/* Generate Button */}
          <button
            onClick={() => handleGeneratePrompt()}
            disabled={!input.trim() && !attachedImage}
            className="p-2 sm:p-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white transition-all shadow-md shadow-purple-500/30 cursor-pointer shrink-0 flex items-center gap-1 font-bold text-xs"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* Footer Guarantee */}
        <p className="text-[10px] text-center text-muted-foreground">
          ⚡ 100% Offline Prompt Generator • No API Quotas • Instant ChatGPT & Gemini Launch
        </p>
      </div>
    </div>
  );
};
