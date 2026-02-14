interface ErrorStateProps {
  message: string;
  onRetry: () => void;
  small?: boolean;
}

export function ErrorState({ message, onRetry, small = false }: ErrorStateProps) {
  return (
    <div className={`error-state${small ? " error-state-small" : ""}`} role="alert">
      <strong>Something went wrong</strong>
      <span>{message}</span>
      <button onClick={onRetry} type="button">
        Try again
      </button>
    </div>
  );
}
