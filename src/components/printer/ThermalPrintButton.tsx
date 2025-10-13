import React from 'react';
import { Printer, RefreshCw } from 'lucide-react';
import { usePrinter } from '@/hooks/usePrinter';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ThermalPrintButtonProps {
  idTransaksi: string;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

export const ThermalPrintButton: React.FC<ThermalPrintButtonProps> = ({
  idTransaksi,
  disabled = false,
  variant = 'default',
  size = 'default',
  className = '',
}) => {
  const { printerStatus, isLoading, printStruk, checkPrinterStatus } = usePrinter();

  const handlePrint = async () => {
    // Cek status printer terlebih dahulu
    if (!printerStatus.isConnected) {
      toast.error('Printer tidak terhubung. Silakan periksa koneksi printer.');
      await checkPrinterStatus();
      return;
    }

    // Cetak struk
    const success = await printStruk(idTransaksi);
    if (success) {
      // Optional: bisa ditambahkan logic tambahan setelah berhasil print
    }
  };

  const isDisabled = disabled || isLoading || !printerStatus.isConnected;

  return (
    <Button
      onClick={handlePrint}
      disabled={isDisabled}
      variant={variant}
      size={size}
      className={`${className} ${!printerStatus.isConnected ? 'opacity-60' : ''}`}
      title={
        !printerStatus.isConnected
          ? 'Printer tidak terhubung'
          : isLoading
          ? 'Sedang mencetak...'
          : 'Cetak struk ke printer thermal'
      }
    >
      {isLoading ? (
        <>
          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          Mencetak...
        </>
      ) : (
        <>
          <Printer className="w-4 h-4 mr-2" />
          Print Thermal
        </>
      )}
    </Button>
  );
};