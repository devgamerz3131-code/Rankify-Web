import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Paperclip,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Copy,
  Check,
  RotateCcw,
  Edit2,
  Trash2,
  Share2,
  Camera,
  Image as ImageIcon,
  FileText,
  X,
  ChevronDown,
  Info,
  CheckCircle2,
  AlertCircle,
  Menu,
} from 'lucide-react';
import { ChatMessage, ConversationSession, aiChatHistoryService } from '@/services/ai-chat-history';
import { detectSubjectAndChapter, askAITutor } from '@/services/ai-tutor-service';
import { voiceService } from '@/services/ai-voice-service';
import { MarkdownMathRenderer } from './MarkdownMathRenderer';
import { ShareCardModal } from '@/components/common/ShareCardModal';
import { OFFICIAL_CBSE_12_PCM_TEMPLATE } from '@/services/syllabus-templates';
import toast from 'react-hot-toast';

export type TutorMode =
  | 'ask-doubt'
  | 'derivations'
  | 'numerical-solver'
  | 'reaction-mechanisms'
  | 'calculus-steps'
  | 'pyq-analysis'
  | 'quick-revision';

const TUTOR_MODES: Array<{ id: TutorMode; label: string; icon: string; desc: string }> = [
  { id: 'ask-doubt', label: 'All-in-One Tutor', icon: '✨', desc: 'Standard NCERT-grounded board answer' },
  { id: 'derivations', label: 'Step Derivations', icon: '📐', desc: 'Full mathematical transformations' },
  { id: 'numerical-solver', label: 'Numericals', icon: '🔢', desc: 'Given data, formula, calculation & SI units' },
  { id: 'reaction-mechanisms', label: 'Reaction Flow', icon: '🧪', desc: 'Organic reagents, intermediate states' },
  { id: 'calculus-steps', label: 'Calculus Steps', icon: '∫', desc: 'Explicit substitutions & integrals' },
  { id: 'pyq-analysis', label: 'PYQ Drill', icon: '🏆', desc: 'Marking scheme & common exam traps' },
  { id: 'quick-revision', label: 'Short Notes', icon: '📝', desc: 'Concise formula recall sheet' },
];

const SUGGESTED_PROMPTS = [
  {
    subject: 'Physics',
    chapter: 'Ray Optics and Optical Instruments',
    prompt: "Derive the Lens Maker's Formula with Cartesian sign conventions and state 2 practical applications.",
    tag: '5-Mark Derivation',
  },
  {
    subject: 'Chemistry',
    chapter: 'Haloalkanes and Haloarenes',
    prompt: 'Explain SN1 vs SN2 mechanism in detail: kinetics, carbocation stability, and stereochemical inversion (Walden inversion).',
    tag: 'Organic Mechanism',
  },
  {
    subject: 'Mathematics',
    chapter: 'Integrals',
    prompt: 'Evaluate the definite integral ∫₀^(π/2) (sin^4(x) / (sin^4(x) + cos^4(x))) dx showing all properties of definite integrals.',
    tag: 'Calculus Property',
  },
  {
    subject: 'Chemistry',
    chapter: 'Electrochemistry',
    prompt: 'State Nernst Equation. Calculate EMF of Daniell cell at 298 K with Zn²⁺ (0.1 M) and Cu²⁺ (0.01 M).',
    tag: 'Board Numerical',
  },
];

