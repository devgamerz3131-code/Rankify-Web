import React, { useState } from 'react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Send, Brain, Bot, User, BookOpen } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export const AskAIView: React.FC = () => {
  const { studentDetails, weakSubjectAnalysis } = useOnboarding();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Hello ${studentDetails.name || 'Student'}! I am your Rankify AI Academic Mentor for ${studentDetails.board} Class ${studentDetails.classNumber}. You can ask me to explain any difficult concept, solve a numerical step-by-step, or generate high-yield exam practice questions. What are we studying today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      text: input.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      let reply = `Here is a structured explanation for ${studentDetails.board} Class ${studentDetails.classNumber}:\n\n1. **Core Concept**: Identify the fundamental definition and governing equation from your NCERT syllabus.\n2. **Key Derivation/Step**: Break down the problem logically without skipping intermediate steps.\n3. **Exam Tip**: In CBSE and State Board evaluations, writing the appropriate SI units and stating assumptions awards full marks.`;

      if (userMsg.text.toLowerCase().includes('plan') || userMsg.text.toLowerCase().includes('schedule')) {
        reply = `Based on your ${studentDetails.targetPercentage}% target, prioritize your identified weak chapters first in 45-minute Pomodoro intervals, followed by 10 practice PYQs.`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `ai_${Date.now()}`,
          sender: 'ai',
          text: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setIsTyping(false);
    }, 900);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-purple-600" />
          <span>Rankify AI Mentor</span>
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Ask concept questions, formula explanations, and revision guidance calibrated for {studentDetails.board} exams.
        </p>
      </div>

      {/* Chat Area */}
      <Card className="h-[520px] flex flex-col bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200/80 dark:border-white/10 shadow-lg overflow-hidden">
        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 scrollbar-thin">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'ai' && (
                <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-600 flex items-center justify-center shrink-0 border border-purple-500/30">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                  m.sender === 'user'
                    ? 'bg-purple-600 text-white rounded-tr-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-foreground border border-slate-200/70 dark:border-white/5 rounded-tl-xs'
                }`}
              >
                {m.text}
                <span
                  className={`block text-[9px] mt-1 ${
                    m.sender === 'user' ? 'text-purple-200 text-right' : 'text-muted-foreground'
                  }`}
                >
                  {m.timestamp}
                </span>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground italic">
              <Bot className="w-4 h-4 text-purple-600 animate-bounce" />
              <span>Rankify AI is synthesizing answer...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-200/70 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask a question about physics, chemistry, math, or biology..."
            className="flex-1 bg-white dark:bg-slate-800 px-4 h-11 rounded-xl text-xs sm:text-sm border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-purple-500 text-foreground"
          />
          <Button
            variant="primary"
            onClick={handleSend}
            disabled={!input.trim()}
            className="h-11 px-4 rounded-xl cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
};
