'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Send, Upload, CheckCircle2, AlertCircle, Laptop, FileText, Paperclip, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function SessionPage() {
  const params = useParams();
  const sessionId = params.id as string;

  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; msg: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text && !file) return;

    setLoading(true);
    setResult(null);

    try {
      if (text) {
        const res = await fetch(`/api/session/${sessionId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'text', content: text }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to transfer text');
        setText('');
      }

      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch(`/api/session/${sessionId}`, {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to transfer file');
        setFile(null);
      }

      setResult({ success: true, msg: 'Payload delivered to PC successfully!' });
    } catch (err: any) {
      setResult({ success: false, msg: err.message || 'Transfer failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto w-full py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Home</span>
      </Link>

      <div className="glass-card p-8 rounded-3xl border border-white/10 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-white text-lg">PC Listener Connected</h2>
              <p className="text-xs text-slate-400 font-mono">Session ID: {sessionId}</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-medium border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Active
          </span>
        </div>

        {result && (
          <div
            className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-3 ${
              result.success
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
            }`}
          >
            {result.success ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            )}
            <span>{result.msg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Text Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-400" />
              <span>Share Text or Clipboard</span>
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste text here to copy directly to your PC clipboard..."
              rows={4}
              className="w-full p-3.5 bg-slate-900/80 rounded-xl border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 text-sm resize-none"
            />
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-cyan-400" />
              <span>Share File</span>
            </label>
            <label className="border border-dashed border-white/20 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:border-cyan-500/50 hover:bg-white/[0.02] transition">
              <div className="flex items-center gap-3">
                <Upload className="w-5 h-5 text-cyan-400" />
                <span className="text-xs text-slate-300 font-medium truncate max-w-[200px]">
                  {file ? file.name : 'Choose a file...'}
                </span>
              </div>
              {file && (
                <span className="text-[10px] text-cyan-400 font-mono">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </span>
              )}
              <input
                type="file"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || (!text && !file)}
            className="w-full py-4 rounded-xl glow-button text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span>Sending Payload...</span>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Transfer to PC</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
