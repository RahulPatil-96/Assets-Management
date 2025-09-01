import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * Props for the ErrorBoundary component
 */
interface ErrorBoundaryProps {
  /** The children components to render */
  children: ReactNode;
  /** Custom fallback UI component */
  fallback?: ReactNode;
  /** Function called when an error occurs */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

/**
 * State for the ErrorBoundary component
 */
interface ErrorBoundaryState {
  /** The error that was caught */
  hasError: boolean;
  /** The error information */
  error?: Error;
  /** The error info */
  errorInfo?: ErrorInfo;
}

/**
 * ErrorBoundary component to catch JavaScript errors anywhere in the component tree
 * and display a fallback UI instead of the component tree that crashed.
 *
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  /**
   * Initializes the ErrorBoundary component state
   */
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
    };
  }

  /**
   * Catches errors thrown in child components
   * @param error - The error that was thrown
   * @param errorInfo - Additional error information
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  /**
   * Logs error information and calls the onError callback if provided
   * @param error - The error that was thrown
   * @param errorInfo - Additional error information
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // console.error('Error caught by ErrorBoundary:', error, errorInfo);

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  /**
   * Handles the retry action to reset the error state
   */
  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
    });
  };

  /**
   * Renders the component
   * @returns The rendered component
   */
  render(): ReactNode {
    if (this.state.hasError) {
      // Render custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className='min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4'>
          <div className='bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-md w-full'>
            <div className='text-center'>
              <AlertTriangle className='w-12 h-12 text-red-500 mx-auto mb-4' />
              <h2 className='text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2'>
                Something went wrong
              </h2>
              <p className='text-gray-600 dark:text-gray-400 mb-6'>
                We encountered an unexpected error. Please try refreshing the page.
              </p>
              {this.state.error && (
                <details className='mb-4 text-left'>
                  <summary className='cursor-pointer text-sm text-gray-500 dark:text-gray-400'>
                    Error details
                  </summary>
                  <pre className='mt-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded overflow-auto'>
                    {this.state.error.toString()}
                  </pre>
                </details>
              )}
              <button
                onClick={this.handleRetry}
                className='inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200'
              >
                <RefreshCw className='w-4 h-4 mr-2' />
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
