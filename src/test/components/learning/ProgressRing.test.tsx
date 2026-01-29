/**
 * Tests for ProgressRing Component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProgressRing from '@/components/learning/ProgressRing';

describe('ProgressRing', () => {
  it('should render with default props', () => {
    const { container } = render(<ProgressRing progress={50} />);

    expect(screen.getByText('50%')).toBeDefined();
    expect(screen.getByText('Progress')).toBeDefined();
    expect(container.querySelector('svg')).toBeDefined();
  });

  it('should respect custom size', () => {
    const { container } = render(<ProgressRing progress={75} size={200} />);

    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('200');
    expect(svg?.getAttribute('height')).toBe('200');
  });

  it('should show custom label', () => {
    render(<ProgressRing progress={30} label="Path Progress" />);

    expect(screen.getByText('Path Progress')).toBeDefined();
  });

  it('should hide label when showLabel is false', () => {
    render(<ProgressRing progress={60} showLabel={false} />);

    expect(screen.queryByText('Progress')).toBeNull();
  });

  it('should render correct progress percentage', () => {
    render(<ProgressRing progress={85} />);

    expect(screen.getByText('85%')).toBeDefined();
  });

  it('should handle 0% progress', () => {
    render(<ProgressRing progress={0} />);

    expect(screen.getByText('0%')).toBeDefined();
  });

  it('should handle 100% progress', () => {
    render(<ProgressRing progress={100} />);

    expect(screen.getByText('100%')).toBeDefined();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <ProgressRing progress={40} className="custom-class" />
    );

    const wrapper = container.firstChild;
    expect(wrapper?.className).toContain('custom-class');
  });

  it('should calculate stroke dashoffset correctly', () => {
    const { container } = render(<ProgressRing progress={25} size={120} strokeWidth={8} />);

    const progressCircle = container.querySelectorAll('circle')[1];
    const strokeDashoffset = progressCircle?.getAttribute('stroke-dashoffset');

    // With radius = (120-8)/2 = 56, circumference = 2*PI*56 = 351.86
    // At 25% progress, offset = 351.86 * 0.75 = 263.89
    expect(parseFloat(strokeDashoffset || '0')).toBeGreaterThan(200);
  });
});
