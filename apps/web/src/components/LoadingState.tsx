interface LoadingStateProps {
  message: string;
  small?: boolean;
}

export function LoadingState({ message, small = false }: LoadingStateProps) {
  return (
    <div className={`loading-state${small ? " loading-state-small" : ""}`}>
      <span className="loading-spinner" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
