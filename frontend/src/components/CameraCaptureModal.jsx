import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw, Check } from 'lucide-react';

export const CameraCaptureModal = ({ isOpen, onClose, onCapture, title = 'Capture Document Photo' }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [cameraError, setCameraError] = useState(null);

  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, capturedImage]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.warn('Camera access error:', err);
      setCameraError('Unable to access webcam/camera. Please ensure camera permissions are granted, or upload a file directly.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/png');
      setCapturedImage(dataUrl);
      stopCamera();
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <h3 className="card-title">
            <Camera size={20} color="var(--primary)" />
            {title}
          </h3>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ textAlign: 'center' }}>
          {cameraError ? (
            <div style={{ padding: '30px 20px', color: 'var(--status-red)' }}>
              <p>{cameraError}</p>
            </div>
          ) : capturedImage ? (
            <div>
              <img
                src={capturedImage}
                alt="Captured document"
                style={{ width: '100%', maxHeight: '380px', objectFit: 'contain', borderRadius: '12px', border: '1px solid var(--border-light)' }}
              />
              <p style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Document photo captured. Click Confirm to extract text via OCR.
              </p>
            </div>
          ) : (
            <div style={{ position: 'relative', background: '#000', borderRadius: '12px', overflow: 'hidden', minHeight: '320px' }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '80%',
                height: '70%',
                border: '2px dashed rgba(255,255,255,0.7)',
                borderRadius: '8px',
                pointerEvents: 'none'
              }}>
                <span style={{ position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)', color: '#fff', fontSize: '0.75rem', background: 'rgba(0,0,0,0.5)', padding: '2px 8px', borderRadius: '4px' }}>
                  Align document here
                </span>
              </div>
            </div>
          )}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          {capturedImage ? (
            <>
              <button className="btn btn-secondary" onClick={handleRetake}>
                <RefreshCw size={16} /> Retake
              </button>
              <button className="btn btn-primary" onClick={handleConfirm}>
                <Check size={16} /> Confirm Photo
              </button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={handleCapture} disabled={!!cameraError}>
              <Camera size={16} /> Take Snapshot
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
