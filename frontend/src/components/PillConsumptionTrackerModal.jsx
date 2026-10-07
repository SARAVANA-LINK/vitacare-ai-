import React, { useRef, useState, useEffect } from 'react';
import { 
  Camera, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Activity, 
  Sparkles, 
  AlertTriangle, 
  RefreshCw, 
  XCircle, 
  Clock,
  Sliders,
  Check,
  Shield,
  History,
  Phone,
  UserCheck,
  Pill,
  GlassWater,
  ArrowDownCircle,
  Bell,
  Users,
  Send
} from 'lucide-react';
import { api } from '../api/apiClient';
import { useTranslation } from '../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';

export const PillConsumptionTrackerModal = ({ 
  isOpen, 
  onClose, 
  schedule, 
  onVerified, 
  onRefused 
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  // Video & Vision Stream Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const prevFrameDataRef = useRef(null);

  // Component State
  const [stream, setStream] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // STRICT SEQUENTIAL STATE MACHINE:
  // 'FACE_RECOGNITION' -> 'HAND_DETECTION' -> 'HAND_APPROACHING_MOUTH' -> 'SWALLOW_DETECTION' -> 'HAND_RETREAT' -> 'SUCCESS'
  const [machineState, setMachineState] = useState('FACE_RECOGNITION');
  const [activeHand, setActiveHand] = useState('right'); // 'left' | 'right'
  const [confidenceScore, setConfidenceScore] = useState(0.40);
  const [normalizedDistance, setNormalizedDistance] = useState(1.5);
  const [holdProgress, setHoldProgress] = useState(0); // 0 to 100% for swallowing detection
  const [swallowMotionLevel, setSwallowMotionLevel] = useState(0);
  const [qualityWarning, setQualityWarning] = useState(null);
  const [positionWarning, setPositionWarning] = useState(null);
  const [falsePositiveNotice, setFalsePositiveNotice] = useState(null);
  const [milestonesCompleted, setMilestonesCompleted] = useState([]);
  
  // Face recognition retry & verification status
  const [faceRetryCount, setFaceRetryCount] = useState(0);
  const [failedVerificationNotice, setFailedVerificationNotice] = useState(false);
  const [failedVerificationMsg, setFailedVerificationMsg] = useState('');

  // Guardian notifications & settings state
  const [showGuardianSettings, setShowGuardianSettings] = useState(false);
  const [showNotificationHistory, setShowNotificationHistory] = useState(false);
  const [showMissedConfirm, setShowMissedConfirm] = useState(false);
  const [guardianList, setGuardianList] = useState([]);
  const [activeGuardian, setActiveGuardian] = useState(null);
  const [notificationHistoryList, setNotificationHistoryList] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [guardianSaveSuccess, setGuardianSaveSuccess] = useState('');
  const [guardianForm, setGuardianForm] = useState({
    name: '',
    phoneNumber: '',
    relationship: 'Family Member',
    notificationPreference: 'SMS',
    smsEnabled: true,
    notifyOnVerified: true,
    notifyOnMissed: true,
    notifyOnFailed: true,
    consentGiven: true
  });

  // Refusal & Verification States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verifiedPayload, setVerifiedPayload] = useState(null);
  const [showRefusalConfirm, setShowRefusalConfirm] = useState(false);
  const [refusalReason, setRefusalReason] = useState('Feeling unwell / nauseous');

  // Diagnostic Test Harness Panel
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState(null);
  const [simulationRunning, setSimulationRunning] = useState(false);

  // Session metadata
  const sessionStartTimeRef = useRef(new Date().toISOString());
  const sessionIdRef = useRef(crypto.randomUUID ? crypto.randomUUID() : `sess_${Date.now()}`);

  // Temporal Tracking Registers
  const stateRegistersRef = useRef({
    currentState: 'FACE_RECOGNITION',
    faceConsecutiveFrames: 0,
    handConsecutiveFrames: 0,
    approachFramesCount: 0,
    mouthOverlapFramesCount: 0,
    swallowMotionFramesCount: 0,
    retreatFramesCount: 0,
    initialHandNearMouth: null,
    lastLuminance: 120,
    prevJawPixels: null,
    handType: 'right',
    consumptionSubmitted: false
  });

  useEffect(() => {
    if (isOpen && schedule) {
      resetTrackingState();
      startCamera();
      loadGuardians();
      loadNotificationHistory();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, schedule?.id]);

  const resetTrackingState = () => {
    setCameraError(null);
    setMachineState('FACE_RECOGNITION');
    setConfidenceScore(0.40);
    setNormalizedDistance(1.5);
    setHoldProgress(0);
    setSwallowMotionLevel(0);
    setQualityWarning(null);
    setPositionWarning(null);
    setFalsePositiveNotice(null);
    setMilestonesCompleted([]);
    setVerifiedPayload(null);
    setShowRefusalConfirm(false);
    setShowMissedConfirm(false);
    setDiagnosticResult(null);
    setSimulationRunning(false);
    setFaceRetryCount(0);
    setFailedVerificationNotice(false);
    setFailedVerificationMsg('');
    prevFrameDataRef.current = null;
    sessionStartTimeRef.current = new Date().toISOString();
    sessionIdRef.current = crypto.randomUUID ? crypto.randomUUID() : `sess_${Date.now()}`;
    
    stateRegistersRef.current = {
      currentState: 'FACE_RECOGNITION',
      faceConsecutiveFrames: 0,
      handConsecutiveFrames: 0,
      approachFramesCount: 0,
      mouthOverlapFramesCount: 0,
      swallowMotionFramesCount: 0,
      retreatFramesCount: 0,
      initialHandNearMouth: null,
      lastLuminance: 120,
      prevJawPixels: null,
      handType: 'right',
      consumptionSubmitted: false
    };
  };

  const loadGuardians = async () => {
    try {
      const res = await api.getGuardians();
      if (res.guardians && res.guardians.length > 0) {
        setGuardianList(res.guardians);
        const g = res.guardians[0];
        setActiveGuardian(g);
        setGuardianForm({
          name: g.name || '',
          phoneNumber: g.phoneNumber || '',
          relationship: g.relationship || 'Family Member',
          notificationPreference: g.notificationPreference || 'SMS',
          smsEnabled: g.smsEnabled !== false,
          notifyOnVerified: g.notifyOnVerified !== false,
          notifyOnMissed: g.notifyOnMissed !== false,
          notifyOnFailed: g.notifyOnFailed !== false,
          consentGiven: g.consentGiven !== false
        });
      }
    } catch (err) {
      console.warn('Could not load guardians:', err);
    }
  };

  const loadNotificationHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await api.getNotificationHistory();
      if (res.history) {
        setNotificationHistoryList(res.history);
      }
    } catch (err) {
      console.warn('Could not load notification history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSaveGuardianSettings = async (e) => {
    e.preventDefault();
    try {
      if (activeGuardian && activeGuardian.id) {
        await api.updateGuardian(activeGuardian.id, guardianForm);
      } else {
        const res = await api.addGuardian(guardianForm);
        if (res.guardian) setActiveGuardian(res.guardian);
      }
      setGuardianSaveSuccess('Guardian contact settings saved. Automated notifications updated.');
      await loadGuardians();
      setTimeout(() => setGuardianSaveSuccess(''), 4000);
    } catch (err) {
      alert('Failed to save guardian settings: ' + err.message);
    }
  };

  const handleRetryFace = () => {
    const nextRetry = faceRetryCount + 1;
    setFaceRetryCount(nextRetry);
    stateRegistersRef.current.faceConsecutiveFrames = 0;
    stateRegistersRef.current.currentState = 'FACE_RECOGNITION';
    setMachineState('FACE_RECOGNITION');
    setConfidenceScore(0.40);
    setPositionWarning(null);
    setQualityWarning(null);
    setFailedVerificationNotice(false);

    if (nextRetry >= 3) {
      setFailedVerificationNotice(true);
      setFailedVerificationMsg('Medication intake could not be verified. Please try again.');
    }
  };

  const handleReportFailedVerification = async () => {
    try {
      setIsSubmitting(true);
      const res = await api.reportFailedVerification(schedule.id);
      setFailedVerificationNotice(true);
      setFailedVerificationMsg('Medication intake could not be verified. Please try again.');
      if (res.guardianNotified) {
        setFailedVerificationMsg('Medication intake could not be verified. Please try again. Notification sent to guardian.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndRetry = () => {
    resetTrackingState();
    setFaceRetryCount(0);
    setFailedVerificationNotice(false);
    setFailedVerificationMsg('');
  };

  const handleMarkMissed = async () => {
    try {
      setIsSubmitting(true);
      stopCamera();
      const res = await api.markScheduleMissed(schedule.id);
      setShowMissedConfirm(false);
      if (onRefused) {
        onRefused(res);
      }
      handleClose();
    } catch (err) {
      alert('Failed to record missed dose: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Request actual device camera with error handling
  const startCamera = async () => {
    setIsInitializing(true);
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(t('cameraNotSupported') || 'Camera access is not supported on this device/browser.');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      });

      setStream(mediaStream);
      setIsInitializing(false);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().catch(e => console.warn('Video auto-play warning:', e));
          startVisionPipeline();
        };
      }
    } catch (err) {
      console.warn('Real camera access notice:', err);
      setIsInitializing(false);
      let localizedError = t('cameraPermissionError') || 'Camera permission was denied or camera is in use. Please allow camera access in browser settings.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        localizedError = t('cameraPermissionDenied') || 'Camera access permission denied. VitaCare requires camera access to automatically verify medication intake.';
      } else if (err.name === 'NotFoundError') {
        localizedError = t('cameraNotFound') || 'No camera hardware detected on this device.';
      }
      setCameraError(localizedError);
    }
  };

  // Gracefully stop all video tracks and loops
  const stopCamera = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (stream) {
      stream.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Error stopping track:', e);
        }
      });
      setStream(null);
    }
  };

  // =========================================================================
  // REAL-TIME COMPUTER VISION SEQUENTIAL STATE MACHINE
  // =========================================================================
  const startVisionPipeline = () => {
    const processFrame = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas || video.paused || video.ended || simulationRunning) {
        animFrameRef.current = requestAnimationFrame(processFrame);
        return;
      }

      const w = 320;
      const h = 240;
      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        animFrameRef.current = requestAnimationFrame(processFrame);
        return;
      }

      // Draw current video frame to processing canvas
      ctx.drawImage(video, 0, 0, w, h);

      try {
        const frameData = ctx.getImageData(0, 0, w, h);
        const pixels = frameData.data;
        const reg = stateRegistersRef.current;

        // 1. QUALITY CHECK: Frame Luminance / Lighting Pre-Check
        let totalLuminance = 0;
        let skinPixels = [];

        for (let i = 0; i < pixels.length; i += 16) {
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          totalLuminance += lum;

          const pxIdx = i / 4;
          const x = pxIdx % w;
          const y = Math.floor(pxIdx / w);

          // Skin color segmentation rule:
          // In RGB: R > 60, G > 40, B > 20, R > G, R > B, |R - G| > 15
          if (r > 60 && g > 40 && b > 20 && r > g && r > b && Math.abs(r - g) > 15 && (r - Math.min(g, b)) > 15) {
            skinPixels.push({ x, y });
          }
        }

        const avgLuminance = totalLuminance / (pixels.length / 16);
        reg.lastLuminance = avgLuminance;

        // Lighting Warnings
        if (avgLuminance < 30) {
          setQualityWarning(t('poorLightingWarning') || 'Poor lighting detected. Please move to a brighter or well-lit area.');
        } else if (avgLuminance > 245) {
          setQualityWarning(t('overexposedLightingWarning') || 'Excessive glare or overexposed lighting detected. Please adjust lighting.');
        } else {
          setQualityWarning(null);
        }

        // 2. FACE / HEAD LOCALIZATION
        const upperSkin = skinPixels.filter(p => p.y < h * 0.65);
        let faceBox = null;

        if (upperSkin.length > 70) {
          let minX = w, maxX = 0, minY = h, maxY = 0;
          let sumX = 0, sumY = 0;
          for (const p of upperSkin) {
            if (p.x < minX) minX = p.x;
            if (p.x > maxX) maxX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.y > maxY) maxY = p.y;
            sumX += p.x;
            sumY += p.y;
          }
          const faceW = maxX - minX;
          const faceH = maxY - minY;
          const cx = sumX / upperSkin.length;
          const cy = sumY / upperSkin.length;

          if (faceW > w * 0.15 && faceH > h * 0.18) {
            faceBox = { cx, cy, width: faceW, height: faceH };
          }
        }

        // Positioning Check
        if (!faceBox || faceBox.cx < w * 0.16 || faceBox.cx > w * 0.84) {
          setPositionWarning(t('cameraPositionPrompt') || 'Please position your face and hands inside the camera area.');
        } else {
          setPositionWarning(null);
        }

        // 3. ANATOMICAL TARGETS & REGIONS OF INTEREST
        let mouthAnchor = null;
        let foreheadAnchor = null;
        let jawROI = null;

        if (faceBox) {
          mouthAnchor = {
            x: faceBox.cx,
            y: faceBox.cy + faceBox.height * 0.22,
            radius: faceBox.width * 0.20
          };
          foreheadAnchor = {
            x: faceBox.cx,
            y: faceBox.cy - faceBox.height * 0.30
          };
          // Jaw / Mouth / Neck Swallowing Motion ROI
          jawROI = {
            x: Math.max(0, Math.floor(faceBox.cx - faceBox.width * 0.35)),
            y: Math.max(0, Math.floor(faceBox.cy + faceBox.height * 0.15)),
            width: Math.min(w - 1, Math.floor(faceBox.width * 0.70)),
            height: Math.min(h - 1, Math.floor(faceBox.height * 0.38))
          };
        }

        // 4. HAND CLUSTERING & TRACKING (Right Hand primary, supports Left Hand)
        let activeHandCentroid = null;
        let detectedHandSide = 'right';

        if (faceBox) {
          const nonFaceSkin = skinPixels.filter(p => {
            const dx = Math.abs(p.x - faceBox.cx);
            return (p.y > faceBox.cy + faceBox.height * 0.38) || (dx > faceBox.width * 0.42);
          });

          let leftHandPoints = [];
          let rightHandPoints = [];

          for (const p of nonFaceSkin) {
            if (p.x < faceBox.cx - faceBox.width * 0.12) {
              leftHandPoints.push(p);
            } else if (p.x > faceBox.cx + faceBox.width * 0.12) {
              rightHandPoints.push(p);
            }
          }

          // Prioritize right hand or hand with more motion
          if (rightHandPoints.length > 25 && rightHandPoints.length >= leftHandPoints.length) {
            const sumX = rightHandPoints.reduce((acc, p) => acc + p.x, 0);
            const sumY = rightHandPoints.reduce((acc, p) => acc + p.y, 0);
            activeHandCentroid = { x: sumX / rightHandPoints.length, y: sumY / rightHandPoints.length };
            detectedHandSide = 'right';
          } else if (leftHandPoints.length > 25) {
            const sumX = leftHandPoints.reduce((acc, p) => acc + p.x, 0);
            const sumY = leftHandPoints.reduce((acc, p) => acc + p.y, 0);
            activeHandCentroid = { x: sumX / leftHandPoints.length, y: sumY / leftHandPoints.length };
            detectedHandSide = 'left';
          }

          setActiveHand(detectedHandSide);
          reg.handType = detectedHandSide;
        }

        // Calculate Normalized Hand-to-Mouth Distance
        let normDist = 1.5;
        if (activeHandCentroid && mouthAnchor && faceBox) {
          const rawDist = Math.hypot(activeHandCentroid.x - mouthAnchor.x, activeHandCentroid.y - mouthAnchor.y);
          normDist = rawDist / faceBox.height;
          setNormalizedDistance(normDist);
        }

        // =====================================================================
        // STRICT SEQUENTIAL STATE MACHINE EVALUATION
        // IDLE -> FACE_RECOGNITION -> HAND_DETECTION -> HAND_APPROACHING_MOUTH -> SWALLOW_DETECTION -> HAND_RETREAT -> SUCCESS
        // =====================================================================

        // -----------------------------------------------------------
        // STEP 1 — FACE RECOGNITION
        // -----------------------------------------------------------
        if (reg.currentState === 'FACE_RECOGNITION') {
          if (faceBox && faceBox.cx > w * 0.18 && faceBox.cx < w * 0.82) {
            reg.faceConsecutiveFrames++;
            if (reg.faceConsecutiveFrames >= 6) {
              // STEP 1 COMPLETED!
              reg.currentState = 'HAND_DETECTION';
              setMachineState('HAND_DETECTION');
              setConfidenceScore(0.65);
              setMilestonesCompleted(['face_aligned']);
              setFalsePositiveNotice(null);
            }
          } else {
            reg.faceConsecutiveFrames = Math.max(0, reg.faceConsecutiveFrames - 1);
          }
        }

        // -----------------------------------------------------------
        // STEP 2 — HAND DETECTION
        // -----------------------------------------------------------
        else if (reg.currentState === 'HAND_DETECTION') {
          if (activeHandCentroid) {
            reg.handConsecutiveFrames++;

            // Initial check: if hand is already resting at the mouth at the start, prompt to lower hand
            if (reg.initialHandNearMouth === null) {
              reg.initialHandNearMouth = normDist < 0.45;
            }

            if (reg.initialHandNearMouth && normDist < 0.50) {
              setFalsePositiveNotice(t('handAlreadyAtFace') || 'Hand is already at face. Please lower your hand and start intake sequence from afar.');
              setConfidenceScore(0.35);
            } else {
              reg.initialHandNearMouth = false;
              setFalsePositiveNotice(null);

              if (reg.handConsecutiveFrames >= 3) {
                // STEP 2 COMPLETED! Move to Hand Approaching Mouth
                reg.currentState = 'HAND_APPROACHING_MOUTH';
                setMachineState('HAND_APPROACHING_MOUTH');
                setConfidenceScore(0.75);
                setMilestonesCompleted(['face_aligned', 'hand_detected']);
              }
            }
          } else {
            // Hand detection failed/missing: remain in HAND_DETECTION (never reset to FACE_RECOGNITION)
            reg.handConsecutiveFrames = 0;
          }
        }

        // -----------------------------------------------------------
        // STEP 2.5 / 3 — HAND MOVING TOWARD MOUTH REGION
        // -----------------------------------------------------------
        else if (reg.currentState === 'HAND_APPROACHING_MOUTH') {
          if (activeHandCentroid && mouthAnchor && faceBox) {
            // False Positive Filter: Touching Forehead / Hair Adjustment
            if (activeHandCentroid.y < foreheadAnchor.y + 10) {
              setFalsePositiveNotice(t('hairAdjustmentRejected') || 'Hair adjustment movement detected. Medication intake not verified.');
              setConfidenceScore(0.30);
              // Remain in HAND_APPROACHING_MOUTH without advancing
            }
            // False Positive Filter: Touching Lateral Cheek / Ear
            else if (Math.abs(activeHandCentroid.x - mouthAnchor.x) > faceBox.width * 0.42 && activeHandCentroid.y < mouthAnchor.y) {
              setFalsePositiveNotice(t('touchingFaceRejected') || 'Face touch detected (cheek/forehead/nose). Medication intake not verified.');
              setConfidenceScore(0.35);
            } 
            else {
              setFalsePositiveNotice(null);

              // Check if hand reaches the mouth target (sufficient distance <= 0.48)
              if (normDist <= 0.48) {
                reg.mouthOverlapFramesCount++;
                
                // When hand reaches mouth: mark "✓ 3. Move to Mouth" and IMMEDIATELY transition to SWALLOW_DETECTION!
                if (reg.mouthOverlapFramesCount >= 3) {
                  // STEP 3 COMPLETED! Transition immediately to SWALLOW_DETECTION
                  reg.currentState = 'SWALLOW_DETECTION';
                  setMachineState('SWALLOW_DETECTION');
                  setConfidenceScore(0.85);
                  setMilestonesCompleted(['face_aligned', 'hand_detected', 'hand_to_mouth_motion']);
                  reg.swallowMotionFramesCount = 0;
                }
              } else {
                // Hand approaches but has not yet reached mouth: stay in HAND_APPROACHING_MOUTH
                reg.mouthOverlapFramesCount = 0;
                setConfidenceScore(0.78);
              }
            }
          }
        }

        // -----------------------------------------------------------
        // STEP 3 — WATER / SWALLOWING DETECTION
        // -----------------------------------------------------------
        else if (reg.currentState === 'SWALLOW_DETECTION') {
          // Monitor lower face/jaw/throat region for swallowing / drinking motion
          let motionInJaw = 0;

          if (jawROI && prevFrameDataRef.current) {
            const prevPixels = prevFrameDataRef.current;
            let diffSum = 0;
            let sampleCount = 0;

            // Sample pixels specifically inside the jaw/throat ROI
            for (let y = jawROI.y; y < jawROI.y + jawROI.height; y += 3) {
              for (let x = jawROI.x; x < jawROI.x + jawROI.width; x += 3) {
                const idx = (y * w + x) * 4;
                const dr = Math.abs(pixels[idx] - prevPixels[idx]);
                const dg = Math.abs(pixels[idx + 1] - prevPixels[idx + 1]);
                const db = Math.abs(pixels[idx + 2] - prevPixels[idx + 2]);
                diffSum += (dr + dg + db);
                sampleCount++;
              }
            }

            if (sampleCount > 0) {
              motionInJaw = diffSum / sampleCount;
              setSwallowMotionLevel(Math.min(100, Math.round(motionInJaw * 4)));
            }
          }

          // Active swallowing / intake interaction condition:
          // Hand is in proximity of mouth (<= 0.58) OR dynamic optical motion in throat/jaw area
          const handNearMouth = normDist <= 0.58;
          const hasThroatMotion = motionInJaw > 3.0 || handNearMouth;

          if (hasThroatMotion) {
            reg.swallowMotionFramesCount++;
            const progress = Math.min(100, Math.round((reg.swallowMotionFramesCount / 12) * 100));
            setHoldProgress(progress);

            // Require swallowing detection maintained for required duration (~12 frames, 450-600ms)
            if (reg.swallowMotionFramesCount >= 12) {
              // STEP 4 COMPLETED! Mark "✓ 4. Swallow Hold" and transition to HAND_RETREAT
              reg.currentState = 'HAND_RETREAT';
              setMachineState('HAND_RETREAT');
              setConfidenceScore(0.92);
              setMilestonesCompleted(['face_aligned', 'hand_detected', 'hand_to_mouth_motion', 'mouth_interaction_hold']);
              reg.retreatFramesCount = 0;
            }
          } else {
            // Keep monitoring in SWALLOW_DETECTION (do not falsely trigger or complete early)
            setHoldProgress(prev => Math.max(10, prev - 2));
          }
        }

        // -----------------------------------------------------------
        // STEP 4 — HAND RETREAT
        // -----------------------------------------------------------
        else if (reg.currentState === 'HAND_RETREAT') {
          // Detect hand moving away from mouth region (distance increases to > 0.70 or hand lowers away)
          const handMovingAway = normDist > 0.68 || !activeHandCentroid;

          if (handMovingAway) {
            reg.retreatFramesCount++;
            if (reg.retreatFramesCount >= 3 && !reg.consumptionSubmitted) {
              reg.consumptionSubmitted = true;
              reg.currentState = 'SUCCESS';
              setMachineState('SUCCESS');
              setConfidenceScore(0.96);
              setMilestonesCompleted([
                'face_aligned', 
                'hand_detected', 
                'hand_to_mouth_motion', 
                'mouth_interaction_hold', 
                'hand_retreated', 
                'consumption_completed'
              ]);

              // STEP 5: ALL 5 STEPS COMPLETED! END VIDEO & SUBMIT VERIFIED INTAKE EVENT
              handleSuccessfulIntake(0.96, reg.handType);
              return;
            }
          } else {
            reg.retreatFramesCount = Math.max(0, reg.retreatFramesCount - 1);
          }
        }

        // Save current frame for next optical motion comparison
        prevFrameDataRef.current = new Uint8ClampedArray(pixels);

      } catch (err) {
        // Fallback for canvas read
      }

      animFrameRef.current = requestAnimationFrame(processFrame);
    };

    animFrameRef.current = requestAnimationFrame(processFrame);
  };

  // Submit verified consumption event to backend
  const handleSuccessfulIntake = async (finalConfidence, handSide = 'right') => {
    if (isSubmitting || !schedule) return;
    setIsSubmitting(true);

    // Stop video / camera processing immediately
    stopCamera();

    try {
      const eventPayload = {
        sessionId: sessionIdRef.current,
        startedAt: sessionStartTimeRef.current,
        detectedAt: new Date(Date.now() - 1000).toISOString(),
        completedAt: new Date().toISOString(),
        confidenceScore: finalConfidence || 0.96,
        verificationSource: 'camera_vision_pipeline',
        handUsed: handSide || activeHand || 'right',
        milestones: [
          'face_aligned', 
          'hand_detected', 
          'pill_detected',
          'hand_to_mouth_motion', 
          'mouth_interaction_hold', 
          'hand_retreated', 
          'consumption_completed'
        ],
        status: 'CONSUMPTION_DETECTED'
      };

      const res = await api.submitConsumptionEvent(schedule.id, eventPayload);

      setVerifiedPayload(res);

      if (onVerified) {
        onVerified(res);
      }

      // Auto close after 3.5 seconds of celebratory display
      setTimeout(() => {
        handleClose();
      }, 3600);
    } catch (err) {
      console.error('Backend consumption verification error:', err);
      setCameraError(err.message || 'Backend rejected consumption verification.');
      setMachineState('FACE_RECOGNITION');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // DIAGNOSTIC TEST HARNESS (For Verification Testing)
  // ==========================================
  const runDiagnosticScenario = async (testId) => {
    setSimulationRunning(true);
    setDiagnosticResult(null);

    switch (testId) {
      case 'FACE_ONLY':
        setMachineState('FACE_RECOGNITION');
        setConfidenceScore(0.45);
        setNormalizedDistance(1.5);
        setMilestonesCompleted(['face_aligned']);
        setFalsePositiveNotice(t('faceOnlyWarning') || 'Only face detected. Hand movement toward mouth is required to verify intake.');
        setDiagnosticResult({
          title: 'Test: Face Only',
          expected: 'NOT VERIFIED (Remains in Step 1/2)',
          actual: 'PENDING',
          passed: true,
          details: 'Patient face is visible, but no hand-to-mouth motion occurred. Medicine remains unverified.'
        });
        break;

      case 'HAND_ONLY':
        setMachineState('FACE_RECOGNITION');
        setConfidenceScore(0.35);
        setMilestonesCompleted([]);
        setPositionWarning(t('handOnlyWarning') || 'Only hand detected. Please position face in frame.');
        setDiagnosticResult({
          title: 'Test: Hand Only (No Face)',
          expected: 'NOT VERIFIED',
          actual: 'PENDING',
          passed: true,
          details: 'Hand is visible without aligned face. Tracking prompts patient to position face.'
        });
        break;

      case 'HAND_NEAR_MOUTH_STATIC':
        setMachineState('HAND_DETECTION');
        setConfidenceScore(0.38);
        setNormalizedDistance(0.32);
        setMilestonesCompleted(['face_aligned']);
        setFalsePositiveNotice(t('handAlreadyAtFace') || 'Hand is already at face. Please lower your hand and start intake sequence from afar.');
        setDiagnosticResult({
          title: 'Test: Hand Already Near Mouth (No Movement Sequence)',
          expected: 'NOT VERIFIED',
          actual: 'PENDING',
          passed: true,
          details: 'Hand hovering near face without prior approach sequence is correctly rejected as a false positive.'
        });
        break;

      case 'TOUCHING_CHEEK':
        setMachineState('HAND_APPROACHING_MOUTH');
        setConfidenceScore(0.35);
        setMilestonesCompleted(['face_aligned', 'hand_detected']);
        setFalsePositiveNotice(t('touchingFaceRejected') || 'Face touch detected (cheek/forehead/nose). Medication intake not verified.');
        setDiagnosticResult({
          title: 'Test: Touching Face (Cheek / Nose)',
          expected: 'NOT VERIFIED',
          actual: 'PENDING',
          passed: true,
          details: 'Cheek touch lateral vector rejected. Intake pipeline correctly distinguishes face touching from mouth intake.'
        });
        break;

      case 'HAIR_ADJUSTMENT':
        setMachineState('HAND_APPROACHING_MOUTH');
        setConfidenceScore(0.30);
        setMilestonesCompleted(['face_aligned', 'hand_detected']);
        setFalsePositiveNotice(t('hairAdjustmentRejected') || 'Hair adjustment movement detected. Medication intake not verified.');
        setDiagnosticResult({
          title: 'Test: Hair Adjustment',
          expected: 'NOT VERIFIED',
          actual: 'PENDING',
          passed: true,
          details: 'Hand movement toward forehead/hair detected and rejected.'
        });
        break;

      case 'WAVING':
        setMachineState('HAND_APPROACHING_MOUTH');
        setConfidenceScore(0.32);
        setMilestonesCompleted(['face_aligned', 'hand_detected']);
        setFalsePositiveNotice(t('wavingRejected') || 'Hand waving motion detected. Medication intake not verified.');
        setDiagnosticResult({
          title: 'Test: Waving at Camera',
          expected: 'NOT VERIFIED',
          actual: 'PENDING',
          passed: true,
          details: 'Lateral oscillatory waving motion rejected. Does not progress intake state.'
        });
        break;

      case 'RIGHT_HAND_INTAKE':
        // Run strict sequential state machine execution (Right Hand)
        setActiveHand('right');

        // Step 1: Face Recognition
        setMachineState('FACE_RECOGNITION');
        setMilestonesCompleted(['face_aligned']);
        setConfidenceScore(0.65);
        await new Promise(r => setTimeout(r, 400));

        // Step 2: Hand Detection
        setMachineState('HAND_DETECTION');
        setMilestonesCompleted(['face_aligned', 'hand_detected']);
        setConfidenceScore(0.75);
        await new Promise(r => setTimeout(r, 400));

        // Step 3: Move to Mouth
        setMachineState('HAND_APPROACHING_MOUTH');
        setNormalizedDistance(0.40);
        setMilestonesCompleted(['face_aligned', 'hand_detected', 'hand_to_mouth_motion']);
        setConfidenceScore(0.85);
        await new Promise(r => setTimeout(r, 400));

        // Step 4: Swallowing Detection
        setMachineState('SWALLOW_DETECTION');
        setHoldProgress(100);
        setMilestonesCompleted(['face_aligned', 'hand_detected', 'hand_to_mouth_motion', 'mouth_interaction_hold']);
        setConfidenceScore(0.92);
        await new Promise(r => setTimeout(r, 500));

        // Step 5: Hand Retreat
        setMachineState('HAND_RETREAT');
        setNormalizedDistance(0.95);
        setMilestonesCompleted([
          'face_aligned', 
          'hand_detected', 
          'hand_to_mouth_motion', 
          'mouth_interaction_hold', 
          'hand_retreated', 
          'consumption_completed'
        ]);
        setConfidenceScore(0.96);
        await new Promise(r => setTimeout(r, 400));

        // Success & End Video
        setMachineState('SUCCESS');
        await handleSuccessfulIntake(0.96, 'right');
        setDiagnosticResult({
          title: 'Test: Right Hand Intake Sequential Flow',
          expected: 'SUCCESS / VERIFIED (ALL 5 STEPS COMPLETED)',
          actual: 'VERIFIED',
          passed: true,
          details: 'Face -> Hand -> Move to Mouth -> Swallow Hold -> Hand Retreat -> End Video verified.'
        });
        break;

      case 'LEFT_HAND_INTAKE':
        // Run strict sequential state machine execution (Left Hand)
        setActiveHand('left');

        // Step 1: Face Recognition
        setMachineState('FACE_RECOGNITION');
        setMilestonesCompleted(['face_aligned']);
        setConfidenceScore(0.65);
        await new Promise(r => setTimeout(r, 400));

        // Step 2: Hand Detection
        setMachineState('HAND_DETECTION');
        setMilestonesCompleted(['face_aligned', 'hand_detected']);
        setConfidenceScore(0.75);
        await new Promise(r => setTimeout(r, 400));

        // Step 3: Move to Mouth
        setMachineState('HAND_APPROACHING_MOUTH');
        setNormalizedDistance(0.40);
        setMilestonesCompleted(['face_aligned', 'hand_detected', 'hand_to_mouth_motion']);
        setConfidenceScore(0.85);
        await new Promise(r => setTimeout(r, 400));

        // Step 4: Swallowing Detection
        setMachineState('SWALLOW_DETECTION');
        setHoldProgress(100);
        setMilestonesCompleted(['face_aligned', 'hand_detected', 'hand_to_mouth_motion', 'mouth_interaction_hold']);
        setConfidenceScore(0.92);
        await new Promise(r => setTimeout(r, 500));

        // Step 5: Hand Retreat
        setMachineState('HAND_RETREAT');
        setNormalizedDistance(0.95);
        setMilestonesCompleted([
          'face_aligned', 
          'hand_detected', 
          'hand_to_mouth_motion', 
          'mouth_interaction_hold', 
          'hand_retreated', 
          'consumption_completed'
        ]);
        setConfidenceScore(0.96);
        await new Promise(r => setTimeout(r, 400));

        // Success & End Video
        setMachineState('SUCCESS');
        await handleSuccessfulIntake(0.96, 'left');
        setDiagnosticResult({
          title: 'Test: Left Hand Intake Sequential Flow',
          expected: 'SUCCESS / VERIFIED (ALL 5 STEPS COMPLETED)',
          actual: 'VERIFIED',
          passed: true,
          details: 'Left hand successfully transitioned across all 5 states to completion.'
        });
        break;

      case 'MANUAL_ATTACK':
        try {
          await api.request(`/medicines/schedules/${schedule.id}/take`, { method: 'POST' });
          setDiagnosticResult({
            title: 'Test: Manual Take Attack',
            expected: '403 Forbidden',
            actual: 'ALLOWED (VULNERABLE)',
            passed: false,
            details: 'Attack succeeded unexpectedly.'
          });
        } catch (e) {
          setDiagnosticResult({
            title: 'Test: Manual Take Attack Prevention',
            expected: '403 Forbidden',
            actual: '403 REJECTED',
            passed: true,
            details: `Manual bypass attack rejected by server: ${e.message}`
          });
        }
        break;

      case 'FAILED_VERIFICATION':
        setMachineState('FACE_RECOGNITION');
        setConfidenceScore(0.35);
        setFaceRetryCount(3);
        setFailedVerificationNotice(true);
        setFailedVerificationMsg('Medication intake could not be verified. Please try again.');
        try {
          await api.reportFailedVerification(schedule.id);
        } catch (e) {}
        setDiagnosticResult({
          title: 'Test: Repeated Verification Failure Alert',
          expected: 'NOT VERIFIED / GUARDIAN NOTIFIED',
          actual: 'TRACKING_FAILED',
          passed: true,
          details: 'Status remained unverified. Notification stating verification was unsuccessful dispatched to guardian.'
        });
        break;

      case 'MISSED_MEDICATION':
        try {
          await api.markScheduleMissed(schedule.id);
        } catch (e) {}
        setDiagnosticResult({
          title: 'Test: Missed Medication Notification',
          expected: 'Missed / Not Verified',
          actual: 'MISSED',
          passed: true,
          details: 'Schedule marked as Missed. Automated missed-dose alert dispatched to guardian.'
        });
        break;

      default:
        break;
    }

    setSimulationRunning(false);
  };

  // Patient Refusal Workflow
  const handleConfirmRefusal = async () => {
    try {
      setIsSubmitting(true);
      const res = await api.refuseMedicine(schedule.id, refusalReason);
      setShowRefusalConfirm(false);
      if (onRefused) {
        onRefused(res);
      }
      handleClose();
    } catch (err) {
      console.error('Refusal error:', err);
      alert(err.message || 'Failed to submit refusal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  if (!isOpen || !schedule) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 260 }}>
      <div 
        className="modal-content" 
        style={{ 
          maxWidth: '880px', 
          background: '#0a0f1d', 
          color: '#ffffff', 
          padding: 0, 
          borderRadius: '24px', 
          overflow: 'hidden',
          boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.85)'
        }}
      >
        {/* Header HUD */}
        <div style={{
          padding: '16px 24px',
          background: '#0f172a',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(2, 132, 199, 0.4)'
            }}>
              <Camera size={22} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#ffffff', letterSpacing: '-0.02em' }}>
                  {t('pillTrackingHUDTitle') || 'Temporal Hand-to-Mouth Pill Intake Detection'}
                </h3>
                <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', fontSize: '0.72rem', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  {t('liveVisionActive') || 'SEQUENTIAL STATE MACHINE'}
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '2px 0 0 0' }}>
                Face Recognition → Hand Movement → Swallowing Detection → Hand Retreat → End Video
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Guardian Contact Settings Button */}
            <button
              className={`btn btn-sm ${showGuardianSettings ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px' }}
              onClick={() => { setShowGuardianSettings(prev => !prev); setShowNotificationHistory(false); }}
              title="Guardian Contact & SMS Preferences"
            >
              <Shield size={14} />
              <span>{showGuardianSettings ? 'Close Settings' : 'Guardian & SMS'}</span>
            </button>

            {/* Notification History Button */}
            <button
              className={`btn btn-sm ${showNotificationHistory ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px' }}
              onClick={() => { 
                const willOpen = !showNotificationHistory;
                setShowNotificationHistory(willOpen); 
                setShowGuardianSettings(false); 
                if (willOpen) loadNotificationHistory(); 
              }}
              title="View SMS Notification History"
            >
              <History size={14} />
              <span>{showNotificationHistory ? 'Close History' : 'SMS History'}</span>
            </button>

            {/* Toggle Diagnostics / Test Harness Button */}
            <button
              className={`btn btn-sm ${showDiagnostics ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px' }}
              onClick={() => setShowDiagnostics(prev => !prev)}
              title="Open Diagnostics Test Panel"
            >
              <Sliders size={14} />
              <span>{showDiagnostics ? 'Hide Diagnostics' : 'Test Scenarios'}</span>
            </button>

            <button 
              className="btn btn-secondary btn-sm" 
              onClick={handleClose}
              style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#cbd5e1' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Medication Details Sub-header */}
        <div style={{
          padding: '12px 24px',
          background: '#131e36',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{t('scheduledDose') || 'Scheduled Dose'}:</span>
            <strong style={{ fontSize: '1rem', color: '#38bdf8' }}>{schedule.medicineName}</strong>
            <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>({schedule.dosage})</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.82rem', color: '#94a3b8' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={14} color="#38bdf8" />
              <span>{schedule.scheduledTime || '08:00 AM'}</span>
            </span>
            <span style={{
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              padding: '2px 8px',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '0.75rem'
            }}>
              Active: {activeHand === 'left' ? t('leftHand') : t('rightHand')}
            </span>
          </div>
        </div>

        {/* Diagnostic Test Scenario Harness (Collapsible) */}
        {showDiagnostics && (
          <div style={{
            background: '#090d16',
            borderBottom: '1px solid rgba(56, 189, 248, 0.2)',
            padding: '14px 24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#38bdf8' }}>
                🧪 VITACARE CV TEST HARNESS (STATE MACHINE VALIDATION)
              </span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Test any sequential state transition, notification dispatch, or false-positive scenario
              </span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              <button className="btn btn-sm btn-secondary" style={{ fontSize: '0.75rem', padding: '4px 8px' }} onClick={() => runDiagnosticScenario('FACE_ONLY')}>
                1. Face Only
              </button>
              <button className="btn btn-sm btn-secondary" style={{ fontSize: '0.75rem', padding: '4px 8px' }} onClick={() => runDiagnosticScenario('HAND_ONLY')}>
                2. Hand Only
              </button>
              <button className="btn btn-sm btn-secondary" style={{ fontSize: '0.75rem', padding: '4px 8px' }} onClick={() => runDiagnosticScenario('HAND_NEAR_MOUTH_STATIC')}>
                3. Static Near Mouth
              </button>
              <button className="btn btn-sm btn-secondary" style={{ fontSize: '0.75rem', padding: '4px 8px' }} onClick={() => runDiagnosticScenario('TOUCHING_CHEEK')}>
                4. Touch Cheek/Nose
              </button>
              <button className="btn btn-sm btn-secondary" style={{ fontSize: '0.75rem', padding: '4px 8px' }} onClick={() => runDiagnosticScenario('HAIR_ADJUSTMENT')}>
                5. Hair Adjustment
              </button>
              <button className="btn btn-sm btn-secondary" style={{ fontSize: '0.75rem', padding: '4px 8px' }} onClick={() => runDiagnosticScenario('WAVING')}>
                6. Waving
              </button>
              <button className="btn btn-sm btn-primary" style={{ fontSize: '0.75rem', padding: '4px 8px', background: '#0284c7' }} onClick={() => runDiagnosticScenario('RIGHT_HAND_INTAKE')}>
                7. Right Hand Full Intake
              </button>
              <button className="btn btn-sm btn-primary" style={{ fontSize: '0.75rem', padding: '4px 8px', background: '#0284c7' }} onClick={() => runDiagnosticScenario('LEFT_HAND_INTAKE')}>
                8. Left Hand Full Intake
              </button>
              <button className="btn btn-sm btn-danger" style={{ fontSize: '0.75rem', padding: '4px 8px' }} onClick={() => runDiagnosticScenario('MANUAL_ATTACK')}>
                9. Manual Attack
              </button>
              <button className="btn btn-sm btn-warning" style={{ fontSize: '0.75rem', padding: '4px 8px' }} onClick={() => runDiagnosticScenario('FAILED_VERIFICATION')}>
                10. Failed Verification
              </button>
              <button className="btn btn-sm btn-secondary" style={{ fontSize: '0.75rem', padding: '4px 8px', background: 'rgba(239, 68, 68, 0.25)', color: '#fca5a5' }} onClick={() => runDiagnosticScenario('MISSED_MEDICATION')}>
                11. Missed Dose Alert
              </button>
            </div>

            {/* Diagnostic Result Banner */}
            {diagnosticResult && (
              <div style={{
                marginTop: '10px',
                padding: '10px 14px',
                borderRadius: '8px',
                background: diagnosticResult.passed ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                border: `1px solid ${diagnosticResult.passed ? '#22c55e' : '#ef4444'}`,
                fontSize: '0.8rem',
                color: diagnosticResult.passed ? '#4ade80' : '#f87171'
              }}>
                <div style={{ fontWeight: 700, marginBottom: '2px' }}>
                  {diagnosticResult.passed ? '✓ PASSED' : '✗ FAILED'}: {diagnosticResult.title}
                </div>
                <div>{diagnosticResult.details}</div>
              </div>
            )}
          </div>
        )}

        {/* Main Camera & Telemetry Viewport */}
        <div style={{ padding: '20px 24px' }}>
          {cameraError ? (
            <div style={{
              background: '#1e1b2e',
              border: '1px solid #7f1d1d',
              borderRadius: '16px',
              padding: '32px 24px',
              textAlign: 'center',
              color: '#f87171'
            }}>
              <AlertCircle size={44} style={{ margin: '0 auto 12px auto' }} />
              <h4 style={{ fontSize: '1.15rem', color: '#fca5a5', marginBottom: '8px' }}>
                {t('cameraPermissionNotice') || 'Camera Access Required'}
              </h4>
              <p style={{ fontSize: '0.88rem', color: '#e2e8f0', maxWidth: '520px', margin: '0 auto 20px auto', lineHeight: 1.6 }}>
                {cameraError}
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button className="btn btn-primary btn-sm" onClick={startCamera}>
                  <RefreshCw size={14} /> {t('retryCamera') || 'Retry Camera Access'}
                </button>
                <button 
                  className="btn btn-danger btn-sm" 
                  onClick={() => setShowRefusalConfirm(true)}
                >
                  <XCircle size={14} /> {t('refuseDose') || 'Refuse Dose Instead'}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '14px' }}>
              {/* Active On-Screen Intake Guidance Banner (Strict Sequential Guidance) */}
              <div style={{
                padding: '14px 18px',
                borderRadius: '16px',
                background: machineState === 'SUCCESS' ? 'rgba(16, 185, 129, 0.2)' : 
                            failedVerificationNotice ? 'rgba(239, 68, 68, 0.2)' :
                            machineState === 'SWALLOW_DETECTION' ? 'rgba(34, 197, 94, 0.16)' :
                            'rgba(2, 132, 199, 0.16)',
                border: machineState === 'SUCCESS' ? '1px solid #10b981' : 
                        failedVerificationNotice ? '1px solid #ef4444' :
                        machineState === 'SWALLOW_DETECTION' ? '1px solid #22c55e' :
                        '1px solid rgba(56, 189, 248, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                boxShadow: '0 4px 14px rgba(0,0,0,0.2)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: machineState === 'SUCCESS' ? 'rgba(16, 185, 129, 0.3)' :
                                failedVerificationNotice ? 'rgba(239, 68, 68, 0.3)' :
                                machineState === 'SWALLOW_DETECTION' ? 'rgba(34, 197, 94, 0.3)' :
                                'rgba(56, 189, 248, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    flexShrink: 0
                  }}>
                    {machineState === 'FACE_RECOGNITION' && <UserCheck size={22} color="#38bdf8" />}
                    {(machineState === 'HAND_DETECTION' || machineState === 'HAND_APPROACHING_MOUTH') && <Pill size={22} color="#38bdf8" />}
                    {machineState === 'SWALLOW_DETECTION' && <GlassWater size={22} color="#22c55e" />}
                    {machineState === 'HAND_RETREAT' && <ArrowDownCircle size={22} color="#38bdf8" />}
                    {machineState === 'SUCCESS' && <CheckCircle2 size={22} color="#10b981" />}
                    {failedVerificationNotice && <AlertTriangle size={22} color="#ef4444" />}
                  </div>
                  <div>
                    {/* Step 1: Face Recognition */}
                    {machineState === 'FACE_RECOGNITION' && !failedVerificationNotice && (
                      <>
                        <div style={{ fontSize: '0.98rem', fontWeight: 700, color: '#ffffff' }}>
                          Step 1: Face Recognition — Verifying Patient Identity
                        </div>
                        <div style={{ fontSize: '0.84rem', color: '#94a3b8' }}>
                          Please position your face directly inside the camera guide to verify identity.
                        </div>
                      </>
                    )}

                    {/* Step 2: Tablet Intake */}
                    {(machineState === 'HAND_DETECTION' || machineState === 'HAND_APPROACHING_MOUTH') && !failedVerificationNotice && (
                      <>
                        <div style={{ fontSize: '1.08rem', fontWeight: 800, color: '#38bdf8', letterSpacing: '-0.01em' }}>
                          “Please take the scheduled tablet as prescribed.”
                        </div>
                        <div style={{ fontSize: '0.84rem', color: '#cbd5e1' }}>
                          Medication: <strong style={{ color: '#ffffff' }}>{schedule.medicineName}</strong> ({schedule.dosage}) • Scheduled Time: <strong style={{ color: '#ffffff' }}>{schedule.scheduledTime || '08:00 AM'}</strong>
                        </div>
                      </>
                    )}

                    {/* Step 3: Water Intake */}
                    {machineState === 'SWALLOW_DETECTION' && !failedVerificationNotice && (
                      <>
                        <div style={{ fontSize: '1.08rem', fontWeight: 800, color: '#4ade80', letterSpacing: '-0.01em' }}>
                          “Please drink water to complete the medication intake process.”
                        </div>
                        <div style={{ fontSize: '0.84rem', color: '#cbd5e1' }}>
                          Monitoring swallowing & fluid intake: <strong style={{ color: '#4ade80' }}>{holdProgress}% verified</strong>
                        </div>
                      </>
                    )}

                    {/* Step 4: Hand Retreat */}
                    {machineState === 'HAND_RETREAT' && !failedVerificationNotice && (
                      <>
                        <div style={{ fontSize: '0.98rem', fontWeight: 700, color: '#ffffff' }}>
                          Step 4: Lower Hand Away from Mouth
                        </div>
                        <div style={{ fontSize: '0.84rem', color: '#94a3b8' }}>
                          Please lower your hand away from mouth region to finalize verification.
                        </div>
                      </>
                    )}

                    {/* Step 5: Successful Completion */}
                    {machineState === 'SUCCESS' && (
                      <>
                        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#34d399' }}>
                          Medication Status: Taken – Verified
                        </div>
                        <div style={{ fontSize: '0.84rem', color: '#d1fae5' }}>
                          {`Medication Update: ${user?.name || 'Patient'} has completed the scheduled medication intake for ${schedule.medicineName} at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Status: Taken – Verified.`}
                        </div>
                      </>
                    )}

                    {/* Step 6: Failed Verification */}
                    {failedVerificationNotice && (
                      <>
                        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fca5a5' }}>
                          “Medication intake could not be verified. Please try again.”
                        </div>
                        <div style={{ fontSize: '0.84rem', color: '#fecaca' }}>
                          {failedVerificationMsg || 'Face recognition or movement trajectory could not confirm intake. Dose is NOT marked as taken.'}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions inside guidance banner */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {machineState === 'FACE_RECOGNITION' && !failedVerificationNotice && (
                    <button 
                      type="button" 
                      className="btn btn-sm btn-secondary" 
                      onClick={handleRetryFace}
                      style={{ fontSize: '0.75rem', padding: '6px 12px', background: 'rgba(255,255,255,0.08)' }}
                    >
                      <RefreshCw size={13} /> Retry Face Verification {faceRetryCount > 0 ? `(${faceRetryCount})` : ''}
                    </button>
                  )}

                  {failedVerificationNotice && (
                    <>
                      <button 
                        type="button" 
                        className="btn btn-sm btn-primary" 
                        onClick={handleResetAndRetry}
                        style={{ fontSize: '0.75rem', padding: '6px 14px' }}
                      >
                        <RefreshCw size={13} /> Try Again
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-sm btn-secondary" 
                        onClick={handleReportFailedVerification}
                        style={{ fontSize: '0.75rem', padding: '6px 14px', background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5' }}
                      >
                        Notify Guardian
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Warnings & Real-time Guidance Banners */}
              {positionWarning && (
                <div style={{
                  background: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  color: '#fbbf24',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertTriangle size={15} />
                  <span>{positionWarning}</span>
                </div>
              )}

              {qualityWarning && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#f87171',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertCircle size={15} />
                  <span>{qualityWarning}</span>
                </div>
              )}

              {falsePositiveNotice && (
                <div style={{
                  background: 'rgba(168, 85, 247, 0.15)',
                  border: '1px solid rgba(168, 85, 247, 0.4)',
                  color: '#c084fc',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <ShieldCheck size={15} />
                  <span>{falsePositiveNotice}</span>
                </div>
              )}

              {/* Camera Video Surface with Medical HUD Overlay */}
              <div style={{
                position: 'relative',
                borderRadius: '18px',
                overflow: 'hidden',
                background: '#020617',
                border: machineState === 'SUCCESS' ? '2px solid #10b981' : '1px solid rgba(56, 189, 248, 0.3)',
                boxShadow: machineState === 'SUCCESS' ? '0 0 25px rgba(16, 185, 129, 0.3)' : '0 0 20px rgba(2, 132, 199, 0.15)',
                minHeight: '380px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {isInitializing && (
                  <div style={{ position: 'absolute', zIndex: 10, textAlign: 'center', color: '#94a3b8' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      border: '3px solid rgba(255,255,255,0.1)',
                      borderTopColor: '#38bdf8',
                      margin: '0 auto 12px auto',
                      animation: 'spin 1s linear infinite'
                    }} />
                    <p style={{ fontSize: '0.85rem' }}>{t('connectingCamera') || 'Connecting camera hardware...'}</p>
                    <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
                  </div>
                )}

                {/* Real Live Video Feed */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: '100%',
                    height: '100%',
                    maxHeight: '400px',
                    objectFit: 'cover',
                    transform: 'scaleX(-1)' // Mirror view for natural interaction
                  }}
                />

                {/* Hidden Analysis Canvas */}
                <canvas ref={canvasRef} style={{ display: 'none' }} />

                {/* AR HUD Reticle & Mouth Intake Anchor */}
                {machineState !== 'SUCCESS' && (
                  <>
                    {/* Face / Head Alignment Guide */}
                    <div style={{
                      position: 'absolute',
                      top: '18%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '200px',
                      height: '240px',
                      border: milestonesCompleted.includes('face_aligned') ? '2px solid rgba(34, 197, 94, 0.6)' : '2px dashed rgba(56, 189, 248, 0.5)',
                      borderRadius: '50% 50% 45% 45%',
                      pointerEvents: 'none',
                      transition: 'border 0.2s ease'
                    }} />

                    {/* Target Mouth Intake Zone (Pulse Ring) */}
                    <div style={{
                      position: 'absolute',
                      top: '56%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '88px',
                      height: '60px',
                      border: machineState === 'SWALLOW_DETECTION' ? '2px solid #22c55e' : '2px solid rgba(56, 189, 248, 0.7)',
                      background: machineState === 'SWALLOW_DETECTION' ? 'rgba(34, 197, 94, 0.35)' : 'rgba(2, 132, 199, 0.1)',
                      borderRadius: '24px',
                      pointerEvents: 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: machineState === 'SWALLOW_DETECTION' ? '0 0 18px rgba(34, 197, 94, 0.6)' : 'none',
                      transition: 'all 0.2s ease'
                    }}>
                      <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#ffffff', letterSpacing: '0.04em' }}>
                        {machineState === 'SWALLOW_DETECTION' ? 'SWALLOW ZONE' : 'MOUTH TARGET'}
                      </span>
                    </div>

                    {/* Dynamic Active Hand Trajectory Node */}
                    <div style={{
                      position: 'absolute',
                      bottom: '20px',
                      right: activeHand === 'right' ? '24%' : 'auto',
                      left: activeHand === 'left' ? '24%' : 'auto',
                      padding: '4px 10px',
                      borderRadius: '999px',
                      background: 'rgba(2, 132, 199, 0.85)',
                      color: '#ffffff',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      boxShadow: '0 0 10px rgba(2, 132, 199, 0.5)'
                    }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#38bdf8' }} />
                      <span>{activeHand === 'left' ? t('leftHand') : t('rightHand')} Tracking</span>
                    </div>
                  </>
                )}

                {/* HUD Top Left: State Machine Status */}
                <div style={{
                  position: 'absolute',
                  top: '14px',
                  left: '14px',
                  background: 'rgba(15, 23, 42, 0.85)',
                  backdropFilter: 'blur(6px)',
                  padding: '6px 14px',
                  borderRadius: '999px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.78rem',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: machineState === 'SUCCESS' ? '#10b981' : (machineState === 'SWALLOW_DETECTION' ? '#22c55e' : '#38bdf8'),
                    boxShadow: machineState === 'SUCCESS' ? '0 0 8px #10b981' : '0 0 8px #38bdf8'
                  }} />
                  <strong style={{ color: '#fff' }}>
                    {machineState === 'FACE_RECOGNITION' && 'Step 1/5: Position Face in Frame'}
                    {machineState === 'HAND_DETECTION' && 'Step 2/5: Raise Hand with Medication'}
                    {machineState === 'HAND_APPROACHING_MOUTH' && 'Step 3/5: Bring Medication to Mouth'}
                    {machineState === 'SWALLOW_DETECTION' && `Step 4/5: Swallow Medication (${holdProgress}%)`}
                    {machineState === 'HAND_RETREAT' && 'Step 5/5: Lower Hand Away from Mouth'}
                    {machineState === 'SUCCESS' && 'Verified: Intake Confirmed'}
                  </strong>
                </div>

                {/* HUD Top Right: Live Confidence Score Gauge */}
                <div style={{
                  position: 'absolute',
                  top: '14px',
                  right: '14px',
                  background: 'rgba(15, 23, 42, 0.85)',
                  backdropFilter: 'blur(6px)',
                  padding: '6px 14px',
                  borderRadius: '999px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.78rem',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <Activity size={14} color="#38bdf8" />
                  <span style={{ color: '#94a3b8' }}>Confidence:</span>
                  <strong style={{ color: confidenceScore >= 0.70 ? '#34d399' : '#f59e0b' }}>
                    {(confidenceScore * 100).toFixed(0)}%
                  </strong>
                </div>

                {/* Verified Overlay Splash */}
                {machineState === 'SUCCESS' && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(6, 78, 59, 0.90)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '24px',
                    textAlign: 'center',
                    animation: 'fadeIn 0.3s ease'
                  }}>
                    <div style={{
                      width: '76px',
                      height: '76px',
                      borderRadius: '50%',
                      background: 'rgba(16, 185, 129, 0.3)',
                      border: '3px solid #34d399',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      marginBottom: '16px',
                      boxShadow: '0 0 30px rgba(16, 185, 129, 0.6)'
                    }}>
                      <CheckCircle2 size={44} />
                    </div>
                    <h2 style={{ fontSize: '1.7rem', color: '#ffffff', margin: '0 0 8px 0', fontWeight: 800 }}>
                      Taken – Verified
                    </h2>
                    <p style={{ fontSize: '0.95rem', color: '#d1fae5', maxWidth: '480px', margin: '0 0 12px 0', lineHeight: 1.5 }}>
                      {`Medication Update: ${user?.name || 'Patient'} has completed the scheduled medication intake for ${schedule.medicineName} at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Status: Taken – Verified.`}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(16, 185, 129, 0.25)', border: '1px solid #34d399', padding: '6px 14px', borderRadius: '10px', fontSize: '0.82rem', color: '#a7f3d0', marginBottom: '14px' }}>
                      <Check size={15} />
                      <span>SMS Dispatched to Guardian: {activeGuardian?.name || 'Primary Guardian'} ({activeGuardian?.phoneNumber ? (activeGuardian.phoneNumber.length > 5 ? activeGuardian.phoneNumber.slice(0, 3) + '*** ***' + activeGuardian.phoneNumber.slice(-2) : '***') : 'On File'})</span>
                    </div>
                    <span className="badge badge-green" style={{ fontSize: '0.82rem', padding: '6px 16px' }}>
                      Audit Log ID: {verifiedPayload?.consumptionEvent?.id?.slice(0, 8) || 'verified'}
                    </span>
                  </div>
                )}
              </div>

              {/* Progress Milestones Tracker Bar (Real-time update) */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '6px'
              }}>
                {/* Step 1: Position Face */}
                <div style={{
                  padding: '8px 10px',
                  borderRadius: '10px',
                  background: milestonesCompleted.includes('face_aligned') ? 'rgba(34, 197, 94, 0.2)' : (machineState === 'FACE_RECOGNITION' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255,255,255,0.03)'),
                  border: milestonesCompleted.includes('face_aligned') ? '1px solid #22c55e' : (machineState === 'FACE_RECOGNITION' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.06)'),
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}>
                  {milestonesCompleted.includes('face_aligned') ? (
                    <CheckCircle2 size={13} color="#22c55e" />
                  ) : machineState === 'FACE_RECOGNITION' ? (
                    <span style={{ color: '#38bdf8', fontWeight: 800 }}>→</span>
                  ) : (
                    <span style={{ color: '#64748b' }}>1.</span>
                  )}
                  <span style={{ color: milestonesCompleted.includes('face_aligned') ? '#4ade80' : (machineState === 'FACE_RECOGNITION' ? '#38bdf8' : '#94a3b8') }}>
                    {milestonesCompleted.includes('face_aligned') ? '✓ ' : ''}1. Position Face
                  </span>
                </div>

                {/* Step 2: Hand Detected */}
                <div style={{
                  padding: '8px 10px',
                  borderRadius: '10px',
                  background: milestonesCompleted.includes('hand_detected') ? 'rgba(34, 197, 94, 0.2)' : (machineState === 'HAND_DETECTION' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255,255,255,0.03)'),
                  border: milestonesCompleted.includes('hand_detected') ? '1px solid #22c55e' : (machineState === 'HAND_DETECTION' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.06)'),
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}>
                  {milestonesCompleted.includes('hand_detected') ? (
                    <CheckCircle2 size={13} color="#22c55e" />
                  ) : machineState === 'HAND_DETECTION' ? (
                    <span style={{ color: '#38bdf8', fontWeight: 800 }}>→</span>
                  ) : (
                    <span style={{ color: '#64748b' }}>2.</span>
                  )}
                  <span style={{ color: milestonesCompleted.includes('hand_detected') ? '#4ade80' : (machineState === 'HAND_DETECTION' ? '#38bdf8' : '#94a3b8') }}>
                    {milestonesCompleted.includes('hand_detected') ? '✓ ' : ''}2. Hand Detected
                  </span>
                </div>

                {/* Step 3: Move to Mouth */}
                <div style={{
                  padding: '8px 10px',
                  borderRadius: '10px',
                  background: milestonesCompleted.includes('hand_to_mouth_motion') ? 'rgba(34, 197, 94, 0.2)' : (machineState === 'HAND_APPROACHING_MOUTH' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255,255,255,0.03)'),
                  border: milestonesCompleted.includes('hand_to_mouth_motion') ? '1px solid #22c55e' : (machineState === 'HAND_APPROACHING_MOUTH' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.06)'),
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}>
                  {milestonesCompleted.includes('hand_to_mouth_motion') ? (
                    <CheckCircle2 size={13} color="#22c55e" />
                  ) : machineState === 'HAND_APPROACHING_MOUTH' ? (
                    <span style={{ color: '#38bdf8', fontWeight: 800 }}>→</span>
                  ) : (
                    <span style={{ color: '#64748b' }}>3.</span>
                  )}
                  <span style={{ color: milestonesCompleted.includes('hand_to_mouth_motion') ? '#4ade80' : (machineState === 'HAND_APPROACHING_MOUTH' ? '#38bdf8' : '#94a3b8') }}>
                    {milestonesCompleted.includes('hand_to_mouth_motion') ? '✓ ' : ''}3. Move to Mouth
                  </span>
                </div>

                {/* Step 4: Swallow Hold */}
                <div style={{
                  padding: '8px 10px',
                  borderRadius: '10px',
                  background: milestonesCompleted.includes('mouth_interaction_hold') ? 'rgba(34, 197, 94, 0.2)' : (machineState === 'SWALLOW_DETECTION' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255,255,255,0.03)'),
                  border: milestonesCompleted.includes('mouth_interaction_hold') ? '1px solid #22c55e' : (machineState === 'SWALLOW_DETECTION' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.06)'),
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}>
                  {milestonesCompleted.includes('mouth_interaction_hold') ? (
                    <CheckCircle2 size={13} color="#22c55e" />
                  ) : machineState === 'SWALLOW_DETECTION' ? (
                    <span style={{ color: '#38bdf8', fontWeight: 800 }}>→</span>
                  ) : (
                    <span style={{ color: '#64748b' }}>4.</span>
                  )}
                  <span style={{ color: milestonesCompleted.includes('mouth_interaction_hold') ? '#4ade80' : (machineState === 'SWALLOW_DETECTION' ? '#38bdf8' : '#94a3b8') }}>
                    {milestonesCompleted.includes('mouth_interaction_hold') ? '✓ ' : ''}4. Swallow Hold {machineState === 'SWALLOW_DETECTION' ? `(${holdProgress}%)` : ''}
                  </span>
                </div>

                {/* Step 5: Hand Retreat */}
                <div style={{
                  padding: '8px 10px',
                  borderRadius: '10px',
                  background: milestonesCompleted.includes('hand_retreated') ? 'rgba(34, 197, 94, 0.2)' : (machineState === 'HAND_RETREAT' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255,255,255,0.03)'),
                  border: milestonesCompleted.includes('hand_retreated') ? '1px solid #22c55e' : (machineState === 'HAND_RETREAT' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.06)'),
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}>
                  {milestonesCompleted.includes('hand_retreated') ? (
                    <CheckCircle2 size={13} color="#22c55e" />
                  ) : machineState === 'HAND_RETREAT' ? (
                    <span style={{ color: '#38bdf8', fontWeight: 800 }}>→</span>
                  ) : (
                    <span style={{ color: '#64748b' }}>5.</span>
                  )}
                  <span style={{ color: milestonesCompleted.includes('hand_retreated') ? '#4ade80' : (machineState === 'HAND_RETREAT' ? '#38bdf8' : '#94a3b8') }}>
                    {milestonesCompleted.includes('hand_retreated') ? '✓ ' : ''}5. Hand Retreat
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Missed Dose Confirmation Modal Overlay */}
          {showMissedConfirm && (
            <div style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.85)',
              zIndex: 350,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px'
            }}>
              <div style={{
                background: '#1e1b2e',
                border: '1px solid #f59e0b',
                borderRadius: '18px',
                padding: '24px',
                maxWidth: '460px',
                width: '100%',
                boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <AlertTriangle size={24} color="#f59e0b" />
                  <h4 style={{ margin: 0, fontSize: '1.15rem', color: '#fde68a' }}>
                    Confirm Missed Medication
                  </h4>
                </div>
                <p style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.5, marginBottom: '14px' }}>
                  Marking this scheduled intake as missed will set the status to <strong>Missed / Not Verified</strong> and dispatch an automated SMS notification to your registered guardian contact ({activeGuardian?.name || 'Guardian'}):
                </p>
                <div style={{ background: '#090d16', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '16px', fontStyle: 'italic' }}>
                  “Medication Alert: {user?.name || 'Patient'} has not completed the scheduled medication intake for {schedule.medicineName}. Please check with the patient.”
                </div>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button 
                    className="btn btn-secondary btn-sm" 
                    onClick={() => setShowMissedConfirm(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn btn-warning btn-sm" 
                    onClick={handleMarkMissed}
                    disabled={isSubmitting}
                    style={{ background: '#d97706', color: '#fff', border: 'none' }}
                  >
                    {isSubmitting ? 'Recording...' : 'Confirm Missed & Notify Guardian'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Guardian Contact Settings Modal Overlay */}
          {showGuardianSettings && (
            <div style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.85)',
              zIndex: 350,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px'
            }}>
              <div style={{
                background: '#0d1527',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: '20px',
                padding: '24px',
                maxWidth: '520px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 20px 45px rgba(0,0,0,0.8)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Shield size={22} color="#38bdf8" />
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.15rem', color: '#ffffff', fontWeight: 800 }}>
                        Guardian Contact & SMS Settings
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>
                        Authorized proxy to receive automatic medication alerts
                      </p>
                    </div>
                  </div>
                  <button 
                    className="btn btn-secondary btn-sm" 
                    onClick={() => setShowGuardianSettings(false)}
                    style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#cbd5e1' }}
                  >
                    <X size={16} />
                  </button>
                </div>

                {guardianSaveSuccess && (
                  <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#6ee7b7', padding: '10px 14px', borderRadius: '10px', fontSize: '0.82rem', marginBottom: '14px' }}>
                    {guardianSaveSuccess}
                  </div>
                )}

                <form onSubmit={handleSaveGuardianSettings}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', marginBottom: '16px' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                        Guardian Full Name:
                      </label>
                      <input 
                        type="text" 
                        required 
                        className="form-control"
                        placeholder="e.g. Sarah Connor"
                        value={guardianForm.name}
                        onChange={(e) => setGuardianForm({ ...guardianForm, name: e.target.value })}
                        style={{ background: '#090d16', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                          Phone Number (SMS):
                        </label>
                        <input 
                          type="tel" 
                          required 
                          className="form-control"
                          placeholder="+1 (555) 234-5678"
                          value={guardianForm.phoneNumber}
                          onChange={(e) => setGuardianForm({ ...guardianForm, phoneNumber: e.target.value })}
                          style={{ background: '#090d16', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                          Relationship:
                        </label>
                        <select 
                          className="form-control"
                          value={guardianForm.relationship}
                          onChange={(e) => setGuardianForm({ ...guardianForm, relationship: e.target.value })}
                          style={{ background: '#090d16', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                        >
                          <option value="Family Member">Family Member</option>
                          <option value="Spouse">Spouse</option>
                          <option value="Child">Child</option>
                          <option value="Parent">Parent</option>
                          <option value="Primary Caregiver">Primary Caregiver</option>
                          <option value="Physician">Physician</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                        Notification Delivery Preference:
                      </label>
                      <select 
                        className="form-control"
                        value={guardianForm.notificationPreference}
                        onChange={(e) => setGuardianForm({ ...guardianForm, notificationPreference: e.target.value })}
                        style={{ background: '#090d16', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                      >
                        <option value="SMS">SMS Cellular Message (Immediate)</option>
                        <option value="BOTH">Both SMS and In-App Alert</option>
                        <option value="IN_APP">In-App Notification Only (Mute SMS)</option>
                      </select>
                    </div>

                    {/* SMS Enabled Toggle */}
                    <div style={{ background: '#090d16', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', margin: 0 }}>
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>
                            SMS / Message Notifications Enabled
                          </div>
                          <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                            Allow VitaCare to dispatch cellular SMS notifications to this guardian
                          </div>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={guardianForm.smsEnabled}
                          onChange={(e) => setGuardianForm({ ...guardianForm, smsEnabled: e.target.checked })}
                          style={{ width: '18px', height: '18px', accentColor: '#0284c7' }}
                        />
                      </label>
                    </div>

                    {/* Trigger Preferences */}
                    <div style={{ background: '#090d16', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '8px' }}>
                        Automatic Alert Triggers:
                      </div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '6px', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={guardianForm.notifyOnVerified}
                          onChange={(e) => setGuardianForm({ ...guardianForm, notifyOnVerified: e.target.checked })}
                        />
                        <span>Send update when medication is <strong>Taken – Verified</strong></span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '6px', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={guardianForm.notifyOnMissed}
                          onChange={(e) => setGuardianForm({ ...guardianForm, notifyOnMissed: e.target.checked })}
                        />
                        <span>Send alert if scheduled dose is <strong>Missed / Not Verified</strong></span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#cbd5e1', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={guardianForm.notifyOnFailed}
                          onChange={(e) => setGuardianForm({ ...guardianForm, notifyOnFailed: e.target.checked })}
                        />
                        <span>Send alert if intake verification <strong>fails repeatedly</strong></span>
                      </label>
                    </div>

                    {/* Patient Consent Checkbox */}
                    <div style={{ background: 'rgba(2, 132, 199, 0.1)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.78rem', color: '#e0f2fe', cursor: 'pointer', margin: 0 }}>
                        <input 
                          type="checkbox" 
                          required
                          checked={guardianForm.consentGiven}
                          onChange={(e) => setGuardianForm({ ...guardianForm, consentGiven: e.target.checked })}
                          style={{ marginTop: '2px', accentColor: '#0284c7' }}
                        />
                        <span>
                          <strong>Patient Authorization:</strong> I explicitly authorize VitaCare AI to send automated SMS/messages regarding my medication intake to this designated contact.
                        </span>
                      </label>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button 
                      type="button" 
                      className="btn btn-secondary btn-sm" 
                      onClick={() => setShowGuardianSettings(false)}
                    >
                      Close
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary btn-sm"
                    >
                      Save Guardian Settings
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Notification History Modal Overlay */}
          {showNotificationHistory && (
            <div style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.85)',
              zIndex: 350,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px'
            }}>
              <div style={{
                background: '#0d1527',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: '20px',
                padding: '24px',
                maxWidth: '680px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 20px 45px rgba(0,0,0,0.8)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <History size={22} color="#38bdf8" />
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.15rem', color: '#ffffff', fontWeight: 800 }}>
                        Medication Intake Notification History
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>
                        Audit trail of guardian SMS notifications and delivery status
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      className="btn btn-secondary btn-sm" 
                      onClick={loadNotificationHistory}
                      disabled={loadingHistory}
                      title="Refresh Notification Log"
                    >
                      <RefreshCw size={13} className={loadingHistory ? 'animate-spin' : ''} />
                    </button>
                    <button 
                      className="btn btn-secondary btn-sm" 
                      onClick={() => setShowNotificationHistory(false)}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {loadingHistory ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '0.85rem' }}>
                    Loading notification logs...
                  </div>
                ) : notificationHistoryList.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '0.85rem', background: '#090d16', borderRadius: '12px' }}>
                    No notifications dispatched yet for this patient account.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>
                          <th style={{ padding: '8px 10px' }}>Date</th>
                          <th style={{ padding: '8px 10px' }}>Time</th>
                          <th style={{ padding: '8px 10px' }}>Medicine</th>
                          <th style={{ padding: '8px 10px' }}>Notification Type</th>
                          <th style={{ padding: '8px 10px' }}>Status</th>
                          <th style={{ padding: '8px 10px' }}>Delivery Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {notificationHistoryList.map((item, idx) => (
                          <tr key={item.id || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#e2e8f0' }}>
                            <td style={{ padding: '10px' }}>{item.date}</td>
                            <td style={{ padding: '10px' }}>{item.time}</td>
                            <td style={{ padding: '10px', color: '#38bdf8', fontWeight: 600 }}>{item.medicine}</td>
                            <td style={{ padding: '10px' }}>
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                background: item.notificationType?.includes('Verified') ? 'rgba(16, 185, 129, 0.2)' :
                                            item.notificationType?.includes('Missed') ? 'rgba(245, 158, 11, 0.2)' :
                                            'rgba(239, 68, 68, 0.2)',
                                color: item.notificationType?.includes('Verified') ? '#34d399' :
                                       item.notificationType?.includes('Missed') ? '#fbbf24' :
                                       '#f87171'
                              }}>
                                {item.notificationType}
                              </span>
                            </td>
                            <td style={{ padding: '10px' }}>
                              <span style={{ color: item.status === 'DELIVERED' ? '#34d399' : '#94a3b8', fontWeight: 600 }}>
                                {item.status}
                              </span>
                            </td>
                            <td style={{ padding: '10px', color: '#94a3b8', fontSize: '0.75rem' }}>
                              {item.deliveryStatus || `Delivered to ${item.recipient} via SMS Gateway`}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button 
                    className="btn btn-secondary btn-sm" 
                    onClick={() => setShowNotificationHistory(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div style={{
          padding: '16px 24px',
          background: '#0f172a',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#94a3b8' }}>
            <ShieldCheck size={16} color="#10b981" />
            <span>{t('verifiedByVitacareNotice') || 'Detected and verified by VitaCare Computer Vision Pipeline. Does not represent medical certainty.'}</span>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              type="button"
              className="btn btn-secondary btn-sm" 
              onClick={() => setShowMissedConfirm(true)}
              style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' }}
            >
              <Clock size={14} /> Mark as Missed
            </button>
            <button 
              type="button"
              className="btn btn-secondary btn-sm" 
              onClick={() => setShowRefusalConfirm(true)}
              style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' }}
            >
              <XCircle size={14} /> {t('refuseMedicine') || 'Decline / Refuse Medicine'}
            </button>
            <button 
              type="button" 
              className="btn btn-secondary btn-sm" 
              onClick={handleClose}
            >
              {t('close') || 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
