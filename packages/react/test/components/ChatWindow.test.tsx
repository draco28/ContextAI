import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ChatWindow, MessageList, MessageInput, type Message } from '../../src/index.js';

describe('ChatWindow', () => {
  const mockMessages: Message[] = [
    { id: '1', role: 'user', content: 'Hello' },
    { id: '2', role: 'assistant', content: 'Hi there!' },
  ];

  it('renders messages correctly', () => {
    render(<ChatWindow messages={mockMessages} onSend={vi.fn()} data-testid="chat" />);

    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
  });

  it('calls onSend when submitting via button', () => {
    const onSend = vi.fn();
    render(<ChatWindow messages={[]} onSend={onSend} data-testid="chat" />);

    const textarea = screen.getByTestId('chat-input-textarea');
    const button = screen.getByTestId('chat-input-button');

    fireEvent.change(textarea, { target: { value: 'New message' } });
    fireEvent.click(button);

    expect(onSend).toHaveBeenCalledWith('New message');
  });

  it('calls onSend when pressing Enter', () => {
    const onSend = vi.fn();
    render(<ChatWindow messages={[]} onSend={onSend} data-testid="chat" />);

    const textarea = screen.getByTestId('chat-input-textarea');

    fireEvent.change(textarea, { target: { value: 'Enter test' } });
    fireEvent.keyDown(textarea, { key: 'Enter' });

    expect(onSend).toHaveBeenCalledWith('Enter test');
  });

  it('does not submit on Shift+Enter', () => {
    const onSend = vi.fn();
    render(<ChatWindow messages={[]} onSend={onSend} data-testid="chat" />);

    const textarea = screen.getByTestId('chat-input-textarea');

    fireEvent.change(textarea, { target: { value: 'Multiline' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });

    expect(onSend).not.toHaveBeenCalled();
  });

  it('shows streaming content', () => {
    render(
      <ChatWindow
        messages={mockMessages}
        streamingContent="Typing..."
        onSend={vi.fn()}
        data-testid="chat"
      />
    );

    expect(screen.getByText('Typing...')).toBeInTheDocument();
    expect(screen.getByTestId('streaming-message')).toHaveAttribute('data-streaming', 'true');
  });

  it('shows loading state', () => {
    render(
      <ChatWindow messages={[]} isLoading={true} onSend={vi.fn()} data-testid="chat" />
    );

    expect(screen.getByTestId('chat-loading')).toBeInTheDocument();
  });

  it('hides loading when streaming', () => {
    render(
      <ChatWindow
        messages={[]}
        isLoading={true}
        streamingContent="Streaming..."
        onSend={vi.fn()}
        data-testid="chat"
      />
    );

    // Loading should be hidden when streaming content is present
    expect(screen.queryByTestId('chat-loading')).not.toBeInTheDocument();
    expect(screen.getByText('Streaming...')).toBeInTheDocument();
  });

  it('shows error state', () => {
    const error = new Error('Something went wrong');
    render(<ChatWindow messages={[]} error={error} onSend={vi.fn()} data-testid="chat" />);

    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
  });

  it('disables input when loading', () => {
    render(
      <ChatWindow messages={[]} isLoading={true} onSend={vi.fn()} data-testid="chat" />
    );

    expect(screen.getByTestId('chat-input-textarea')).toBeDisabled();
    expect(screen.getByTestId('chat-input-button')).toBeDisabled();
  });

  it('supports custom renderMessages', () => {
    render(
      <ChatWindow
        messages={mockMessages}
        onSend={vi.fn()}
        renderMessages={(props) => (
          <div data-testid="custom-messages">
            <MessageList {...props} />
          </div>
        )}
      />
    );

    expect(screen.getByTestId('custom-messages')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('supports custom renderInput', () => {
    const onSend = vi.fn();
    render(
      <ChatWindow
        messages={[]}
        onSend={onSend}
        renderInput={(props) => (
          <div data-testid="custom-input">
            <MessageInput {...props} placeholder="Custom placeholder" />
          </div>
        )}
      />
    );

    expect(screen.getByTestId('custom-input')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument();
  });

  it('supports children for fully custom layout', () => {
    render(
      <ChatWindow messages={mockMessages} onSend={vi.fn()} data-testid="chat">
        <header>Custom Header</header>
        <div>Custom Body</div>
      </ChatWindow>
    );

    expect(screen.getByText('Custom Header')).toBeInTheDocument();
    expect(screen.getByText('Custom Body')).toBeInTheDocument();
  });
});

describe('MessageList', () => {
  const mockMessages: Message[] = [
    { id: '1', role: 'user', content: 'Hello' },
    { id: '2', role: 'assistant', content: 'Hi!' },
    { id: '3', role: 'system', content: 'System message' },
  ];

  it('renders all messages', () => {
    render(<MessageList messages={mockMessages} />);

    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi!')).toBeInTheDocument();
    expect(screen.getByText('System message')).toBeInTheDocument();
  });

  it('applies data-role attribute', () => {
    render(<MessageList messages={mockMessages} />);

    expect(screen.getByTestId('message-0')).toHaveAttribute('data-role', 'user');
    expect(screen.getByTestId('message-1')).toHaveAttribute('data-role', 'assistant');
  });

  it('renders streaming content', () => {
    render(<MessageList messages={[]} streamingContent="Typing..." />);

    const streamingEl = screen.getByTestId('streaming-message');
    expect(streamingEl).toHaveAttribute('data-streaming', 'true');
    expect(screen.getByText('Typing...')).toBeInTheDocument();
  });

  it('supports custom renderMessage', () => {
    render(
      <MessageList
        messages={mockMessages}
        renderMessage={(msg) => (
          <div className="custom" data-testid={`custom-${msg.role}`}>
            {msg.content}
          </div>
        )}
      />
    );

    expect(screen.getByTestId('custom-user')).toHaveTextContent('Hello');
    expect(screen.getByTestId('custom-assistant')).toHaveTextContent('Hi!');
  });
});

describe('MessageInput', () => {
  it('renders with placeholder', () => {
    render(<MessageInput onSubmit={vi.fn()} placeholder="Type here..." />);

    expect(screen.getByPlaceholderText('Type here...')).toBeInTheDocument();
  });

  it('submits on button click', () => {
    const onSubmit = vi.fn();
    render(<MessageInput onSubmit={onSubmit} data-testid="input" />);

    const textarea = screen.getByTestId('input-textarea');
    const button = screen.getByTestId('input-button');

    fireEvent.change(textarea, { target: { value: 'Test' } });
    fireEvent.click(button);

    expect(onSubmit).toHaveBeenCalledWith('Test');
  });

  it('clears input after submit in uncontrolled mode', () => {
    render(<MessageInput onSubmit={vi.fn()} data-testid="input" />);

    const textarea = screen.getByTestId('input-textarea') as HTMLTextAreaElement;

    fireEvent.change(textarea, { target: { value: 'Test' } });
    expect(textarea.value).toBe('Test');

    fireEvent.click(screen.getByTestId('input-button'));
    expect(textarea.value).toBe('');
  });

  it('does not clear input after submit in controlled mode', () => {
    const onChange = vi.fn();
    render(
      <MessageInput
        onSubmit={vi.fn()}
        value="Controlled"
        onChange={onChange}
        data-testid="input"
      />
    );

    const textarea = screen.getByTestId('input-textarea') as HTMLTextAreaElement;
    expect(textarea.value).toBe('Controlled');

    fireEvent.click(screen.getByTestId('input-button'));
    // Value should remain - parent is responsible for clearing
    expect(textarea.value).toBe('Controlled');
  });

  it('does not submit empty or whitespace-only input', () => {
    const onSubmit = vi.fn();
    render(<MessageInput onSubmit={onSubmit} data-testid="input" />);

    const textarea = screen.getByTestId('input-textarea');
    const button = screen.getByTestId('input-button');

    // Empty
    fireEvent.click(button);
    expect(onSubmit).not.toHaveBeenCalled();

    // Whitespace only
    fireEvent.change(textarea, { target: { value: '   ' } });
    fireEvent.click(button);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('trims input before submitting', () => {
    const onSubmit = vi.fn();
    render(<MessageInput onSubmit={onSubmit} data-testid="input" />);

    const textarea = screen.getByTestId('input-textarea');

    fireEvent.change(textarea, { target: { value: '  Hello  ' } });
    fireEvent.click(screen.getByTestId('input-button'));

    expect(onSubmit).toHaveBeenCalledWith('Hello');
  });

  it('disables when isDisabled is true', () => {
    render(<MessageInput onSubmit={vi.fn()} isDisabled={true} data-testid="input" />);

    expect(screen.getByTestId('input-textarea')).toBeDisabled();
    expect(screen.getByTestId('input-button')).toBeDisabled();
  });

  it('calls onChange in controlled mode', () => {
    const onChange = vi.fn();
    render(
      <MessageInput onSubmit={vi.fn()} value="" onChange={onChange} data-testid="input" />
    );

    fireEvent.change(screen.getByTestId('input-textarea'), { target: { value: 'New' } });

    expect(onChange).toHaveBeenCalledWith('New');
  });
});
