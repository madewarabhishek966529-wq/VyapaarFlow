import React, { useEffect, useRef, useState, useCallback } from 'react';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';
import {
  Camera,
  CameraOff,
  Flashlight,
  RefreshCw,
  SwitchCamera,
  Zap,
  ScanLine
} from 'lucide-react';

interface LiveBarcodeScannerProps {
  active: boolean;
  onScan: (code: string) => void;
  sampleProducts?: any[];
  compact?: boolean;
}

/**
 * Play a short crisp POS scanner beep using Web Audio API (zero external audio file dependency).
 */
function playScanBeep() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1480, ctx.currentTime);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.11);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 200);
  } catch {
    // Ignore audio errors if blocked by browser autoplay policy
  }
}

export const LiveBarcodeScanner: React.FC<LiveBarcodeScannerProps> = ({
  active,
  onScan,
  sampleProducts = [],
  compact = false
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanLockedRef = useRef(false);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  const [manualCode, setManualCode] = useState('');
  const [cameraState, setCameraState] = useState<'starting' | 'active' | 'error'>('starting');
  const [cameraError, setCameraError] = useState<string>('');
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceIdx, setSelectedDeviceIdx] = useState<number>(0);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [restartNonce, setRestartNonce] = useState(0);

  const stopCamera = useCallback(() => {
    try {
      controlsRef.current?.stop();
    } catch {
      // ignore
    }
    controlsRef.current = null;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setTorchOn(false);
    setHasTorch(false);
  }, []);

  const handleDetectedCode = useCallback(
    (rawCode: string) => {
      const cleaned = rawCode.trim();
      if (!cleaned || scanLockedRef.current) return;
      scanLockedRef.current = true;
      playScanBeep();
      stopCamera();
      onScanRef.current(cleaned);
    },
    [stopCamera]
  );

  useEffect(() => {
    if (!active) {
      stopCamera();
      return;
    }

    let cancelled = false;
    let detectorTimer: number | null = null;
    scanLockedRef.current = false;
    setCameraState('starting');
    setCameraError('');

    const startScanner = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (!cancelled) {
          setCameraState('error');
          setCameraError(
            'Camera API unavailable in this browser or context. Use HTTPS/localhost or type the barcode below.'
          );
        }
        return;
      }

      try {
        const videoList = await BrowserMultiFormatReader.listVideoInputDevices().catch(() => []);
        if (!cancelled && videoList.length > 0) {
          setDevices(videoList);
        }

        const chosenDevice =
          videoList.length > 0 ? videoList[selectedDeviceIdx % videoList.length] : undefined;

        const constraints: MediaStreamConstraints = chosenDevice?.deviceId
          ? {
              video: {
                deviceId: { exact: chosenDevice.deviceId },
                width: { ideal: 1280 },
                height: { ideal: 720 }
              },
              audio: false
            }
          : {
              video: {
                facingMode: { ideal: 'environment' },
                width: { ideal: 1280 },
                height: { ideal: 720 }
              },
              audio: false
            };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        // Check torch capability cleanly
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack && typeof videoTrack.getCapabilities === 'function') {
          const caps = videoTrack.getCapabilities() as any;
          if (caps && caps.torch) {
            setHasTorch(true);
          }
        }

        const hints = new Map<DecodeHintType, any>();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
          BarcodeFormat.CODE_128,
          BarcodeFormat.CODE_39,
          BarcodeFormat.CODE_93,
          BarcodeFormat.ITF,
          BarcodeFormat.CODABAR,
          BarcodeFormat.QR_CODE,
          BarcodeFormat.DATA_MATRIX
        ]);
        hints.set(DecodeHintType.TRY_HARDER, true);

        const reader = new BrowserMultiFormatReader(hints, {
          delayBetweenScanAttempts: 120
        });

        const videoEl = videoRef.current;
        if (!videoEl) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        const controls = await reader.decodeFromStream(stream, videoEl, (result) => {
          if (!cancelled && result) {
            handleDetectedCode(result.getText());
          }
        });

        if (cancelled) {
          controls.stop();
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        controlsRef.current = controls;
        setCameraState('active');

        // Also leverage hardware native BarcodeDetector if available for near-instant 1D/2D recognition
        const NativeBarcodeDetector = (window as any).BarcodeDetector;
        if (NativeBarcodeDetector) {
          try {
            const detector = new NativeBarcodeDetector({
              formats: [
                'ean_13',
                'ean_8',
                'upc_a',
                'upc_e',
                'code_128',
                'code_39',
                'qr_code',
                'itf',
                'codabar'
              ]
            });

            const detectFrame = async () => {
              if (cancelled || scanLockedRef.current) return;
              if (videoEl.readyState >= 2) {
                try {
                  const found = await detector.detect(videoEl);
                  if (!cancelled && found && found.length > 0 && found[0].rawValue) {
                    handleDetectedCode(found[0].rawValue);
                    return;
                  }
                } catch {
                  // Ignore single-frame native detector errors; ZXing still runs
                }
              }
              if (!cancelled && !scanLockedRef.current) {
                detectorTimer = window.setTimeout(detectFrame, 150);
              }
            };
            detectorTimer = window.setTimeout(detectFrame, 250);
          } catch {
            // Native BarcodeDetector format constructor unsupported; ZXing handles decoding
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          setCameraState('error');
          const msg =
            err?.name === 'NotAllowedError'
              ? 'Camera permission denied. Allow camera access in browser settings or enter barcode manually below.'
              : err?.name === 'NotFoundError'
              ? 'No camera device found on this device. Enter barcode manually or tap a sample item below.'
              : err?.message || 'Unable to access camera. Enter barcode manually below.';
          setCameraError(msg);
        }
      }
    };

    startScanner();

    return () => {
      cancelled = true;
      if (detectorTimer !== null) {
        clearTimeout(detectorTimer);
      }
      stopCamera();
    };
  }, [active, selectedDeviceIdx, restartNonce, handleDetectedCode, stopCamera]);

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const next = !torchOn;
    try {
      await track.applyConstraints({ advanced: [{ torch: next } as any] });
      setTorchOn(next);
    } catch {
      // Some hardware refuses torch toggle dynamically
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      const code = manualCode.trim();
      setManualCode('');
      handleDetectedCode(code);
    }
  };

  return (
    <div className="space-y-3.5">
      {/* Real Live Camera Scanner Viewport */}
      <div
        className={`bg-[#142D4E] rounded-2xl relative overflow-hidden flex flex-col items-center justify-center border border-[#256D85]/40 ${
          compact ? 'min-h-[200px] sm:min-h-[230px]' : 'min-h-[240px] sm:min-h-[270px]'
        }`}
      >
        <video
          ref={videoRef}
          className={`w-full h-full object-cover absolute inset-0 ${
            cameraState === 'active' ? 'opacity-100' : 'opacity-0'
          } transition-opacity duration-200`}
          playsInline
          muted
          autoPlay
        />

        {/* Subtle Dark Overlay & Scan Reticle */}
        {cameraState === 'active' && (
          <>
            <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/45 pointer-events-none" />
            <div className="relative z-10 w-[78%] max-w-[260px] h-28 sm:h-32 rounded-xl border-2 border-white/70 shadow-lg flex items-center justify-center pointer-events-none">
              <div className="w-full h-0.5 bg-[#D97706] shadow-[0_0_12px_#D97706] animate-pulse" />
              <span className="absolute -bottom-6 text-[11px] font-semibold text-white bg-black/60 px-2.5 py-0.5 rounded-full">
                Align barcode inside frame
              </span>
            </div>
          </>
        )}

        {/* Top Bar inside Camera Viewport */}
        <div className="absolute top-2.5 left-2.5 right-2.5 z-20 flex items-center justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold backdrop-blur-sm ${
              cameraState === 'active'
                ? 'bg-emerald-600/85 text-white'
                : cameraState === 'starting'
                ? 'bg-[#256D85]/85 text-white'
                : 'bg-rose-600/90 text-white'
            }`}
          >
            <ScanLine className="w-3.5 h-3.5" />
            <span>
              {cameraState === 'active'
                ? 'Camera Live — Ready to Scan'
                : cameraState === 'starting'
                ? 'Opening Camera...'
                : 'Camera Unavailable'}
            </span>
          </span>

          <div className="flex items-center gap-1.5">
            {hasTorch && (
              <button
                type="button"
                onClick={toggleTorch}
                className={`p-2 rounded-lg text-white backdrop-blur-sm transition ${
                  torchOn ? 'bg-[#D97706]' : 'bg-black/45 hover:bg-black/65'
                }`}
                title="Toggle Flashlight"
              >
                <Flashlight className="w-4 h-4" />
              </button>
            )}
            {devices.length > 1 && (
              <button
                type="button"
                onClick={() => setSelectedDeviceIdx((idx) => idx + 1)}
                className="p-2 rounded-lg bg-black/45 hover:bg-black/65 text-white backdrop-blur-sm transition"
                title="Switch Camera"
              >
                <SwitchCamera className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Starting / Error Placeholder */}
        {cameraState === 'starting' && (
          <div className="relative z-10 flex flex-col items-center justify-center p-6 text-center text-white">
            <Camera className="w-10 h-10 text-[#368AA5] mb-2 animate-pulse" />
            <p className="text-xs font-semibold text-slate-200">Starting live barcode camera...</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Supports EAN-13, UPC, Code-128 & QR codes
            </p>
          </div>
        )}

        {cameraState === 'error' && (
          <div className="relative z-10 flex flex-col items-center justify-center p-5 text-center text-white max-w-xs">
            <CameraOff className="w-9 h-9 text-amber-400 mb-2" />
            <p className="text-xs font-medium text-slate-200 leading-relaxed">{cameraError}</p>
            <button
              type="button"
              onClick={() => setRestartNonce((n) => n + 1)}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#256D85] hover:bg-[#1C5467] text-white text-xs font-bold rounded-lg transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Camera</span>
            </button>
          </div>
        )}
      </div>

      {/* Manual Barcode / SKU Fallback Input */}
      <form onSubmit={handleManualSubmit} className="flex gap-2">
        <input
          type="text"
          placeholder="Or type / USB-scan barcode or SKU..."
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value)}
          className="flex-1 px-3.5 py-2 text-xs vf-input rounded-xl"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-[#D97706] hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-sm transition shrink-0"
        >
          Find Product
        </button>
      </form>

      {/* Instant-Scan Sample Product Shortcuts */}
      {sampleProducts.length > 0 && (
        <div className="border-t border-borderline pt-3">
          <span className="text-xs font-bold text-content-primary flex items-center gap-1 mb-2">
            <Zap className="w-3.5 h-3.5 text-[#D97706]" />
            <span>Quick Tap-to-Scan Demo Items:</span>
          </span>
          <div className="max-h-36 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-1.5 pr-1">
            {sampleProducts.slice(0, 6).map((p) => (
              <button
                key={p._id}
                type="button"
                onClick={() => handleDetectedCode(p.barcode || p.sku)}
                className="w-full text-left p-2 rounded-lg bg-app hover:bg-[#256D85]/10 hover:border-[#256D85]/40 border border-borderline text-xs flex justify-between items-center transition"
              >
                <span className="font-semibold text-content-primary truncate">{p.name}</span>
                <span className="font-mono text-[10px] bg-borderline/70 px-1.5 py-0.5 rounded text-content-secondary shrink-0 ml-2">
                  {p.barcode || p.sku}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
