'use client'
import { useState } from 'react';
import { PrintService } from '../utils/printService';
import { toast } from 'sonner';
import { TestTube } from 'lucide-react';

interface TestPrintButtonProps {
  className?: string;
}

export default function TestPrintButton({ className = "" }: TestPrintButtonProps) {
  const [isTesting, setIsTesting] = useState(false);

  const handleTestPrint = async () => {
    setIsTesting(true);
    try {
      const result = await PrintService.testPrinter();
      
      if (result.success) {
        toast.success('✅ Test print berhasil! Printer siap digunakan.');
      } else {
        toast.error(`❌ ${result.error}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`❌ ${errorMessage}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <button
      onClick={handleTestPrint}
      disabled={isTesting}
      className={`
        px-3 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 
        text-white rounded-lg text-sm flex items-center gap-2
        transition-colors duration-200
        ${className}
      `}
      title="Test koneksi Bluetooth printer"
    >
      {isTesting ? (
        <>
          <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Testing...
        </>
      ) : (
        <>
          <TestTube size={14} />
          Test Print
        </>
      )}
    </button>
  );
}