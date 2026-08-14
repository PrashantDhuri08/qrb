import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'QRB - QR Bridge | Phone to PC Transfer',
  description: 'Share text and files instantly from your phone to PC via QR code',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-teal-500 selection:text-white">
        <div className="relative min-h-screen flex flex-col justify-between overflow-x-hidden">
          {/* Animated Background Gradients */}
          <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

          {/* Navigation Header */}
          <header className="w-full max-w-6xl mx-auto px-6 py-5 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-teal-500/30">
                <span className="font-black text-slate-950 text-xl tracking-tighter">QRB</span>
              </div>
              <div>
                <h1 className="font-bold text-lg text-white tracking-wide">QR Bridge</h1>
                <p className="text-xs text-slate-400">Phone to PC instant sync</p>
              </div>
            </div>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold px-4 py-2 rounded-lg glass-card hover:bg-white/10 text-slate-300 transition"
            >
              CLI Package & Documentation
            </a>
          </header>

          {/* Main Content */}
          <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-6 z-10 flex flex-col justify-center">
            {children}
          </main>

          {/* Footer */}
          <footer className="w-full max-w-6xl mx-auto px-6 py-6 text-center text-xs text-slate-500 border-t border-white/5 z-10">
            QRB (QR Bridge) &copy; 2026 • Fast, private, open-source transfer.
          </footer>
        </div>
      </body>
    </html>
  );
}
