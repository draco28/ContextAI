/**
 * Accessibility tests for ChatWindow component
 *
 * Tests WCAG 2.1 AA compliance using axe-core.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChatWindow } from '../../src/index.js';
import { expectNoA11yViolations } from './axe-setup.js';

describe('ChatWindow Accessibility', () => {
  const mockOnSend = vi.fn();
  const mockMessages = [
    { id: '1', role: 'user' as const, content: 'Hello' },
    { id: '2', role: 'assistant' as const, content: 'Hi there!' },
  ];

  describe('axe-core validation', () => {
    it('has no violations in default state', async () => {
      const { container } = render(
        <ChatWindow messages={mockMessages} onSend={mockOnSend} />,
      );
      await expectNoA11yViolations(container);
    });

    it('has no violations with empty messages', async () => {
      const { container } = render(
        <ChatWindow messages={[]} onSend={mockOnSend} />,
      );
      await expectNoA11yViolations(container);
    });

    it('has no violations in loading state', async () => {
      const { container } = render(
        <ChatWindow messages={mockMessages} isLoading onSend={mockOnSend} />,
      );
      await expectNoA11yViolations(container);
    });

    it('has no violations in error state', async () => {
      const { container } = render(
        <ChatWindow
          messages={mockMessages}
          error={new Error('Connection failed')}
          onSend={mockOnSend}
        />,
      );
      await expectNoA11yViolations(container);
    });

    it('has no violations during streaming', async () => {
      const { container } = render(
        <ChatWindow
          messages={mockMessages}
          streamingContent="I'm thinking..."
          onSend={mockOnSend}
        />,
      );
      await expectNoA11yViolations(container);
    });
  });

  describe('ARIA attributes', () => {
    it('has correct aria-label on chat section', () => {
      render(<ChatWindow messages={mockMessages} onSend={mockOnSend} data-testid="chat" />);
      const section = screen.getByTestId('chat');
      expect(section.tagName).toBe('SECTION');
      expect(section).toHaveAttribute('aria-label', 'Chat conversation');
    });

    it('has aria-busy on chat section during loading', () => {
      render(<ChatWindow messages={mockMessages} isLoading onSend={mockOnSend} data-testid="chat" />);
      const section = screen.getByTestId('chat');
      expect(section).toHaveAttribute('aria-busy', 'true');
    });

    it('has aria-live=assertive on error display', () => {
      render(
        <ChatWindow
          messages={mockMessages}
          error={new Error('Test error')}
          onSend={mockOnSend}
        />,
      );
      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'assertive');
    });

    it('has role=status on loading indicator', () => {
      render(<ChatWindow messages={[]} isLoading onSend={mockOnSend} />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('keyboard navigation', () => {
    it('textarea is accessible with proper label', () => {
      render(<ChatWindow messages={[]} onSend={mockOnSend} />);
      const input = screen.getByRole('textbox', { name: 'Type your message' });
      expect(input).toBeInTheDocument();
    });

    it('send button has accessible label', () => {
      render(<ChatWindow messages={[]} onSend={mockOnSend} />);
      const button = screen.getByRole('button', { name: 'Send message' });
      expect(button).toHaveAttribute('aria-label', 'Send message');
    });

    it('disabled send button shows aria-disabled state', () => {
      render(<ChatWindow messages={[]} onSend={mockOnSend} />);
      const button = screen.getByRole('button', { name: 'Send message' });
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('message list accessibility', () => {
    it('renders messages in a log role', () => {
      render(<ChatWindow messages={mockMessages} onSend={mockOnSend} />);
      expect(screen.getByRole('log')).toBeInTheDocument();
    });

    it('has aria-live=polite on message list', () => {
      render(<ChatWindow messages={mockMessages} onSend={mockOnSend} />);
      const log = screen.getByRole('log');
      expect(log).toHaveAttribute('aria-live', 'polite');
    });

    it('has aria-busy during streaming', () => {
      render(
        <ChatWindow
          messages={mockMessages}
          streamingContent="Typing..."
          onSend={mockOnSend}
        />,
      );
      const log = screen.getByRole('log');
      expect(log).toHaveAttribute('aria-busy', 'true');
    });
  });
});
