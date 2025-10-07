import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingIndicator } from '../../../src/components/UI/LoadingIndicator';

describe('LoadingIndicator', () => {
  it('should render with default props', () => {
    render(<LoadingIndicator />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('should display custom message', () => {
    render(<LoadingIndicator message="Processing image..." />);

    expect(screen.getByText('Processing image...')).toBeInTheDocument();
  });

  it('should display progress percentage', () => {
    render(<LoadingIndicator progress={45} />);

    expect(screen.getByText('45%')).toBeInTheDocument();
  });

  it('should update progress bar width', () => {
    const { container } = render(<LoadingIndicator progress={75} />);

    const progressBar = container.querySelector('.polydraw-loading-indicator__bar');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveStyle({ width: '75%' });
  });

  it('should handle 0% progress', () => {
    const { container } = render(<LoadingIndicator progress={0} />);

    const progressBar = container.querySelector('.polydraw-loading-indicator__bar');
    expect(progressBar).toHaveStyle({ width: '0%' });
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('should handle 100% progress', () => {
    const { container } = render(<LoadingIndicator progress={100} />);

    const progressBar = container.querySelector('.polydraw-loading-indicator__bar');
    expect(progressBar).toHaveStyle({ width: '100%' });
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('should cap progress at 100%', () => {
    const { container } = render(<LoadingIndicator progress={150} />);

    const progressBar = container.querySelector('.polydraw-loading-indicator__bar');
    expect(progressBar).toHaveStyle({ width: '100%' });
  });

  it('should handle negative progress as 0%', () => {
    const { container } = render(<LoadingIndicator progress={-10} />);

    const progressBar = container.querySelector('.polydraw-loading-indicator__bar');
    expect(progressBar).toHaveStyle({ width: '0%' });
  });

  it('should apply custom className', () => {
    const { container } = render(<LoadingIndicator className="custom-class" />);

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should render animated dots', () => {
    const { container } = render(<LoadingIndicator />);

    const dots = container.querySelectorAll('.polydraw-loading-indicator__dot');
    expect(dots).toHaveLength(3);
  });

  it('should display rounded percentage', () => {
    render(<LoadingIndicator progress={45.7} />);

    expect(screen.getByText('46%')).toBeInTheDocument();
  });

  it('should combine message and progress correctly', () => {
    render(
      <LoadingIndicator
        message="Uploading..."
        progress={33}
      />
    );

    expect(screen.getByText('Uploading...')).toBeInTheDocument();
    expect(screen.getByText('33%')).toBeInTheDocument();
  });

  it('should have accessible structure', () => {
    const { container } = render(<LoadingIndicator />);

    expect(container.querySelector('.polydraw-loading-indicator__track')).toBeInTheDocument();
    expect(container.querySelector('.polydraw-loading-indicator__bar')).toBeInTheDocument();
  });

  it('should render progress bar with transition', () => {
    const { container } = render(<LoadingIndicator progress={50} />);

    const progressBar = container.querySelector('.polydraw-loading-indicator__bar');
    expect(progressBar).toHaveClass('transition-all');
  });
});
