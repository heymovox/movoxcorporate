/**
 * Admin error boundary.
 *
 * Without this, any render-time throw unmounts the whole tree and the user
 * gets a blank white screen with no way back. This catches it, shows what
 * went wrong, and offers a reload.
 */
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class AdminErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Admin UI error:', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <AlertTriangle className="mx-auto h-10 w-10 text-red-500" aria-hidden="true" />
          <h1 className="mt-4 font-heading text-xl font-bold text-ink">
            Something went wrong
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            This section failed to render. Reload to try again.
          </p>
          <pre className="mt-4 max-h-32 overflow-auto rounded-lg bg-slate-50 p-3 text-left text-xs text-red-700">
            {error.message}
          </pre>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="btn btn-primary btn-sm mt-5"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Reload dashboard
          </button>
        </div>
      </div>
    );
  }
}