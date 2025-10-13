import React from 'react';
import { useAutoPrint } from '@/hooks/useAutoPrint';
import { PrintProgressModal } from './PrintProgressModal';

interface AutoPrintWrapperProps {
  children: React.ReactNode;
}

export const AutoPrintWrapper: React.FC<AutoPrintWrapperProps> = ({ children }) => {
  const {
    isModalOpen,
    isLoading,
    progressMessage,
    isSuccess,
    closeModal,
  } = useAutoPrint();

  return (
    <>
      {children}
      <PrintProgressModal
        isOpen={isModalOpen}
        onOpenChange={closeModal}
        isLoading={isLoading}
        message={progressMessage}
        isSuccess={isSuccess}
      />
    </>
  );
};

// Hook untuk digunakan di komponen child
export { useAutoPrint } from '@/hooks/useAutoPrint';