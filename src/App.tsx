import { useCallback, useEffect, useRef, useState } from 'react';
import { Header } from '@/components/Header';
import { ScanSection } from '@/components/ScanSection';
import { AnalysisPanel } from '@/components/AnalysisPanel';
import { ResultsSection } from '@/components/ResultsSection';
import { RoutineSection } from '@/components/RoutineSection';
import { TrustSection } from '@/components/TrustSection';
import { Footer } from '@/components/Footer';
import { CropModal } from '@/components/CropModal';
import { analyzeSkin } from '@/services/skinAnalysis';
import type { AnalysisSubmission } from '@/services/skinAnalysis';
import type {
  AnalysisError,
  AnalysisProgress,
  AnalysisStatus,
  SkinAnalysisResult,
} from '@/types/analysis';
import { prepareImageForYouCam, ImagePrepError } from '@/lib/imagePrep';
import { checkDemoAvailability, loadDemoFixture, resetDemoCache } from '@/lib/demoFixture';

function App() {
  const [status, setStatus] = useState<AnalysisStatus>('idle');
  const [submission, setSubmission] = useState<AnalysisSubmission | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [progress, setProgress] = useState<AnalysisProgress | null>(null);
  const [error, setError] = useState<AnalysisError | null>(null);
  const [result, setResult] = useState<SkinAnalysisResult | null>(null);
  const [showCrop, setShowCrop] = useState(false);
  const [isDemo, setIsDemo] = useState(false);

  // Demo fixture availability
  const [demoAvailable, setDemoAvailable] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  // Original (unprepared) image data URL kept so the crop modal can work from
  // the full-resolution source rather than the downscaled preview.
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [originalFileName, setOriginalFileName] = useState<string | undefined>(undefined);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    void checkDemoAvailability().then(setDemoAvailable);
  }, []);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (originalImageUrl) URL.revokeObjectURL(originalImageUrl);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearPhotoState = useCallback(() => {
    setSubmission(null);
    setPreviewUrl(null);
    setUploadError(null);
    if (originalImageUrl) {
      URL.revokeObjectURL(originalImageUrl);
      setOriginalImageUrl(null);
    }
    setOriginalFileName(undefined);
  }, [originalImageUrl]);

  const handleFileSelected = useCallback(
    async (file: File | null, error: string | null) => {
      setUploadError(error);
      if (!file) return;
      setIsDemo(false);
      setOriginalImageUrl(URL.createObjectURL(file));
      setOriginalFileName(file.name);
      try {
        const prepared = await prepareImageForYouCam(file);
        const sub: AnalysisSubmission = {
          dataUrl: prepared.dataUrl,
          fileName: file.name,
          mimeType: 'image/jpeg',
          size: prepared.size,
        };
        setSubmission(sub);
        setPreviewUrl(prepared.dataUrl);
      } catch (e) {
        const message =
          e instanceof ImagePrepError
            ? e.message
            : 'Could not prepare the image for analysis. Please try another photo.';
        setUploadError(message);
        setSubmission(null);
        setPreviewUrl(null);
      }
    },
    [],
  );

  const handleClear = useCallback(() => {
    clearPhotoState();
  }, [clearPhotoState]);

  const runAnalysis = useCallback(async () => {
    if (!submission) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus('analyzing');
    setProgress({ fraction: 0.05, label: 'Preparing' });
    setError(null);
    setResult(null);
    setIsDemo(false);
    try {
      const res = await analyzeSkin(submission, setProgress, controller.signal);
      if (controller.signal.aborted) return;
      setResult(res);
      setStatus('succeeded');
    } catch (e) {
      if (controller.signal.aborted) return;
      const err: AnalysisError =
        e && typeof e === 'object' && 'message' in e
          ? (e as AnalysisError)
          : { message: 'Something went wrong during analysis.', retryable: true };
      setError(err);
      setStatus('failed');
    }
  }, [submission]);

  const handleAnalyze = useCallback(() => {
    void runAnalysis();
  }, [runAnalysis]);

  const handleCancel = useCallback(() => {
    abortRef.current?.abort();
    setStatus('idle');
    setProgress(null);
    setError(null);
  }, []);

  const handleRestart = useCallback(() => {
    abortRef.current?.abort();
    setStatus('idle');
    setResult(null);
    setError(null);
    setProgress(null);
    setIsDemo(false);
    clearPhotoState();
    resetDemoCache();
  }, [clearPhotoState]);

  const handleCropConfirm = useCallback(
    (newSubmission: AnalysisSubmission, newPreviewUrl: string) => {
      setShowCrop(false);
      setSubmission(newSubmission);
      setPreviewUrl(newPreviewUrl);
      setError(null);
      setStatus('idle');
      setIsDemo(false);
    },
    [],
  );

  const handleCropCancel = useCallback(() => {
    setShowCrop(false);
  }, []);

  const handleTryDemo = useCallback(async () => {
    setDemoLoading(true);
    setError(null);
    try {
      const fixture = await loadDemoFixture();
      // Clear any live-mode state to prevent mixing.
      clearPhotoState();
      setIsDemo(true);
      setResult(fixture.result);
      setPreviewUrl(fixture.portraitUrl);
      setStatus('succeeded');
    } catch (e) {
      setError({
        message:
          e instanceof Error
            ? e.message
            : 'The demo could not be loaded. Please try analyzing your own photo instead.',
        retryable: false,
      });
      setStatus('failed');
    } finally {
      setDemoLoading(false);
    }
  }, [clearPhotoState]);

  const handleNavigate = useCallback((id: string) => {
    if (id === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 76;
      window.scrollTo({ top, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const isAnalyzing = status === 'analyzing';
  const hasResults = status === 'succeeded' && result !== null;

  return (
    <div className="flex min-h-screen flex-col">
      <Header onNavigate={handleNavigate} />

      <main className="flex-1">
        {isAnalyzing || status === 'failed' ? (
          <AnalysisPanel
            progress={progress}
            error={error}
            previewUrl={previewUrl}
            onRetry={handleAnalyze}
            onCancel={handleCancel}
            onCrop={
              error?.errorCode === 'error_src_face_too_small' && originalImageUrl
                ? () => setShowCrop(true)
                : undefined
            }
          />
        ) : hasResults && result ? (
          <ResultsSection
            result={result}
            previewUrl={previewUrl}
            onRestart={handleRestart}
            isDemo={isDemo}
          />
        ) : (
          <ScanSection
            previewUrl={previewUrl}
            uploadError={uploadError}
            onFileSelected={handleFileSelected}
            onClear={handleClear}
            onDismissError={() => setUploadError(null)}
            onAnalyze={handleAnalyze}
            canAnalyze={!!submission && !uploadError}
            demoAvailable={demoAvailable}
            onTryDemo={handleTryDemo}
            demoLoading={demoLoading}
          />
        )}

        {!isAnalyzing && status !== 'failed' && (
          <>
            <RoutineSection hasResults={hasResults} result={result} />
            <TrustSection />
          </>
        )}
      </main>

      <Footer onNavigate={handleNavigate} />

      {showCrop && originalImageUrl && (
        <CropModal
          imageUrl={originalImageUrl}
          fileName={originalFileName}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  );
}

export default App;
