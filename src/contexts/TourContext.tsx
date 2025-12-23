'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { OnboardingTour, useTourStatus, TourStep } from '@/components/Help/OnboardingTour';
import { pipelineBuilderTourSteps, formBuilderTourSteps } from '@/lib/tourContent';
import { useHelp } from '@/contexts/HelpContext';

type TourType = 'pipeline-builder' | 'form-builder';

interface TourContextValue {
  startTour: (tourType: TourType) => void;
  endTour: () => void;
  isTourActive: boolean;
  currentTourType: TourType | null;
  hasCompletedTour: (tourType: TourType) => boolean;
  resetTour: (tourType: TourType) => void;
}

const TourContext = createContext<TourContextValue | null>(null);

const tourStepsMap: Record<TourType, TourStep[]> = {
  'pipeline-builder': pipelineBuilderTourSteps,
  'form-builder': formBuilderTourSteps,
};

export function TourProvider({ children }: { children: ReactNode }) {
  const [isTourActive, setIsTourActive] = useState(false);
  const [currentTourType, setCurrentTourType] = useState<TourType | null>(null);
  const { setStartTourCallback } = useHelp();

  const pipelineTourStatus = useTourStatus('pipeline-builder');
  const formTourStatus = useTourStatus('form-builder');

  const startTour = useCallback((tourType: TourType) => {
    setCurrentTourType(tourType);
    setIsTourActive(true);
  }, []);

  // Register the start tour callback with HelpContext
  // Default to pipeline-builder tour when triggered from help search
  useEffect(() => {
    setStartTourCallback(() => startTour('pipeline-builder'));
    return () => setStartTourCallback(null);
  }, [setStartTourCallback, startTour]);

  const endTour = useCallback(() => {
    setIsTourActive(false);
    setCurrentTourType(null);
  }, []);

  const hasCompletedTour = useCallback((tourType: TourType) => {
    switch (tourType) {
      case 'pipeline-builder':
        return pipelineTourStatus.hasCompletedTour;
      case 'form-builder':
        return formTourStatus.hasCompletedTour;
      default:
        return true;
    }
  }, [pipelineTourStatus.hasCompletedTour, formTourStatus.hasCompletedTour]);

  const resetTour = useCallback((tourType: TourType) => {
    switch (tourType) {
      case 'pipeline-builder':
        pipelineTourStatus.resetTour();
        break;
      case 'form-builder':
        formTourStatus.resetTour();
        break;
    }
  }, [pipelineTourStatus, formTourStatus]);

  return (
    <TourContext.Provider
      value={{
        startTour,
        endTour,
        isTourActive,
        currentTourType,
        hasCompletedTour,
        resetTour,
      }}
    >
      {children}
      {currentTourType && (
        <OnboardingTour
          steps={tourStepsMap[currentTourType]}
          isOpen={isTourActive}
          onClose={endTour}
          onComplete={endTour}
          tourId={currentTourType}
        />
      )}
    </TourContext.Provider>
  );
}

export function useTour() {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
}
