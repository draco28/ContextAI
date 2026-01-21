[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [react/src](../README.md) / useAnnouncer

# Function: useAnnouncer()

> **useAnnouncer**(`options`): [`UseAnnouncerReturn`](../interfaces/UseAnnouncerReturn.md)

Defined in: [react/src/utils/announcer.ts:124](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/react/src/utils/announcer.ts#L124)

Hook for announcing dynamic content changes to screen readers.

Creates a global live region that screen readers monitor. When you call
`announce()`, the message is injected into this region, causing screen
readers to speak it.

## Parameters

### options

[`UseAnnouncerOptions`](../interfaces/UseAnnouncerOptions.md) = `{}`

Configuration options

## Returns

[`UseAnnouncerReturn`](../interfaces/UseAnnouncerReturn.md)

Object with announce and clear functions

## Examples

```tsx
function ChatWindow() {
  const { announce } = useAnnouncer();
  const [messages, setMessages] = useState([]);

  const handleNewMessage = (message) => {
    setMessages(prev => [...prev, message]);
    // Announce to screen readers
    announce(`New message from ${message.role}: ${message.content.slice(0, 100)}`);
  };

  // ...
}
```

```tsx
// For critical errors, use assertive
function ErrorBoundary() {
  const { announce } = useAnnouncer({ defaultPoliteness: 'assertive' });

  useEffect(() => {
    if (error) {
      announce(`Error: ${error.message}`);
    }
  }, [error]);
}
```
