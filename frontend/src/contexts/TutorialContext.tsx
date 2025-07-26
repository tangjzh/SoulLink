import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface TutorialStep {
  id: string;
  title: string;
  content: string;
  target: string; // CSS选择器或元素ID
  position: 'top' | 'bottom' | 'left' | 'right';
  page: string; // 页面路径
}

interface TutorialContextType {
  isActive: boolean;
  currentStep: number;
  steps: TutorialStep[];
  showTutorial: boolean;
  startTutorial: () => void;
  startManualTutorial: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTutorial: () => void;
  setNeverShowAgain: () => void;
  setSteps: (steps: TutorialStep[]) => void;
  getCurrentStepForPage: (page: string) => TutorialStep | null;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (context === undefined) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
};

interface TutorialProviderProps {
  children: ReactNode;
}

export const TutorialProvider: React.FC<TutorialProviderProps> = ({ children }) => {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setStepsState] = useState<TutorialStep[]>([]);
  const [showTutorial, setShowTutorial] = useState(false);

  // 检查是否应该显示教程
  useEffect(() => {
    const neverShow = localStorage.getItem('tutorial_never_show');
    const fromLanding = sessionStorage.getItem('from_landing');
    
    if (!neverShow && fromLanding === 'true') {
      setShowTutorial(true);
      // 立即清除标记，避免刷新时重复显示
      sessionStorage.removeItem('from_landing');
    }
  }, []);

  const startTutorial = () => {
    setIsActive(true);
    setCurrentStep(0);
    setShowTutorial(false); // 关闭启动对话框
    sessionStorage.removeItem('from_landing'); // 清除标记
  };

  const startManualTutorial = () => {
    setIsActive(true);
    setCurrentStep(0);
    setShowTutorial(false);
    // 清除任何会阻止教程显示的标记
    sessionStorage.removeItem('from_landing');
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsActive(false);
      setCurrentStep(0);
      // 教程完成时确保清除标记
      sessionStorage.removeItem('from_landing');
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipTutorial = () => {
    setIsActive(false);
    setShowTutorial(false);
    setCurrentStep(0);
    // 确保清除标记
    sessionStorage.removeItem('from_landing');
  };

  const setNeverShowAgain = () => {
    localStorage.setItem('tutorial_never_show', 'true');
    setShowTutorial(false);
    setIsActive(false);
    setCurrentStep(0);
    // 确保清除标记
    sessionStorage.removeItem('from_landing');
  };

  const setSteps = (newSteps: TutorialStep[]) => {
    setStepsState(newSteps);
  };

  const getCurrentStepForPage = (page: string): TutorialStep | null => {
    if (!isActive || !steps.length) return null;
    
    const currentStepData = steps[currentStep];
    if (currentStepData && currentStepData.page === page) {
      return currentStepData;
    }
    return null;
  };

  const value = {
    isActive,
    currentStep,
    steps,
    showTutorial,
    startTutorial,
    startManualTutorial,
    nextStep,
    prevStep,
    skipTutorial,
    setNeverShowAgain,
    setSteps,
    getCurrentStepForPage,
  };

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  );
}; 