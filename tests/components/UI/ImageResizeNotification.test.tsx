import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImageResizeNotification } from '../../../src/components/UI/ImageResizeNotification';

describe('ImageResizeNotification', () => {
  const defaultProps = {
    originalWidth: 8000,
    originalHeight: 6000,
    newWidth: 4096,
    newHeight: 3072,
    onDismiss: vi.fn()
  };

  it('should render notification with correct title', () => {
    render(<ImageResizeNotification {...defaultProps} />);

    expect(screen.getByText('Image Automatically Resized')).toBeInTheDocument();
  });

  it('should display original dimensions', () => {
    render(<ImageResizeNotification {...defaultProps} />);

    expect(screen.getByText('8000 × 6000')).toBeInTheDocument();
  });

  it('should display new dimensions', () => {
    render(<ImageResizeNotification {...defaultProps} />);

    expect(screen.getByText('4096 × 3072')).toBeInTheDocument();
  });

  it('should show optimization message', () => {
    render(<ImageResizeNotification {...defaultProps} />);

    expect(screen.getByText(/Your image was resized to optimize performance/)).toBeInTheDocument();
  });

  it('should call onDismiss when dismiss button is clicked', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();

    render(<ImageResizeNotification {...defaultProps} onDismiss={onDismiss} />);

    const dismissButton = screen.getByRole('button', { name: /dismiss/i });
    await user.click(dismissButton);

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('should render with amber color scheme', () => {
    const { container } = render(<ImageResizeNotification {...defaultProps} />);

    expect(container.querySelector('.polydraw-resize-notification')).toBeInTheDocument();
    expect(container.querySelector('.polydraw-resize-notification')).toHaveClass('bg-amber-50');
    expect(container.querySelector('.polydraw-resize-notification')).toHaveClass('border-amber-200');
  });

  it('should display AlertCircle icon', () => {
    const { container } = render(<ImageResizeNotification {...defaultProps} />);

    const icon = container.querySelector('.polydraw-resize-notification__icon');
    expect(icon).toBeInTheDocument();
  });

  it('should have slide-in animation', () => {
    const { container } = render(<ImageResizeNotification {...defaultProps} />);

    expect(container.firstChild).toHaveClass('animate-slide-in');
  });

  it('should render dismiss button with X icon', () => {
    render(<ImageResizeNotification {...defaultProps} />);

    const dismissButton = screen.getByRole('button', { name: /dismiss/i });
    expect(dismissButton).toBeInTheDocument();
  });

  it('should handle small dimensions', () => {
    render(
      <ImageResizeNotification
        originalWidth={100}
        originalHeight={100}
        newWidth={50}
        newHeight={50}
        onDismiss={vi.fn()}
      />
    );

    expect(screen.getByText('100 × 100')).toBeInTheDocument();
    expect(screen.getByText('50 × 50')).toBeInTheDocument();
  });

  it('should handle large dimensions', () => {
    render(
      <ImageResizeNotification
        originalWidth={16384}
        originalHeight={16384}
        newWidth={4096}
        newHeight={4096}
        onDismiss={vi.fn()}
      />
    );

    expect(screen.getByText('16384 × 16384')).toBeInTheDocument();
    expect(screen.getByText('4096 × 4096')).toBeInTheDocument();
  });

  it('should display "Original:" label', () => {
    render(<ImageResizeNotification {...defaultProps} />);

    expect(screen.getByText('Original:')).toBeInTheDocument();
  });

  it('should display "Resized to:" label', () => {
    render(<ImageResizeNotification {...defaultProps} />);

    expect(screen.getByText('Resized to:')).toBeInTheDocument();
  });

  it('should have monospace font for dimensions', () => {
    const { container } = render(<ImageResizeNotification {...defaultProps} />);

    const monoContainer = container.querySelector('.polydraw-resize-notification__dimensions');
    expect(monoContainer).toBeInTheDocument();
  });

  it('should not call onDismiss on render', () => {
    const onDismiss = vi.fn();
    render(<ImageResizeNotification {...defaultProps} onDismiss={onDismiss} />);

    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('should have accessible dismiss button', () => {
    render(<ImageResizeNotification {...defaultProps} />);

    const dismissButton = screen.getByLabelText('Dismiss notification');
    expect(dismissButton).toBeInTheDocument();
  });

  it('should display dimensions with multiplication symbol', () => {
    render(<ImageResizeNotification {...defaultProps} />);

    const text = screen.getByText(/8000 × 6000/);
    expect(text).toBeInTheDocument();
    expect(text.textContent).toContain('×');
  });
});
