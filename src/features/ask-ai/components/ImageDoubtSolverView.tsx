import React, { useState, useRef } from 'react';
import {
  Camera,
  Image as ImageIcon,
  UploadCloud,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  FileText,
  FileQuestion,
  PenTool,
  BookOpen,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ImageDoubtSolverViewProps {
  onSwitchToClassicTutor: (prefillPrompt?: string) => void;
}

const CATEGORIES = [
  { id: 'question_paper', label: 'Question Paper', icon: FileQuestion },
  { id: 'notebook', label: 'Notebook', icon: BookOpen },
  { id: 'diagram', label: 'Diagram', icon: PenTool },
  { id: 'handwritten', label: 'Handwritten Notes', icon: FileText },
  { id: 'camera', label: 'Camera Snap', icon: Camera },
  { id: 'gallery', label: 'Gallery Upload', icon: ImageIcon },
];

export const ImageDoubtSolverView: React.FC<ImageDoubtSolverViewProps> = ({
  onSwitchToClassicTutor,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('question_paper');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [questionText, setQuestionText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDevNotice, setShowDevNotice] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setShowDevNotice(false);
    }
  };

  const handleAnalyze = () => {
    if (!previewUrl && !questionText) {
      toast.error('Please upload an image or type a question hint');
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setShowDevNotice(true);
      toast('Image AI is currently under development.', {
        icon: '🚧',
      });
    }, 1200);
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Development Banner */}
      <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🚧</span>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider">In Development</div>
            <div className="text-xs text-foreground/80 font-medium">
              Image AI is under development. You can preview file uploads, or solve doubts directly using the Classic AI Tutor.
            </div>
          </div>
        </div>
        <button
          onClick={() => onSwitchToClassicTutor()}
          className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shrink-0 cursor-pointer transition-colors"
        >
          Classic Tutor →
        </button>
      </div>

      <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-card/60 backdrop-blur-xl p-6 shadow-sm space-y-5">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Camera className="w-5 h-5 text-purple-600" />
            <span>CBSE Visual Doubt Solver (Camera & Image)</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Upload question paper snapshots, diagrams, handwritten problems, or notebook calculations.
          </p>
        </div>

        {/* Categories */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Document Category
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`p-3 rounded-2xl border text-xs font-semibold flex flex-col items-center gap-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 shadow-xs'
                      : 'border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-slate-900 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-[11px] text-center">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Upload Dropzone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-purple-500 dark:hover:border-purple-400 rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer bg-slate-50/50 dark:bg-slate-900/40 transition-colors group"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          {previewUrl ? (
            <div className="space-y-3">
              <img
                src={previewUrl}
                alt="Doubt Preview"
                className="max-h-60 max-w-full rounded-2xl mx-auto shadow-md border border-slate-200 dark:border-slate-700 object-contain"
              />
              <p className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                Click to change image ({selectedFile?.name})
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="w-14 h-14 rounded-3xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
                <UploadCloud className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">
                  Tap to capture or upload CBSE Doubt Image
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Supports JPG, PNG, WEBP from Camera or Photo Gallery
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Optional Question Context */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Optional Question / Sub-part Number
          </label>
          <input
            type="text"
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="e.g. Solve question 4(b) - find current through 5 ohm resistor..."
            className="w-full bg-slate-100 dark:bg-slate-800 px-4 h-11 rounded-2xl text-xs sm:text-sm border border-slate-200 dark:border-slate-700 text-foreground focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <button
            onClick={() => onSwitchToClassicTutor(questionText)}
            className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Prefer typing? Switch to Classic AI Tutor</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleAnalyze}
            disabled={isProcessing}
            className="w-full sm:w-auto px-6 h-12 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-purple-500/25 hover:opacity-95 disabled:opacity-50 cursor-pointer"
          >
            {isProcessing ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Scanning CBSE diagram...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Process Doubt Image</span>
              </>
            )}
          </button>
        </div>

        {/* Dev Notice Card */}
        {showDevNotice && (
          <div className="p-4 rounded-2xl border border-purple-200 dark:border-purple-900/40 bg-purple-50/70 dark:bg-purple-950/30 space-y-2 animate-in fade-in">
            <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-bold text-sm">
              <span>🚧 Image AI is under development</span>
            </div>
            <p className="text-xs text-foreground/80 leading-relaxed">
              Optical character and circuit diagram recognition for handwritten question papers is being fine-tuned for high board accuracy.
              In the meantime, the <strong>Classic AI Tutor</strong> is ready to solve this doubt right now.
            </p>
            <button
              onClick={() => onSwitchToClassicTutor(questionText || 'Please solve this CBSE Class 12 question.')}
              className="mt-2 px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <span>Solve with Classic AI Tutor</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
