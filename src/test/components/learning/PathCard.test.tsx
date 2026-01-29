/**
 * Tests for PathCard Component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PathCard from '@/components/learning/PathCard';
import type { LearningPath } from '@/types';

describe('PathCard', () => {
  const mockSuggestedPath: LearningPath = {
    id: 'path-1',
    userId: 'user-123',
    name: 'Master React',
    description: 'Learn React from basics to advanced',
    status: 'suggested',
    milestones: [
      {
        id: 'm1',
        title: 'Learn JSX',
        description: 'Understand JSX syntax',
        requiredConcepts: ['jsx'],
        estimatedHours: 2,
        status: 'available',
        progress: 0,
      },
      {
        id: 'm2',
        title: 'Learn Hooks',
        description: 'Master React hooks',
        requiredConcepts: ['hooks'],
        estimatedHours: 4,
        status: 'locked',
        progress: 0,
      },
    ],
    estimatedHours: 20,
    progressPercentage: 0,
    createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 },
    updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 },
  };

  const mockActivePath: LearningPath = {
    ...mockSuggestedPath,
    id: 'path-2',
    status: 'active',
    progressPercentage: 45,
  };

  it('should render path information', () => {
    render(<PathCard path={mockSuggestedPath} />);

    expect(screen.getByText('Master React')).toBeDefined();
    expect(screen.getByText('Learn React from basics to advanced')).toBeDefined();
    expect(screen.getByText('Suggested')).toBeDefined();
    expect(screen.getByText('2 milestones')).toBeDefined();
    expect(screen.getByText(/20 hours/)).toBeDefined();
  });

  it('should show progress bar for active paths', () => {
    render(<PathCard path={mockActivePath} />);

    expect(screen.getByText('45%')).toBeDefined();
    expect(screen.getByText('In Progress')).toBeDefined();
  });

  it('should call onAccept when Start Path clicked', () => {
    const onAccept = vi.fn();
    render(<PathCard path={mockSuggestedPath} onAccept={onAccept} />);

    const startButton = screen.getByText('Start Path');
    fireEvent.click(startButton);

    expect(onAccept).toHaveBeenCalledWith('path-1');
  });

  it('should call onAbandon when Abandon Path clicked', () => {
    const onAbandon = vi.fn();
    render(<PathCard path={mockActivePath} onAbandon={onAbandon} />);

    const abandonButton = screen.getByText('Abandon Path');
    fireEvent.click(abandonButton);

    expect(onAbandon).toHaveBeenCalledWith('path-2');
  });

  it('should call onView when View Details clicked', () => {
    const onView = vi.fn();
    render(<PathCard path={mockSuggestedPath} onView={onView} />);

    const viewButton = screen.getByText('View Details');
    fireEvent.click(viewButton);

    expect(onView).toHaveBeenCalledWith('path-1');
  });

  it('should show completed status correctly', () => {
    const completedPath = { ...mockActivePath, status: 'completed' as const };
    render(<PathCard path={completedPath} />);

    expect(screen.getByText('Completed')).toBeDefined();
  });

  it('should calculate estimated days correctly', () => {
    render(<PathCard path={mockSuggestedPath} />);

    // 20 hours / 2 hours per day = 10 days
    expect(screen.getByText(/10 days/)).toBeDefined();
  });
});