interface ChatAreaProps {
  conversation: ConversationSession;
  onToggleSidebar?: () => void;
  userId?: string;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  conversation,
  onToggleSidebar,
  userId,
}) => {
  const [input, setInput] = useState('');
  const [selectedMode, setSelectedMode] = useState<TutorMode>('ask-doubt');
  const [activeSubject, setActiveSubject] = useState<'Physics' | 'Chemistry' | 'Mathematics'>(
    conversation.subject
  );
  const [activeChapter, setActiveChapter] = useState<string>(conversation.chapter);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [showChapterSelector, setShowChapterSelector] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareText, setShareText] = useState('');

  // Attachment state
  const [attachedImage, setAttachedImage] = useState<{
    name: string;
    base64: string;
    mimeType: string;
  } | null>(null);

  // Editing state
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setActiveSubject(conversation.subject);
    setActiveChapter(conversation.chapter);
  }, [conversation.id]);

  useEffect(() => {
    scrollToBottom();
  }, [conversation.messages, isGenerating]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Auto-detect subject and chapter while typing if not explicitly set
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);

    if (val.length > 8) {
      const detection = detectSubjectAndChapter(val);
      if (detection.detectedSubject) {
        setActiveSubject(detection.detectedSubject);
      }
      if (detection.detectedChapter) {
        setActiveChapter(detection.detectedChapter);
      }
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if ((!query && !attachedImage) || isGenerating) return;

    // Detect subject and chapter if available
    const detection = detectSubjectAndChapter(query);
    const resolvedSubject = detection.detectedSubject || activeSubject;
    const resolvedChapter = detection.detectedChapter || activeChapter;

    setActiveSubject(resolvedSubject);
    setActiveChapter(resolvedChapter);

    const userMsg: ChatMessage = {
      id: `msg_u_${Date.now()}`,
      sender: 'user',
      text: query || 'Analyze uploaded question/diagram according to CBSE NCERT standard.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      subject: resolvedSubject,
      chapter: resolvedChapter,
      image: attachedImage ? { name: attachedImage.name, url: attachedImage.base64 } : undefined,
    };

    aiChatHistoryService.addMessage(conversation.id, userMsg, userId);
    setInput('');
    const imagePayload = attachedImage ? { base64: attachedImage.base64, mimeType: attachedImage.mimeType } : null;
    setAttachedImage(null);
    setIsGenerating(true);

    try {
      const historyContext = conversation.messages.slice(-6).map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      const response = await askAITutor({
        question: userMsg.text,
        subject: resolvedSubject,
        chapter: resolvedChapter,
        mode: selectedMode as any,
        history: historyContext,
        image: imagePayload,
      });

      const aiMsg: ChatMessage = {
        id: `msg_ai_${Date.now()}`,
        sender: 'ai',
        text: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        subject: resolvedSubject,
        chapter: resolvedChapter,
        mode: selectedMode,
        isFallback: response.fallback,
      };

      aiChatHistoryService.addMessage(conversation.id, aiMsg, userId);
    } catch (err) {
      toast.error('Could not complete query. Local CBSE offline mentor was utilized.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleVoiceInput = () => {
    if (isListening) {
      voiceService.stopListening();
      setIsListening(false);
      return;
    }

    const started = voiceService.startListening(
      (transcript) => {
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      },
      (err) => {
        toast.error(`Mic error: ${err}`);
        setIsListening(false);
      },
      () => {
        setIsListening(false);
      }
    );

    if (started) {
      setIsListening(true);
      toast('Listening to your PCM doubt...', { icon: '🎙️' });
    }
  };

  const handleToggleSpeak = (msgId: string, text: string) => {
    if (speakingMessageId === msgId) {
      voiceService.stopSpeaking();
      setSpeakingMessageId(null);
      return;
    }

    voiceService.speak(
      text,
      () => setSpeakingMessageId(msgId),
      () => setSpeakingMessageId(null)
    );
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Solution copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRegenerate = async (lastUserText: string) => {
    handleSendMessage(lastUserText);
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
      const base64 = event.target?.result as string;
      setAttachedImage({
        name: file.name,
        base64,
        mimeType: file.type || 'image/jpeg',
      });
      toast.success(`Attached: ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveEdit = (msgId: string) => {
    if (!editingText.trim()) return;
    aiChatHistoryService.deleteMessage(conversation.id, msgId);
    setEditingMessageId(null);
    handleSendMessage(editingText);
    setEditingText('');
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-background relative overflow-hidden select-none">
      {/* 1. Header Navigation Bar */}
      <div className="p-3.5 sm:px-6 border-b border-slate-200/80 dark:border-white/10 bg-card/80 backdrop-blur-xl flex items-center justify-between gap-3 shrink-0 z-10">
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              title="Toggle sidebar"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xs sm:text-sm text-foreground">Rankify AI Tutor</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <span className="text-[10px] text-muted-foreground hidden sm:block">
                CBSE Class 12 NCERT PCM Specialist
              </span>
            </div>
          </div>
        </div>

        {/* Auto-detected Subject & Chapter Badge */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowChapterSelector(!showChapterSelector)}
              className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-500/30 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center gap-1.5 hover:bg-purple-100 transition-colors cursor-pointer"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-purple-600" />
              <span>{activeSubject}</span>
              <span className="text-purple-400">•</span>
              <span className="truncate max-w-[120px] sm:max-w-[160px]">{activeChapter}</span>
              <ChevronDown className="w-3 h-3 text-purple-400" />
            </button>

            {/* Chapter Selection Dropdown */}
            {showChapterSelector && (
              <div className="absolute right-0 mt-2 w-72 max-h-80 overflow-y-auto bg-card border border-slate-200 dark:border-white/10 rounded-2xl p-2 shadow-2xl z-50 space-y-2">
                <div className="px-2 py-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Select CBSE PCM Chapter
                </div>
                {OFFICIAL_CBSE_12_PCM_TEMPLATE.subjects.map((sub) => (
                  <div key={sub.subjectId} className="space-y-1">
                    <span className="text-xs font-black text-purple-600 px-2 block">
                      {sub.subjectName}
                    </span>
                    {sub.chapters.map((ch) => (
                      <button
                        key={ch.id}
                        onClick={() => {
                          setActiveSubject(sub.subjectName as any);
                          setActiveChapter(ch.name);
                          setShowChapterSelector(false);
                          toast.success(`Context set to: ${ch.name}`);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs transition-colors cursor-pointer truncate ${
                          activeChapter === ch.name
                            ? 'bg-purple-600 text-white font-bold'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-foreground'
                        }`}
                      >
                        {ch.name}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => {
              if (confirm('Clear messages in this chat?')) {
                aiChatHistoryService.clearCurrentMessages(conversation.id);
              }
            }}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Clear Chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Tutor Mode Pills Bar */}
      <div className="px-4 py-2 border-b border-slate-100 dark:border-white/5 bg-slate-50/60 dark:bg-slate-900/40 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground mr-1 shrink-0">
          Focus:
        </span>
        {TUTOR_MODES.map((mode) => {
          const isSelected = selectedMode === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => setSelectedMode(mode.id)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-muted-foreground hover:text-foreground border border-slate-200/80 dark:border-white/5'
              }`}
            >
              <span>{mode.icon}</span>
              <span>{mode.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Message Feed Arena */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {/* Empty State */}
        {conversation.messages.length === 0 ? (
          <div className="max-w-2xl mx-auto py-12 text-center space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 mx-auto flex items-center justify-center text-white shadow-2xl shadow-purple-500/30">
              <Sparkles className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-foreground">
                Rankify AI Academic Study Engine
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                Step-by-step derivations, organic reaction flows, calculus transformations, and board marking scheme analysis.
              </p>
            </div>

            {/* High-yield Suggested Prompts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left pt-2">
              {SUGGESTED_PROMPTS.map((item, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setActiveSubject(item.subject as any);
                    setActiveChapter(item.chapter);
                    handleSendMessage(item.prompt);
                  }}
                  className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-card hover:border-purple-500 hover:shadow-md transition-all text-left space-y-1.5 cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                      {item.tag}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{item.subject}</span>
                  </div>
                  <p className="text-xs font-semibold text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-2">
                    {item.prompt}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          conversation.messages.map((msg) => {
            const isUser = msg.sender === 'user';
            const isSpeakingThis = speakingMessageId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex gap-3 group ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[88%] sm:max-w-[80%] rounded-3xl p-4 sm:p-5 shadow-xs space-y-2.5 transition-all ${
                    isUser
                      ? 'bg-purple-600 text-white rounded-tr-sm'
                      : 'bg-card border border-slate-200/80 dark:border-white/10 text-foreground rounded-tl-sm'
                  }`}
                >
                  {/* Subject Tag Header */}
                  <div className="flex items-center justify-between text-[10px] gap-2 pb-1 border-b border-white/10 dark:border-white/5">
                    <span className="font-bold flex items-center gap-1.5">
                      <span>{msg.subject || activeSubject}</span>
                      <span>•</span>
                      <span className="truncate max-w-[150px]">{msg.chapter || activeChapter}</span>
                    </span>
                    <span className="opacity-70 font-mono">{msg.timestamp}</span>
                  </div>

                  {/* Attached Image Preview if User */}
                  {isUser && msg.image?.url && (
                    <div className="rounded-xl overflow-hidden border border-white/20 max-w-xs">
                      <img
                        src={msg.image.url}
                        alt="Attached problem"
                        className="w-full h-auto object-cover max-h-48"
                      />
                    </div>
                  )}

                  {/* Message Content */}
                  {isUser ? (
                    editingMessageId === msg.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          className="w-full bg-white/10 rounded-xl p-2 text-xs text-white focus:outline-none border border-white/20"
                          rows={3}
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingMessageId(null)}
                            className="text-[10px] underline"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveEdit(msg.id)}
                            className="px-2.5 py-1 rounded bg-white text-purple-700 text-[10px] font-bold"
                          >
                            Resubmit
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                        {msg.text}
                      </p>
                    )
                  ) : (
                    <div className="text-xs sm:text-sm">
                      <MarkdownMathRenderer content={msg.text} />
                    </div>
                  )}

                  {/* Actions Footer */}
                  <div
                    className={`flex items-center justify-between pt-2 text-[11px] gap-2 ${
                      isUser ? 'text-white/80' : 'text-muted-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      {/* Copy Action */}
                      <button
                        onClick={() => handleCopyMessage(msg.id, msg.text)}
                        className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition cursor-pointer"
                        title="Copy answer"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Read Aloud TTS for AI */}
                      {!isUser && (
                        <button
                          onClick={() => handleToggleSpeak(msg.id, msg.text)}
                          className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer ${
                            isSpeakingThis ? 'text-purple-600 animate-pulse font-bold' : ''
                          }`}
                          title={isSpeakingThis ? 'Stop speaking' : 'Read aloud'}
                        >
                          {isSpeakingThis ? (
                            <VolumeX className="w-3.5 h-3.5 text-purple-600" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}

                      {/* Share Solution Card */}
                      {!isUser && (
                        <button
                          onClick={() => {
                            setShareText(msg.text);
                            setShowShareModal(true);
                          }}
                          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                          title="Share answer card"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Edit for User */}
                      {isUser && (
                        <button
                          onClick={() => {
                            setEditingMessageId(msg.id);
                            setEditingText(msg.text);
                          }}
                          className="p-1 rounded hover:bg-white/10 transition cursor-pointer"
                          title="Edit prompt"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Delete Message */}
                      <button
                        onClick={() => aiChatHistoryService.deleteMessage(conversation.id, msg.id)}
                        className="p-1 rounded hover:bg-rose-500/20 transition cursor-pointer hover:text-rose-400"
                        title="Delete message"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {!isUser && (
                      <button
                        onClick={() => {
                          const lastUser = [...conversation.messages]
                            .reverse()
                            .find((m) => m.sender === 'user');
                          if (lastUser) handleRegenerate(lastUser.text);
                        }}
                        className="hover:text-foreground text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Regenerate</span>
                      </button>
                    )}
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-black text-xs flex items-center justify-center shrink-0 border border-purple-200 dark:border-purple-800/40 mt-1">
                    U
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Loading / Typing Indicator */}
        {isGenerating && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-4 rounded-3xl rounded-tl-sm bg-card border border-purple-500/30 text-foreground shadow-xs space-y-2">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-purple-600 animate-ping" />
                <span className="text-xs font-bold text-foreground">
                  Rankify is formulating NCERT Class 12 response...
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground animate-pulse">
                Consulting syllabus formulas, marking schemes, and derivation steps.
              </p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 4. Floating Input Dock */}
      <div className="p-3 sm:p-4 bg-card/90 backdrop-blur-xl border-t border-slate-200/80 dark:border-white/10 shrink-0 space-y-2">
        {/* Attached File Preview Bar */}
        {attachedImage && (
          <div className="flex items-center justify-between p-2 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-500/30 text-xs">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-purple-600" />
              <span className="font-bold text-foreground truncate max-w-[200px]">
                {attachedImage.name}
              </span>
              <span className="text-[10px] text-muted-foreground">Ready for AI analysis</span>
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
          {/* Attachment Trigger */}
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
            title="Upload photo of question paper, handwritten notes, or diagram"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Text Input */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={`Ask any ${activeSubject} doubt, derivation, or formula...`}
            rows={1}
            className="flex-1 bg-transparent border-0 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none py-2 px-1 max-h-32"
          />

          {/* Voice Input Button */}
          <button
            onClick={handleVoiceInput}
            className={`p-2 sm:p-2.5 rounded-2xl transition cursor-pointer shrink-0 ${
              isListening
                ? 'bg-rose-600 text-white animate-pulse'
                : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-muted-foreground hover:text-foreground'
            }`}
            title={isListening ? 'Stop listening' : 'Voice input'}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Send Button */}
          <button
            onClick={() => handleSendMessage()}
            disabled={(!input.trim() && !attachedImage) || isGenerating}
            className="p-2 sm:p-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white transition-all shadow-md shadow-purple-500/30 cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* Disclaimer Note */}
        <p className="text-[10px] text-center text-muted-foreground">
          Rankify AI Tutor is strictly calibrated to CBSE Class 12 NCERT curriculum. Always cross-verify numerical units in answer sheets.
        </p>
      </div>

      {/* Share Solution Card Modal */}
      <ShareCardModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        defaultType="progress"
        studentName="CBSE Candidate"
      />
    </div>
  );
};
