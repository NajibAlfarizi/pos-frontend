'use client'
import { useState } from 'react';
import { PrintService } from '../utils/printService';
import { toast } from 'sonner';
import { Printer } from 'lucide-react';

interface TransaksiData {
  id_transaksi: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

type VariantType = 'default' | 'outline' | 'small';

interface PrintButtonProps {
  transaksi: TransaksiData;
  className?: string;
  variant?: VariantType;
}

export default function PrintButton({ transaksi, className = "", variant = "default" }: PrintButtonProps) {
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = async () => {
    if (!transaksi?.id_transaksi) {
      toast.error('Data transaksi tidak valid');
      return;
    }

    setIsPrinting(true);
    try {
      const result = await PrintService.printStruk(transaksi.id_transaksi);
      
      if (result.success) {
        toast.success('✅ Struk berhasil dicetak via Bluetooth!');
      } else {
        toast.error(`❌ ${result.error || 'Gagal cetak struk'}`);
      }
    } catch (error) {
      console.error('Print error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`❌ ${errorMessage}`);
    } finally {
      setIsPrinting(false);
    }
  };

  const baseClasses = `
    flex items-center gap-2 px-4 py-2 
    text-white rounded-lg font-medium
    transition-colors duration-200
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const variantClasses: Record<VariantType, string> = {
    default: 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400',
    outline: 'border border-blue-600 text-blue-600 bg-white hover:bg-blue-50 disabled:bg-gray-100',
    small: 'px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400'
  };

  return (
    <button
      onClick={handlePrint}
      disabled={isPrinting}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      title="Cetak struk via Bluetooth Printer"
    >
      {isPrinting ? (
        <>
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Mencetak...
        </>
      ) : (
        <>
          <Printer size={16} />
          {variant === 'small' ? 'Print BT' : 'Cetak Bluetooth'}
        </>
      )}
    </button>
  );
}