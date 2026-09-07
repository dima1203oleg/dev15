import React from 'react';
import { Home, RefreshCw, ShieldAlert } from 'lucide-react';

interface AppErrorBoundaryProps {
  children: React.ReactNode;
  theme?: 'light' | 'dark';
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

/** Keeps a failed lazy route or WebGL chunk from replacing the whole app with a blank page. */
export class AppErrorBoundary extends React.Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  public state: AppErrorBoundaryState = { hasError: false };

  public constructor(props: AppErrorBoundaryProps) {
    super(props);
  }

  public static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Keep the user-facing message intentionally generic; technical details belong in observability.
    console.error('SIREN UA route failed to render', error, info);
  }

  private getCurrentProps(): AppErrorBoundaryProps {
    // The bundled React type surface omits `props` from Component, but React
    // supplies it at runtime. Reading the current value here keeps the
    // boundary transparent when the routed children change.
    return (this as unknown as { props: AppErrorBoundaryProps }).props;
  }

  private handleRetry = () => {
    window.location.reload();
  };

  public render() {
    const props = this.getCurrentProps();
    if (!this.state.hasError) return props.children;

    const isDark = props.theme === 'dark';

    return (
      <section
        role="alert"
        className={`min-h-[360px] rounded-3xl border p-8 flex items-center justify-center ${
          isDark
            ? 'border-[#2D4A55] bg-[#10232B] text-white'
            : 'border-[#D9E2E8] bg-[#F7FAFC] text-[#0F172A]'
        }`}
      >
        <div className="max-w-md text-center">
          <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border ${
            isDark
              ? 'border-amber-400/30 bg-amber-400/10 text-amber-300'
              : 'border-amber-300 bg-amber-50 text-amber-700'
          }`}>
            <ShieldAlert className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="text-xl font-black">Розділ тимчасово недоступний</h2>
          <p className={`mt-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            Не вдалося завантажити цей екран. Дані безпеки не підміняємо — спробуйте оновити сторінку.
          </p>
          <button
            type="button"
            onClick={this.handleRetry}
            className={`mt-5 inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition-colors ${
              isDark
                ? 'bg-[#73AFC7] text-[#07151C] hover:bg-[#8BC2D7]'
                : 'bg-[#6D9FB8] text-white hover:bg-[#5E8EA7]'
            }`}
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Повторити спробу
          </button>
          <button
            type="button"
            onClick={() => { window.location.href = '/'; }}
            className={`mt-3 inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-bold transition-colors ${
              isDark
                ? 'border-[#2E4160] text-slate-200 hover:bg-[#182335]'
                : 'border-[#CBD6E2] text-[#334155] hover:bg-white'
            }`}
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            На головну
          </button>
        </div>
      </section>
    );
  }
}
