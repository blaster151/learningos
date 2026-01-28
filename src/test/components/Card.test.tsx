/**
 * Tests for Card Component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';

describe('Card Component', () => {
  describe('Card', () => {
    it('should render with children', () => {
      render(<Card>Card content</Card>);
      
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('should apply default variant with shadow-sm', () => {
      render(<Card data-testid="card">Content</Card>);
      
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('bg-white', 'shadow-sm', 'rounded-xl');
    });

    it('should apply elevated variant with shadow-lg', () => {
      render(<Card variant="elevated" data-testid="card">Content</Card>);
      
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('shadow-lg');
    });

    it('should apply outlined variant with border', () => {
      render(<Card variant="outlined" data-testid="card">Content</Card>);
      
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('border');
    });

    it('should accept custom className', () => {
      render(<Card className="custom-class" data-testid="card">Content</Card>);
      
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('custom-class');
    });
  });

  describe('CardHeader', () => {
    it('should render children', () => {
      render(
        <Card>
          <CardHeader>Header content</CardHeader>
        </Card>
      );
      
      expect(screen.getByText('Header content')).toBeInTheDocument();
    });

    it('should have margin bottom for spacing', () => {
      render(
        <Card>
          <CardHeader data-testid="header">Header</CardHeader>
        </Card>
      );
      
      const header = screen.getByTestId('header');
      expect(header).toHaveClass('mb-4');
    });
  });

  describe('CardTitle', () => {
    it('should render as h2 by default', () => {
      render(
        <Card>
          <CardTitle>Title</CardTitle>
        </Card>
      );
      
      const title = screen.getByRole('heading', { level: 2 });
      expect(title).toHaveTextContent('Title');
    });

    it('should render as custom element', () => {
      render(
        <Card>
          <CardTitle as="h3">Title</CardTitle>
        </Card>
      );
      
      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toHaveTextContent('Title');
    });
  });

  describe('CardDescription', () => {
    it('should render description text', () => {
      render(
        <Card>
          <CardDescription>This is a description</CardDescription>
        </Card>
      );
      
      expect(screen.getByText('This is a description')).toBeInTheDocument();
    });

    it('should have muted color text-gray-500', () => {
      render(
        <Card>
          <CardDescription data-testid="desc">Description</CardDescription>
        </Card>
      );
      
      const desc = screen.getByTestId('desc');
      expect(desc).toHaveClass('text-gray-500');
    });
  });

  describe('CardContent', () => {
    it('should render children', () => {
      render(
        <Card>
          <CardContent>Main content here</CardContent>
        </Card>
      );
      
      expect(screen.getByText('Main content here')).toBeInTheDocument();
    });

    it('should accept custom className', () => {
      render(
        <Card>
          <CardContent data-testid="content" className="custom-content">Content</CardContent>
        </Card>
      );
      
      const content = screen.getByTestId('content');
      expect(content).toHaveClass('custom-content');
    });
  });

  describe('CardFooter', () => {
    it('should render children', () => {
      render(
        <Card>
          <CardFooter>Footer content</CardFooter>
        </Card>
      );
      
      expect(screen.getByText('Footer content')).toBeInTheDocument();
    });

    it('should have flex layout with gap', () => {
      render(
        <Card>
          <CardFooter data-testid="footer">Footer</CardFooter>
        </Card>
      );
      
      const footer = screen.getByTestId('footer');
      expect(footer).toHaveClass('flex', 'items-center', 'gap-3');
    });
  });

  describe('Full Card Composition', () => {
    it('should render a complete card', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card description goes here</CardDescription>
          </CardHeader>
          <CardContent>
            <p>This is the main content of the card.</p>
          </CardContent>
          <CardFooter>
            <button>Action</button>
          </CardFooter>
        </Card>
      );
      
      expect(screen.getByText('Card Title')).toBeInTheDocument();
      expect(screen.getByText('Card description goes here')).toBeInTheDocument();
      expect(screen.getByText('This is the main content of the card.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
    });
  });
});
