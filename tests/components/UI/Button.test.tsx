import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen, userEvent } from '../../setup/test-utils';
import { Button } from '../../../src/components/UI/Button';

describe('Button Component', () => {
  describe('Rendering', () => {
    it('should render button with text content', () => {
      renderWithProviders(<Button>Click me</Button>);
      expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('should render button with icon', () => {
      const icon = <span data-testid="test-icon">🔥</span>;
      renderWithProviders(<Button icon={icon}>With Icon</Button>);
      
      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
      expect(screen.getByText('With Icon')).toBeInTheDocument();
    });

    it('should apply correct variant classes', () => {
      const { rerender } = renderWithProviders(<Button variant="primary">Primary</Button>);
      let button = screen.getByTestId('polydraw-button');
      expect(button).toHaveAttribute('data-variant', 'primary');

      rerender(<Button variant="secondary">Secondary</Button>);
      button = screen.getByTestId('polydraw-button');
      expect(button).toHaveAttribute('data-variant', 'secondary');

      rerender(<Button variant="danger">Danger</Button>);
      button = screen.getByTestId('polydraw-button');
      expect(button).toHaveAttribute('data-variant', 'danger');
    });

    it('should apply correct size classes', () => {
      const { rerender } = renderWithProviders(<Button size="sm">Small</Button>);
      let button = screen.getByTestId('polydraw-button');
      expect(button).toHaveAttribute('data-size', 'sm');

      rerender(<Button size="md">Medium</Button>);
      button = screen.getByTestId('polydraw-button');
      expect(button).toHaveAttribute('data-size', 'md');

      rerender(<Button size="lg">Large</Button>);
      button = screen.getByTestId('polydraw-button');
      expect(button).toHaveAttribute('data-size', 'lg');
    });

    it('should apply custom className', () => {
      renderWithProviders(<Button className="custom-class">Custom</Button>);
      const button = screen.getByTestId('polydraw-button');
      expect(button).toHaveClass('custom-class');
    });
  });

  describe('Interactions', () => {
    it('should call onClick handler when clicked', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      renderWithProviders(<Button onClick={handleClick}>Click</Button>);
      const button = screen.getByTestId('polydraw-button');
      
      await user.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when disabled', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      renderWithProviders(<Button onClick={handleClick} disabled>Disabled</Button>);
      const button = screen.getByTestId('polydraw-button');
      
      await user.click(button);
      expect(handleClick).not.toHaveBeenCalled();
      expect(button).toBeDisabled();
    });

    it('should handle keyboard events', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      renderWithProviders(<Button onClick={handleClick}>Keyboard</Button>);
      const button = screen.getByTestId('polydraw-button');
      
      button.focus();
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have correct role', () => {
      renderWithProviders(<Button>Accessible</Button>);
      const button = screen.getByRole('button', { name: 'Accessible' });
      expect(button).toBeInTheDocument();
    });

    it('should be accessible via test ID', () => {
      renderWithProviders(<Button>Tab Test</Button>);
      const button = screen.getByTestId('polydraw-button');
      expect(button).toBeInTheDocument();
      expect(button.tagName).toBe('BUTTON');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty children', () => {
      renderWithProviders(<Button />);
      const button = screen.getByTestId('polydraw-button');
      expect(button).toBeInTheDocument();
    });

    it('should handle icon-only button', () => {
      const icon = <span data-testid="icon-only">⚙️</span>;
      renderWithProviders(<Button icon={icon} />);
      
      expect(screen.getByTestId('icon-only')).toBeInTheDocument();
      expect(screen.getByTestId('polydraw-button')).toBeInTheDocument();
    });
  });
});

