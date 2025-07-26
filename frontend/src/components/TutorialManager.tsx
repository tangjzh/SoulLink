import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTutorial } from '../contexts/TutorialContext';
import { tutorialSteps } from '../config/tutorialSteps';
import TutorialCard from './TutorialCard';
import TutorialStartDialog from './TutorialStartDialog';

const TutorialManager: React.FC = () => {
  const { 
    isActive, 
    currentStep, 
    steps, 
    showTutorial,
    setSteps, 
    getCurrentStepForPage,
    nextStep
  } = useTutorial();
  const location = useLocation();
  const navigate = useNavigate();

  // 初始化教程步骤
  useEffect(() => {
    if (steps.length === 0) {
      setSteps(tutorialSteps);
    }
  }, [steps.length, setSteps]);

  // 监听页面变化，自动导航到下一个教程页面
  useEffect(() => {
    if (!isActive || !steps.length) return;

    const currentStepData = steps[currentStep];
    if (!currentStepData) return;

    // 如果当前步骤不属于当前页面，导航到对应页面
    if (currentStepData.page !== location.pathname) {
      // 延迟导航，确保教程卡片有时间淡出
      const timer = setTimeout(() => {
        navigate(currentStepData.page);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [isActive, currentStep, steps, location.pathname, navigate]);



  // 检查当前页面是否需要显示教程步骤
  const currentStepForPage = getCurrentStepForPage(location.pathname);

  // 调试信息
  useEffect(() => {
    if (isActive) {
      console.log('Tutorial Debug:', {
        isActive,
        currentStep,
        stepsLength: steps.length,
        currentPage: location.pathname,
        currentStepData: steps[currentStep],
        currentStepForPage
      });
    }
  }, [isActive, currentStep, steps, location.pathname, currentStepForPage]);

  // 如果教程激活且有当前步骤，显示教程卡片
  if (isActive && currentStepForPage && steps.length > 0) {
    // 计算步骤信息
    const isFirst = currentStep === 0;
    const isLast = currentStep === steps.length - 1;
    const stepNumber = currentStep + 1;
    const totalSteps = steps.length;

    console.log('Tutorial: Rendering card for step', stepNumber, 'on page', location.pathname);

    return (
      <TutorialCard
        target={currentStepForPage.target}
        title={currentStepForPage.title}
        content={currentStepForPage.content}
        position={currentStepForPage.position}
        isFirst={isFirst}
        isLast={isLast}
        stepNumber={stepNumber}
        totalSteps={totalSteps}
      />
    );
  }

  // 只有当showTutorial为true时才显示启动对话框（从Landing页面进入时）
  if (showTutorial) {
    return <TutorialStartDialog />;
  }

  // 否则什么都不显示
  return null;
};

export default TutorialManager; 