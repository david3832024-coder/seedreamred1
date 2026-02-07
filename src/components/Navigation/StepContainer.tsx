import React from 'react';
import type { ReactNode } from 'react';
import { Card, Button } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { useStepStore } from '../../stores/useStepStore';

interface StepContainerProps {
  children: ReactNode;
  title?: ReactNode;
  showNavigation?: boolean;
  onNext?: () => void;
  onPrev?: () => void;
  nextText?: string;
  prevText?: string;
  nextDisabled?: boolean;
  loading?: boolean;
}

export const StepContainer: React.FC<StepContainerProps> = ({
  children,
  title,
  showNavigation = true,
  onNext,
  onPrev,
  nextText = '下一步',
  prevText = '上一步',
  nextDisabled = false,
  loading = false,
}) => {
  const { currentStep, nextStep, prevStep, canGoBack } = useStepStore();
  
  const handleNext = () => {
    // 发送 GA 自定义事件
    if (typeof window !== 'undefined' && window.gtag) {
      const stepInfo = useStepStore.getState().steps.find(s => s.number === currentStep);
      window.gtag('event', 'step_next_click', {
        step_number: currentStep,
        step_title: stepInfo?.title || `步骤${currentStep}`,
        next_step: currentStep + 1,
      });
    }
    
    if (onNext) {
      onNext();
    } else {
      nextStep();
    }
  };
  
  const handlePrev = () => {
    if (onPrev) {
      onPrev();
    } else {
      prevStep();
    }
  };
  
  return (
    <div className="flex-1 p-6 bg-gray-50">
      <div className="max-w-6xl mx-auto animate-fadeIn">
        <Card 
          className="shadow-sm hover:shadow-md transition-shadow duration-300"
          title={title}
          loading={loading}
        >
          <div className="min-h-[400px] animate-slideUp">
            {children}
          </div>
          
          {showNavigation && (
            <div className="mt-6 pt-4 border-t flex justify-between">
              <div>
                {canGoBack && (
                  <Button
                    icon={<LeftOutlined />}
                    onClick={handlePrev}
                    size="large"
                  >
                    {prevText}
                  </Button>
                )}
              </div>
              
              <div>
                {currentStep < 4 && (
                  <Button
                    type="primary"
                    icon={<RightOutlined />}
                    iconPosition="end"
                    onClick={handleNext}
                    disabled={nextDisabled}
                    size="large"
                  >
                    {nextText}
                  </Button>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};