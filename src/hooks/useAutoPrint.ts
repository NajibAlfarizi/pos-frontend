import { useState, useCallback } from 'react';
import { usePrinter } from './usePrinter';
import { toast } from 'sonner';

export const useAutoPrint = () => {
  const { printStrukAuto, printerStatus } = usePrinter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progressMessage, setProgressMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const autoPrintStruk = useCallback(async (idTransaksi: string) => {
    // Reset state
    setIsSuccess(false);
    setIsLoading(true);
    setIsModalOpen(true);
    setProgressMessage('Mempersiapkan printer...');

    // Show info toast
    toast.info('Memulai pencetakan struk otomatis...', {
      duration: 2000
    });

    try {
      const success = await printStrukAuto(idTransaksi, (message) => {
        setProgressMessage(message);
      });

      if (success) {
        setIsSuccess(true);
        setProgressMessage('Struk berhasil dicetak!');
        
        // Show success toast
        toast.success('Struk berhasil dicetak ke printer thermal!', {
          duration: 3000
        });
        
        // Auto close modal after success
        setTimeout(() => {
          setIsModalOpen(false);
          setIsLoading(false);
        }, 2000);
      } else {
        setIsLoading(false);
        setProgressMessage('Gagal mencetak struk');
        
        // Show error toast
        toast.error('Auto print gagal. Silakan cetak manual dari detail transaksi.', {
          duration: 4000
        });
        
        // Auto close modal after error
        setTimeout(() => {
          setIsModalOpen(false);
        }, 3000);
      }
    } catch (err) {
      console.error('Auto print error:', err);
      setIsLoading(false);
      setProgressMessage('Terjadi kesalahan saat mencetak');
      
      // Show error toast
      toast.error('Terjadi kesalahan saat auto print. Silakan coba cetak manual.', {
        duration: 4000
      });
      
      // Auto close modal after error
      setTimeout(() => {
        setIsModalOpen(false);
      }, 3000);
    }
  }, [printStrukAuto]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setIsLoading(false);
    setIsSuccess(false);
    setProgressMessage('');
  }, []);

  return {
    autoPrintStruk,
    isModalOpen,
    isLoading,
    progressMessage,
    isSuccess,
    closeModal,
    isPrinterConnected: printerStatus.isConnected,
  };
};