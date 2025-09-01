import React from 'react';

/**
 * Props for the LoadingSkeleton component
 */
export interface SkeletonProps {
  type?: 'card' | 'table' | 'list' | 'text' | 'button' | 'avatar';
  count?: number;
  className?: string;
  height?: string;
  width?: string;
  rounded?: boolean;
}

/**
 * LoadingSkeleton component to display animated placeholders while content is loading.
 * Supports multiple types and counts.
 *
 * @param type - The type of skeleton to display (card, table, list, text, button, avatar)
 * @param count - Number of skeleton items to display
 * @param className - Additional CSS classes
 * @param height - Custom height for the skeleton
 * @param width - Custom width for the skeleton
 * @param rounded - Whether the skeleton should have rounded corners
 */
const LoadingSkeleton: React.FC<SkeletonProps> = ({
  type = 'card',
  count = 1,
  className = '',
  height,
  width,
  rounded = false,
}) => {
  const getSkeletonElement = () => {
    const baseClasses = 'animate-pulse bg-gray-200 dark:bg-gray-700';
    const roundedClass = rounded ? 'rounded-full' : 'rounded';

    switch (type) {
      case 'card':
        return (
          <div
            className={`${baseClasses} ${roundedClass} h-32 ${className}`}
            style={{ height, width }}
            aria-label='Loading content'
          />
        );
      case 'table':
        return (
          <div
            className={`${baseClasses} ${roundedClass} h-12 ${className}`}
            style={{ height, width }}
            aria-label='Loading table row'
          />
        );
      case 'list':
        return (
          <div
            className={`${baseClasses} ${roundedClass} h-16 ${className}`}
            style={{ height, width }}
            aria-label='Loading list item'
          />
        );
      case 'text':
        return (
          <div
            className={`${baseClasses} ${roundedClass} h-4 ${className}`}
            style={{ height, width }}
            aria-label='Loading text'
          />
        );
      case 'button':
        return (
          <div
            className={`${baseClasses} ${roundedClass} h-10 w-24 ${className}`}
            style={{ height, width }}
            aria-label='Loading button'
          />
        );
      case 'avatar':
        return (
          <div
            className={`${baseClasses} ${roundedClass} h-10 w-10 ${className}`}
            style={{ height, width }}
            aria-label='Loading avatar'
          />
        );
      default:
        return (
          <div
            className={`${baseClasses} ${roundedClass} h-32 ${className}`}
            style={{ height, width }}
            aria-label='Loading content'
          />
        );
    }
  };

  if (count > 1) {
    return (
      <div className='space-y-3' role='status' aria-label='Multiple loading items'>
        {Array.from({ length: count }, (_, index) => (
          <React.Fragment key={index}>{getSkeletonElement()}</React.Fragment>
        ))}
      </div>
    );
  }

  return (
    <div role='status' aria-label='Loading content'>
      {getSkeletonElement()}
    </div>
  );
};

/**
 * Pre-configured skeleton components for common use cases
 */
export const CardSkeleton: React.FC<{ count?: number; className?: string }> = ({
  count = 1,
  className = '',
}) => (
  <LoadingSkeleton type='card' count={count} className={className} aria-label='Loading cards' />
);

export const TableRowSkeleton: React.FC<{ count?: number; className?: string }> = ({
  count = 1,
  className = '',
}) => (
  <LoadingSkeleton
    type='table'
    count={count}
    className={className}
    aria-label='Loading table rows'
  />
);

export const ListItemSkeleton: React.FC<{ count?: number; className?: string }> = ({
  count = 1,
  className = '',
}) => (
  <LoadingSkeleton
    type='list'
    count={count}
    className={className}
    aria-label='Loading list items'
  />
);

export const TextSkeleton: React.FC<{ count?: number; className?: string }> = ({
  count = 1,
  className = '',
}) => <LoadingSkeleton type='text' count={count} className={className} aria-label='Loading text' />;

export const ButtonSkeleton: React.FC<{ count?: number; className?: string }> = ({
  count = 1,
  className = '',
}) => (
  <LoadingSkeleton type='button' count={count} className={className} aria-label='Loading buttons' />
);

export const AvatarSkeleton: React.FC<{ count?: number; className?: string }> = ({
  count = 1,
  className = '',
}) => (
  <LoadingSkeleton type='avatar' count={count} className={className} aria-label='Loading avatars' />
);

export default LoadingSkeleton;
