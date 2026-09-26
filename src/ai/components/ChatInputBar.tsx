import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Paperclip, Mic } from 'lucide-react';
import toast from 'react-hot-toast';

interface ChatInputBarProps {
  input: string;
  onChangeInput: (val: string) => void;
  onSend: () => void;
}

export const ChatInputBar: React.FC<ChatInputBarProps> = ({
  input,
  onChangeInput,
  onSend,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
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

        {/* Input Text Area */}
        <textarea
          value={input}
          onChange={(e) => onChangeInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSend();
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
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onSend}
          disabled={!input.trim()}
          className="p-2 sm:p-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white transition-all shadow-md shadow-purple-500/30 cursor-pointer shrink-0"
        >
          <Send className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  );
};
