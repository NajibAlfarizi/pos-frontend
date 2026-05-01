'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import BottomNavbar from '@/components/BottomNavbar';
import Navbar from '@/components/Navbar';
import { useGlobalLoading } from './GlobalLoadingContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

// Type declaration for PWA install prompt
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function LoadingOverlay() {
  const { loading } = useGlobalLoading();
  if (!loading) return null;
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center backdrop-blur-sm bg-black/30">
      <div className="flex flex-col items-center gap-3">
        <svg
          className="animate-spin h-10 w-10 text-blue-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8z"
          />
        </svg>
        <span className="text-white text-lg font-bold drop-shadow">Ambek Caaaah ...</span>
      </div>
    </div>
  );
}

export default function RootLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hideNav = pathname === '/login';
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  // Register service worker (client side)
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js');
    }
  }, []);

  // Listen for beforeinstallprompt event
  useEffect(() => {
    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallDialog(true);
    };
    window.addEventListener('beforeinstallprompt', handler as EventListener);
    return () => window.removeEventListener('beforeinstallprompt', handler as EventListener);
  }, []);

  const handleInstall = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => {
        setDeferredPrompt(null);
        setShowInstallDialog(false);
      });
    }
  };

  return (
    <>
      {/* Dialog install PWA */}
      <Dialog open={showInstallDialog} onOpenChange={(open) => setShowInstallDialog(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Install Aplikasi POS iBii</DialogTitle>
          </DialogHeader>
          <div className="my-4 text-center">
            <div className="text-lg font-semibold mb-2">Install aplikasi ini di desktop Anda!</div>
            <div className="text-gray-600 mb-4">
              Klik tombol <b>Install Sekarang</b> untuk menambahkan aplikasi ke desktop/home screen
              Anda.
            </div>
            <button
              className="px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition"
              onClick={handleInstall}
            >
              Install Sekarang
            </button>
          </div>
          <DialogFooter>
            <button
              className="px-5 py-2 rounded-lg border text-gray-600 font-medium hover:bg-gray-100"
              onClick={() => setShowInstallDialog(false)}
            >
              Tutup
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {!hideNav && <Navbar />}
      <div className={hideNav ? 'min-h-screen' : 'flex min-h-screen'}>
        {!hideNav && <Sidebar />}
        <main
          className={hideNav ? 'flex-1' : 'flex-1 pt-14 md:pt-16 md:ml-64'}
          style={{ position: 'relative', zIndex: 1 }}
        >
          <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
        </main>
      </div>
      {!hideNav && <BottomNavbar />}
      <LoadingOverlay />
    </>
  );
}
