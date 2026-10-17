export function ErrorBanner({ message, requestId }: { message: string; requestId?: string }) {
  return (
    <p
      className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
      role="alert"
    >
      {message}
      {requestId ? (
        <span className="mt-1 block text-xs text-red-600">Request ID: {requestId}</span>
      ) : null}
    </p>
  );
}
