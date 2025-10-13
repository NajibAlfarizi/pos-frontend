import React from 'react';
import { Printer, RefreshCw, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface PrintProgressModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isLoading: boolean;
  message: string;
  isSuccess?: boolean;
}

export const PrintProgressModal: React.FC<PrintProgressModalProps> = ({
  isOpen,
  onOpenChange,
  isLoading,
  message,
  isSuccess = false,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md w-[90vw] text-center">
        <div className="flex flex-col items-center justify-center py-6 space-y-4">
          {/* Icon */}
          <div className="relative">
            {isSuccess ? (
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                <Printer className="w-8 h-8 text-blue-600" />
                {isLoading && (
                  <div className="absolute -top-1 -right-1">
                    <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Message */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {isSuccess ? 'Berhasil!' : 'Mencetak Struk'}
            </h3>
            <p className="text-sm text-gray-600">{message}</p>
          </div>

          {/* Loading Animation */}
          {isLoading && (
            <div className="w-full max-w-xs">
              <div className="flex items-center space-x-1">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full animate-pulse"></div>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-1">Sedang memproses...</p>
            </div>
          )}

          {/* Success message auto close info */}
          {isSuccess && (
            <p className="text-xs text-gray-400">Modal akan tertutup otomatis dalam beberapa detik</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};