import React from 'react';
import { Modal } from './Modal';
import { LiveBarcodeScanner } from './LiveBarcodeScanner';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (scannedCode: string) => void;
  sampleProducts?: any[];
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
  sampleProducts = []
}) => {
  const handleScanned = (code: string) => {
    onScan(code);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Camera Barcode Scanner" maxWidth="max-w-md">
      <LiveBarcodeScanner
        active={isOpen}
        onScan={handleScanned}
        sampleProducts={sampleProducts}
      />
    </Modal>
  );
};
