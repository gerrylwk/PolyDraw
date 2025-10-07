import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen, userEvent } from '../../setup/test-utils';
import { Input } from '../../../src/components/UI/Input';

describe('Input Component', () => {
  describe('Text Input', () => {
    it('should render text input', () => {
      renderWithProviders(<Input type="text" placeholder="Enter username" />);
      
      const input = screen.getByTestId('polydraw-input');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'text');
      expect(input).toHaveAttribute('placeholder', 'Enter username');
    });

    it('should handle text input changes', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();
      
      renderWithProviders(<Input type="text" onChange={handleChange} />);
      const input = screen.getByTestId('polydraw-input') as HTMLInputElement;
      
      await user.type(input, 'Hello');
      expect(input.value).toBe('Hello');
      expect(handleChange).toHaveBeenCalled();
    });

    it('should display placeholder', () => {
      renderWithProviders(<Input type="text" placeholder="Enter text..." />);
      const input = screen.getByTestId('polydraw-input');
      
      expect(input).toHaveAttribute('placeholder', 'Enter text...');
    });

    it('should apply custom className', () => {
      renderWithProviders(<Input type="text" className="custom-input" />);
      const input = screen.getByTestId('polydraw-input');
      
      expect(input).toHaveClass('custom-input');
    });
  });

  describe('Number Input', () => {
    it('should render number input', () => {
      renderWithProviders(<Input type="number" />);
      const input = screen.getByTestId('polydraw-input');
      
      expect(input).toHaveAttribute('type', 'number');
    });

    it('should handle min and max attributes', () => {
      renderWithProviders(<Input type="number" min={0} max={100} />);
      const input = screen.getByTestId('polydraw-input');
      
      expect(input).toHaveAttribute('min', '0');
      expect(input).toHaveAttribute('max', '100');
    });

    it('should handle step attribute', () => {
      renderWithProviders(<Input type="number" step={5} />);
      const input = screen.getByTestId('polydraw-input');
      
      expect(input).toHaveAttribute('step', '5');
    });

    it('should handle number value changes', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();
      
      renderWithProviders(<Input type="number" onChange={handleChange} />);
      const input = screen.getByTestId('polydraw-input') as HTMLInputElement;
      
      await user.clear(input);
      await user.type(input, '42');
      expect(input.value).toBe('42');
    });
  });

  describe('Checkbox Input', () => {
    it('should render checkbox with label', () => {
      renderWithProviders(<Input type="checkbox" label="Accept Terms" />);
      
      expect(screen.getByLabelText('Accept Terms')).toBeInTheDocument();
      expect(screen.getByTestId('polydraw-input')).toHaveAttribute('type', 'checkbox');
    });

    it('should handle checkbox toggle', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();
      
      renderWithProviders(<Input type="checkbox" onChange={handleChange} />);
      const checkbox = screen.getByTestId('polydraw-input') as HTMLInputElement;
      
      expect(checkbox.checked).toBe(false);
      
      await user.click(checkbox);
      expect(checkbox.checked).toBe(true);
      expect(handleChange).toHaveBeenCalled();
    });

    it('should render as toggle switch with label', () => {
      renderWithProviders(<Input type="checkbox" label="Enable Feature" />);
      
      expect(screen.getByTestId('polydraw-toggle-switch')).toBeInTheDocument();
      expect(screen.getByText('Enable Feature')).toBeInTheDocument();
    });
  });

  describe('Range Input', () => {
    it('should render range input', () => {
      renderWithProviders(<Input type="range" min={0} max={100} value={50} onChange={() => {}} />);
      const input = screen.getByTestId('polydraw-input');
      
      expect(input).toHaveAttribute('type', 'range');
      expect(input).toHaveAttribute('value', '50');
    });

    it('should have correct range attributes', () => {
      renderWithProviders(
        <Input type="range" min={0} max={100} step={5} value={50} onChange={() => {}} />
      );
      const range = screen.getByTestId('polydraw-input');
      
      expect(range).toHaveAttribute('min', '0');
      expect(range).toHaveAttribute('max', '100');
      expect(range).toHaveAttribute('step', '5');
    });
  });

  describe('Disabled State', () => {
    it('should disable text input', () => {
      renderWithProviders(<Input type="text" disabled />);
      const input = screen.getByTestId('polydraw-input');
      
      expect(input).toBeDisabled();
    });

    it('should disable checkbox', () => {
      renderWithProviders(<Input type="checkbox" disabled />);
      const checkbox = screen.getByTestId('polydraw-input');
      
      expect(checkbox).toBeDisabled();
    });

    it('should not trigger onChange when disabled', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();
      
      renderWithProviders(<Input type="text" disabled onChange={handleChange} />);
      const input = screen.getByTestId('polydraw-input');
      
      await user.type(input, 'test');
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have data-testid attribute', () => {
      renderWithProviders(<Input type="text" />);
      
      expect(screen.getByTestId('polydraw-input')).toBeInTheDocument();
    });

    it('should have data-input-type attribute', () => {
      renderWithProviders(<Input type="number" />);
      const input = screen.getByTestId('polydraw-input');
      
      expect(input).toHaveAttribute('data-input-type', 'number');
    });
  });

  describe('Controlled Input', () => {
    it('should work as controlled input', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();
      
      renderWithProviders(
        <Input
          type="text"
          value="test"
          onChange={handleChange}
        />
      );
      const input = screen.getByTestId('polydraw-input') as HTMLInputElement;
      
      expect(input.value).toBe('test');
      
      await user.clear(input);
      await user.type(input, 'new');
      expect(handleChange).toHaveBeenCalled();
    });
  });
});

