import React, { useCallback, useState } from 'react';
import { 
  Upload as UploadIcon, 
  FileText, 
  X, 
  CheckCircle, 
  AlertCircle,
  Zap,
  Brain,
  Search,
  QrCode,
  Clock,
  RefreshCw,
  Download,
  Eye,
  Share2
} from 'lucide-react';
import { useDocuments } from '../hooks/useDocuments';
import { useToast } from '../hooks/useToast';

interface UploadFile {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  ocrProgress: number;
  aiProgress: number;
  errorMessage?: string;
}

export const Upload: React.FC = () => {
  const { addDocument } = useDocuments();
  const { success, error, info, warning } = useToast();
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    const validTypes = [
      'application/pdf', 
      'image/jpeg', 
      'image/png', 
      'image/tiff',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    const maxSize = 50 * 1024 * 1024; // 50MB

    if (!validTypes.includes(file.type)) {
      return { valid: false, error: 'Unsupported file type' };
    }
    
    if (file.size > maxSize) {
      return { valid: false, error: 'File size exceeds 50MB limit' };
    }

    return { valid: true };
  };

  const handleFiles = (files: File[]) => {
    const validFiles: UploadFile[] = [];
    const invalidFiles: string[] = [];

    files.forEach(file => {
      const validation = validateFile(file);
      if (validation.valid) {
        validFiles.push({
          file,
          id: Date.now().toString() + Math.random(),
          progress: 0,
          status: 'pending',
          ocrProgress: 0,
          aiProgress: 0
        });
      } else {
        invalidFiles.push(`${file.name}: ${validation.error}`);
      }
    });

    if (invalidFiles.length > 0) {
      error('Invalid Files', `${invalidFiles.length} files were rejected: ${invalidFiles.join(', ')}`);
    }

    if (validFiles.length > 0) {
      setUploadFiles(prev => [...prev, ...validFiles]);
      info('Files Added', `${validFiles.length} files added to upload queue`);
      processFiles(validFiles);
    }
  };

  const processFiles = (filesToProcess: UploadFile[]) => {
    setIsProcessing(true);

    filesToProcess.forEach((uploadFile) => {
      // Upload phase
      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, status: 'uploading' } : f
      ));

      let progress = 0;
      const uploadInterval = setInterval(() => {
        progress += Math.random() * 25;
        if (progress >= 100) {
          progress = 100;
          clearInterval(uploadInterval);
          
          // Start OCR processing
          setUploadFiles(prev => prev.map(f => 
            f.id === uploadFile.id ? { ...f, progress: 100, status: 'processing' } : f
          ));

          // OCR Progress
          let ocrProgress = 0;
          const ocrInterval = setInterval(() => {
            ocrProgress += Math.random() * 20;
            if (ocrProgress >= 100) {
              ocrProgress = 100;
              clearInterval(ocrInterval);
              
              // AI Processing
              let aiProgress = 0;
              const aiInterval = setInterval(() => {
                aiProgress += Math.random() * 15;
                if (aiProgress >= 100) {
                  aiProgress = 100;
                  clearInterval(aiInterval);
                  
                  // Simulate occasional errors
                  const hasError = Math.random() < 0.1; // 10% chance of error
                  
                  if (hasError) {
                    setUploadFiles(prev => prev.map(f => 
                      f.id === uploadFile.id ? { 
                        ...f, 
                        status: 'error',
                        errorMessage: 'Processing failed - please try again'
                      } : f
                    ));
                    error('Processing Failed', `Failed to process ${uploadFile.file.name}`);
                  } else {
                    setUploadFiles(prev => prev.map(f => 
                      f.id === uploadFile.id ? { 
                        ...f, 
                        aiProgress: 100, 
                        status: 'completed' 
                      } : f
                    ));
                    
                    // Add to documents
                    addDocument(uploadFile.file);
                    success('Processing Complete', `${uploadFile.file.name} processed successfully`);
                  }
                } else {
                  setUploadFiles(prev => prev.map(f => 
                    f.id === uploadFile.id ? { ...f, aiProgress } : f
                  ));
                }
              }, 300);
            } else {
              setUploadFiles(prev => prev.map(f => 
                f.id === uploadFile.id ? { ...f, ocrProgress } : f
              ));
            }
          }, 200);
        } else {
          setUploadFiles(prev => prev.map(f => 
            f.id === uploadFile.id ? { ...f, progress } : f
          ));
        }
      }, 150);
    });

    // Set processing to false when all files are done
    setTimeout(() => {
      setIsProcessing(false);
    }, 8000);
  };

  const removeFile = (id: string) => {
    const file = uploadFiles.find(f => f.id === id);
    setUploadFiles(prev => prev.filter(f => f.id !== id));
    if (file) {
      info('File Removed', `${file.file.name} removed from queue`);
    }
  };

  const retryFile = (id: string) => {
    const file = uploadFiles.find(f => f.id === id);
    if (file) {
      const resetFile = {
        ...file,
        progress: 0,
        status: 'pending' as const,
        ocrProgress: 0,
        aiProgress: 0,
        errorMessage: undefined
      };
      setUploadFiles(prev => prev.map(f => f.id === id ? resetFile : f));
      processFiles([resetFile]);
      info('Retry Started', `Retrying ${file.file.name}`);
    }
  };

  const clearCompleted = () => {
    const completedCount = uploadFiles.filter(f => f.status === 'completed').length;
    setUploadFiles(prev => prev.filter(f => f.status !== 'completed'));
    success('Cleared', `${completedCount} completed files removed from queue`);
  };

  const clearAll = () => {
    const fileCount = uploadFiles.length;
    setUploadFiles([]);
    warning('Queue Cleared', `${fileCount} files removed from queue`);
  };

  const downloadFile = (uploadFile: UploadFile) => {
    // Simulate download
    success('Download Started', `Downloading ${uploadFile.file.name}`);
  };

  const viewFile = (uploadFile: UploadFile) => {
    info('View File', `Opening ${uploadFile.file.name}`);
  };

  const shareFile = (uploadFile: UploadFile) => {
    if (navigator.share) {
      navigator.share({
        title: uploadFile.file.name,
        text: `Document: ${uploadFile.file.name}`,
        url: window.location.href
      }).then(() => {
        success('Shared', 'File shared successfully');
      }).catch(() => {
        info('Share', 'Share cancelled');
      });
    } else {
      navigator.clipboard.writeText(uploadFile.file.name);
      success('Copied', 'File name copied to clipboard');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-gray-500" />;
      case 'uploading':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'processing':
        return <Brain className="w-4 h-4 text-purple-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const completedFiles = uploadFiles.filter(f => f.status === 'completed').length;
  const errorFiles = uploadFiles.filter(f => f.status === 'error').length;
  const processingFiles = uploadFiles.filter(f => f.status === 'uploading' || f.status === 'processing').length;

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Document Upload & Processing</h2>
        <p className="text-gray-600">Upload documents for AI-powered OCR extraction, classification, and automated processing</p>
      </div>

      {/* Upload Zone */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
          dragActive 
            ? 'border-blue-500 bg-blue-50 scale-105' 
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.tiff,.docx,.doc"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isProcessing}
          aria-label="Upload files"
        />
        
        <div className="space-y-6">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
            <UploadIcon className="w-10 h-10 text-white" />
          </div>
          
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              {isProcessing ? 'Processing files...' : 'Drop files here or click to upload'}
            </h3>
            <p className="text-gray-600 mt-2">
              Support for PDF, DOCX, JPEG, PNG, TIFF files up to 50MB each
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Batch processing up to 100 documents simultaneously
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="flex items-center justify-center space-x-2 p-3 bg-white rounded-lg border border-gray-200">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">OCR Processing</span>
            </div>
            <div className="flex items-center justify-center space-x-2 p-3 bg-white rounded-lg border border-gray-200">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">AI Classification</span>
            </div>
            <div className="flex items-center justify-center space-x-2 p-3 bg-white rounded-lg border border-gray-200">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">Auto-Summarization</span>
            </div>
            <div className="flex items-center justify-center space-x-2 p-3 bg-white rounded-lg border border-gray-200">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">QR Generation</span>
            </div>
          </div>
        </div>
      </div>

      {/* Processing Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Search className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">OCR Extraction</h3>
              <p className="text-sm text-gray-600">95%+ accuracy</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Advanced optical character recognition for both printed and handwritten text
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">AI Classification</h3>
              <p className="text-sm text-gray-600">Smart categorization</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Automatically classify documents and extract key metadata using machine learning
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Batch Processing</h3>
              <p className="text-sm text-gray-600">Up to 100 files</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Process multiple documents simultaneously with parallel processing capabilities
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <QrCode className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">QR Tracking</h3>
              <p className="text-sm text-gray-600">Unique identifiers</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Generate QR codes for physical document tracking and chain of custody
          </p>
        </div>
      </div>

      {/* Upload Queue */}
      {uploadFiles.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h3 className="text-lg font-semibold text-gray-900">Processing Queue</h3>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-600">{completedFiles} completed</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-600">{processingFiles} processing</span>
                  </span>
                  {errorFiles > 0 && (
                    <span className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-gray-600">{errorFiles} failed</span>
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {completedFiles > 0 && (
                  <button
                    onClick={clearCompleted}
                    className="px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  >
                    Clear Completed
                  </button>
                )}
                <button
                  onClick={clearAll}
                  className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
          
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {uploadFiles.map((uploadFile) => (
              <div key={uploadFile.id} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      {getStatusIcon(uploadFile.status)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{uploadFile.file.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(uploadFile.file.size)} • {uploadFile.file.type.split('/')[1].toUpperCase()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {uploadFile.status === 'completed' && (
                      <>
                        <button
                          onClick={() => viewFile(uploadFile)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                          aria-label={`View ${uploadFile.file.name}`}
                        >
                          <Eye className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => downloadFile(uploadFile)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                          aria-label={`Download ${uploadFile.file.name}`}
                        >
                          <Download className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => shareFile(uploadFile)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                          aria-label={`Share ${uploadFile.file.name}`}
                        >
                          <Share2 className="w-4 h-4 text-gray-600" />
                        </button>
                      </>
                    )}
                    {uploadFile.status === 'error' && (
                      <button
                        onClick={() => retryFile(uploadFile.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                        aria-label={`Retry ${uploadFile.file.name}`}
                      >
                        <RefreshCw className="w-4 h-4 text-blue-600" />
                      </button>
                    )}
                    <button
                      onClick={() => removeFile(uploadFile.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                      aria-label={`Remove ${uploadFile.file.name}`}
                    >
                      <X className="w-4 h-4 text-gray-400 hover:text-red-600" />
                    </button>
                  </div>
                </div>
                
                {uploadFile.status === 'uploading' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Uploading...</span>
                      <span className="font-medium">{Math.round(uploadFile.progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadFile.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {uploadFile.status === 'processing' && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 text-sm">
                      <Search className="w-4 h-4 text-blue-500" />
                      <span className="text-gray-600">OCR Text Extraction</span>
                      <span className="font-medium">{Math.round(uploadFile.ocrProgress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadFile.ocrProgress}%` }}
                      ></div>
                    </div>

                    <div className="flex items-center space-x-2 text-sm">
                      <Brain className="w-4 h-4 text-purple-500" />
                      <span className="text-gray-600">AI Classification & Analysis</span>
                      <span className="font-medium">{Math.round(uploadFile.aiProgress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadFile.aiProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                
                {uploadFile.status === 'completed' && (
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-2 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="font-medium">Processing Complete</span>
                    </div>
                    <div className="flex items-center space-x-2 text-blue-600">
                      <QrCode className="w-4 h-4" />
                      <span>QR Code Generated</span>
                    </div>
                    <div className="flex items-center space-x-2 text-purple-600">
                      <Brain className="w-4 h-4" />
                      <span>AI Analysis Complete</span>
                    </div>
                  </div>
                )}

                {uploadFile.status === 'error' && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span className="font-medium">{uploadFile.errorMessage || 'Processing failed'}</span>
                    </div>
                    <button
                      onClick={() => retryFile(uploadFile.id)}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors focus:outline-none focus:underline"
                    >
                      Retry
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Processing Statistics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Processing Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">1.9 min</p>
            <p className="text-sm text-gray-600">Avg Processing Time</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">97.2%</p>
            <p className="text-sm text-gray-600">OCR Accuracy</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Brain className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">94.8%</p>
            <p className="text-sm text-gray-600">Classification Accuracy</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Zap className="w-6 h-6 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">100</p>
            <p className="text-sm text-gray-600">Max Batch Size</p>
          </div>
        </div>
      </div>
    </div>
  );
};