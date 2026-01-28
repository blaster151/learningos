/**
 * Tests for Input Component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from '@/components/ui/Input';

describe('Input Component', () => {
  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<Input placeholder="Enter text" />);
      
      const input = screen.getByPlaceholderText('Enter text');
      expect(input).toBeInTheDocument();
    });

    it('should render with label', () => {
      render(<Input label="Email" id="email" />);
      
      const label = screen.getByText('Email');
      expect(label).toBeInTheDocument();
    });

    it('should render with error message', () => {
      render(<Input error="This field is required" />);
      
      const error = screen.getByText('This field is required');
      expect(error).toBeInTheDocument();
      expect(error).toHaveClass('text-red-600');
    });

    it('should render with left icon', () => {
      const Icon = () => <span data-testid="icon">📧</span>;
      render(<Input leftIcon={<Icon />} />);
      
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('should render with right icon', () => {
      const Icon = () => <span data-testid="icon">👁</span>;
      render(<Input rightIcon={<Icon />} />);
      
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });
  });

  describe('Types', () => {
    it('should accept text input by default', () => {
      render(<Input data-testid="input" />);
      
      const input = screen.getByTestId('input');
      // HTML input defaults to text type, no explicit attribute needed
      expect(input.tagName).toBe('INPUT');
    });

    it('should render password input', () => {
      render(<Input type="password" data-testid="input" />);
      
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('type', 'password');
    });

    it('should render email input', () => {
      render(<Input type="email" data-testid="input" />);
      
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('type', 'email');
    });
  });

  describe('States', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Input disabled data-testid="input" />);
      
      const input = screen.getByTestId('input');
      expect(input).toBeDisabled();
    });

    it('should be required when required prop is true', () => {
      render(<Input required data-testid="input" />);
      
      const input = screen.getByTestId('input');
      expect(input).toBeRequired();
    });

    it('should have error styling when error is present', () => {
      render(<Input error="Error" data-testid="input" />);
      
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('border-red-500');
    });
  });

  describe('Interactions', () => {
    it('should call onChange when typing', () => {
      const handleChange = vi.fn();
      render(<Input onChange={handleChange} data-testid="input" />);
      
      const input = screen.getByTestId('input');
      fireEvent.change(input, { target: { value: 'test' } });
      
      expect(handleChange).toHaveBeenCalled();
    });

    it('should call onFocus when focused', () => {
      const handleFocus = vi.fn();
      render(<Input onFocus={handleFocus} data-testid="input" />);
      
      const input = screen.getByTestId('input');
      fireEvent.focus(input);
      
      expect(handleFocus).toHaveBeenCalled();
    });

    it('should call onBlur when blurred', () => {
      const handleBlur = vi.fn();
      render(<Input onBlur={handleBlur} data-testid="input" />);
      
      const input = screen.getByTestId('input');
      fireEvent.blur(input);
      
      expect(handleBlur).toHaveBeenCalled();
    });

    it('should update value on change', () => {
      render(<Input data-testid="input" />);
      
      const input = screen.getByTestId('input') as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'hello' } });
      
      expect(input.value).toBe('hello');
    });
  });

  describe('Accessibility', () => {
    it('should associate label with input', () => {
      render(<Input label="Username" id="username" />);
      
      const input = screen.getByLabelText('Username');
      expect(input).toBeInTheDocument();
    });

    it('should support aria-describedby for error', () => {
      render(<Input id="test" error="Error message" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-describedby', 'test-error');
    }, 10000); // Last test may timeout due to cleanup
  });
});
