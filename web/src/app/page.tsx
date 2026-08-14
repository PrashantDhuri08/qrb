'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { QrCode, Send, Upload, ShieldCheck, Laptop, Smartphone, CheckCircle } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [textPayload, setTextPayload] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [manualSessionId, setManualSessionId] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // Read incoming intent query parameters if shared from Android app
  useEffect(() => {
    const sharedText = searchParams.get('text') || searchParams.get('shared_text') || searchParams.get('title');
    if (sharedText) {
      setTextPayload(sharedText);
      setStatusMsg({ type: 'info', text: 'Shared content loaded from phone! Scan PC QR code to complete transfer.' });
    }
  }, [searchParams]);

  // Handle QR scanner initialization
  useEffect(() => {
    if (isScanning && !scannerRef.current) {
      try {
        const scanner = new Html5QrcodeScanner(
          'qr-reader',
          { fps: 10, qrbox: { width: 250, height: 250 } },
          /* verbose= */ false
        );

        scanner.render(
          (decodedText) => {
            scanner.clear();
            setIsScanning(false);

            let sessionId = decodedText.trim();
            if (sessionId.includes('/session/')) {
              sessionId = sessionId.split('/session/')[1].split('/')[0];
            } else if (sessionId.includes('/direct/')) {
              sessionId = sessionId.split('/direct/')[1].split('/')[0];
            }

            if (sessionId) {
              handleSendToSession(sessionId);
            }
          },
          () => {}
        );

        scannerRef.current = scanner;
      } catch (err) {
        console.error('QR scanner error:', err);
      }
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [isScanning]);

  const handleSendToSession = async (sessionId: string) => {
    if (!textPayload && !selectedFile) {
      setStatusMsg({ type: 'error', text: 'Please enter text or select a file to transfer first.' });
      return;
    }

    setStatusMsg({ type: 'info', text: `Connecting to session ${sessionId}...` });

    try {
      if (textPayload) {
        const res = await fetch(`/api/session/${sessionId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'text', content: textPayload }),
        });
        const data = await res.json();
        if (data.success) {
          setStatusMsg({ type: 'success', text: 'Text sent successfully to your PC clipboard!' });
          setTextPayload('');
        } else {
          throw new Error(data.error || 'Failed to send text');
        }
      }

      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        const res = await fetch(`/api/session/${sessionId}`, {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (data.success) {
          setStatusMsg({ type: 'success', text: `File "${selectedFile.name}" sent to your PC!` });
          setSelectedFile(null);
        } else {
          throw new Error(data.error || 'Failed to send file');
        }
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Transfer failed. Ensure PC listener is running.' });
    }
  };

  return (
    <div className="flex flex-col gap-10 py-6">
      {/* Hero Header */}
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-card text-teal-400 text-xs font-medium">
          <ShieldCheck className="w-4 h-4" />
          <span>Zero-configuration phone-to-PC bridge</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
          Seamlessly Share to <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">Your PC</span>
        </h2>
        <p className="text-slate-400 text-base">
          Scan the QR code displayed in your terminal (<code className="text-teal-300 font-mono bg-white/5 px-2 py-0.5 rounded">qrb receive</code>) to instantly pair and transfer.
        </p>
      </div>

      {/* Main Transfer Box */}
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full">
        {/* Left Column: Shared Content Input */}
        <div className="glass-card p-6 rounded-2xl flex flex-col gap-5 border border-white/10 shadow-2xl">
          <h3 className="font-bold text-xl text-white flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-teal-400" />
            <span>1. Content to Transfer</span>
          </h3>

          {/* Status Alert */}
          {statusMsg && (
            <div
              className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : statusMsg.type === 'error'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              }`}
            >
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* Text Area Input */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-300">Text / Link</label>
            <textarea
              value={textPayload}
              onChange={(e) => setTextPayload(e.target.value)}
              placeholder="Paste text, code snippets, or URLs here..."
              className="w-full h-32 p-3 bg-slate-900/80 rounded-xl border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition text-sm resize-none"
            />
          </div>

          {/* File Upload Dropzone */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-300">File Attachment</label>
            <label className="border-2 border-dashed border-white/15 rounded-xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-teal-500/50 hover:bg-white/[0.02] transition">
              <Upload className="w-6 h-6 text-teal-400" />
              <span className="text-xs text-slate-300 font-medium">
                {selectedFile ? selectedFile.name : 'Click or drop file to attach'}
              </span>
              {selectedFile && (
                <span className="text-[10px] text-teal-400">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </span>
              )}
              <input
                type="file"
                className="hidden"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>
        </div>

        {/* Right Column: PC Session Pairing */}
        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between gap-5 border border-white/10 shadow-2xl">
          <div className="flex flex-col gap-5">
            <h3 className="font-bold text-xl text-white flex items-center gap-2">
              <Laptop className="w-5 h-5 text-cyan-400" />
              <span>2. Pair with PC Terminal</span>
            </h3>

            {/* Camera QR Scanner Box */}
            <div className="flex flex-col items-center gap-3">
              {!isScanning ? (
                <button
                  onClick={() => setIsScanning(true)}
                  className="w-full py-4 px-6 rounded-xl glow-button font-bold text-slate-950 flex items-center justify-center gap-3 text-sm shadow-lg"
                >
                  <QrCode className="w-5 h-5" />
                  <span>Scan PC Terminal QR Code</span>
                </button>
              ) : (
                <div className="w-full flex flex-col items-center gap-2">
                  <div id="qr-reader" className="w-full rounded-xl overflow-hidden bg-black border border-teal-500/40"></div>
                  <button
                    onClick={() => setIsScanning(false)}
                    className="text-xs text-slate-400 underline hover:text-white mt-1"
                  >
                    Cancel Camera Scan
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 my-1">
              <div className="h-[1px] bg-white/10 flex-1"></div>
              <span className="text-[11px] text-slate-500 uppercase font-semibold">or enter code</span>
              <div className="h-[1px] bg-white/10 flex-1"></div>
            </div>

            {/* Manual Session ID Form */}
            <div className="flex gap-2">
              <input
                type="text"
                value={manualSessionId}
                onChange={(e) => setManualSessionId(e.target.value)}
                placeholder="Enter 12-char Session ID..."
                className="flex-1 px-3 py-2.5 bg-slate-900/80 rounded-xl border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-sm font-mono"
              />
              <button
                onClick={() => manualSessionId && handleSendToSession(manualSessionId)}
                className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm transition flex items-center gap-1"
              >
                <Send className="w-4 h-4" />
                <span>Send</span>
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-slate-400 flex items-start gap-3">
            <CheckCircle className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
            <span>
              Text automatically lands in your PC clipboard. Files are saved in <code className="text-teal-300">~/Downloads/qrb/</code>.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px] text-slate-400 text-sm">
        Loading QRB...
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
