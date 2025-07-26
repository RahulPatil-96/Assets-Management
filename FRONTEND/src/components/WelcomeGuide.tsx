import React, { useState } from 'react';
import { 
  X, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle, 
  Package, 
  Upload, 
  Search,
  Lightbulb} from 'lucide-react';

interface WelcomeGuideProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const guideSteps = [
  {
    id: 1,
    title: "Welcome to AssetFlow!",
    description: "Let's take a quick tour to help you get started with our document and asset management system.",
    icon: <Lightbulb className="w-8 h-8 text-yellow-500" />,
    action: "Start Tour"
  },
  {
    id: 2,
    title: "Upload Documents",
    description: "Drag and drop files or click to upload. Our AI will automatically process and categorize your documents.",
    icon: <Upload className="w-8 h-8 text-blue-500" />,
    action: "Try Upload"
  },
  {
    id: 3,
    title: "Manage Assets",
    description: "Track all your organization's assets with detailed information, maintenance schedules, and QR codes.",
    icon: <Package className="w-8 h-8 text-purple-500" />,
    action: "View Assets"
  },
  {
    id: 4,
    title: "Search Everything",
    description: "Use our powerful search to find documents and assets instantly. Try natural language queries!",
    icon: <Search className="w-8 h-8 text-green-500" />,
    action: "Try Search"
  },
  {
    id: 5,
    title: "You're All Set!",
    description: "You're ready to start managing your documents and assets efficiently. Need help? Check our help center anytime.",
    icon: <CheckCircle className="w-8 h-8 text-green-500" />,
    action: "Get Started"
  }
];

export const WelcomeGuide: React.FC<WelcomeGuideProps> = ({ isOpen, onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep < guideSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentGuideStep = guideSteps[currentStep];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        <div className="relative p-8 text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
          
          <div className="mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {currentGuideStep.icon}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{currentGuideStep.title}</h2>
            <p className="text-gray-600 leading-relaxed">{currentGuideStep.description}</p>
          </div>

          <div className="flex justify-center space-x-2 mb-6">
            {guideSteps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                currentStep === 0
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <button
              onClick={handleNext}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium"
            >
              <span>{currentGuideStep.action}</span>
              {currentStep < guideSteps.length - 1 ? (
                <ArrowRight className="w-4 h-4" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};