import { useCallback, useState } from "react";
import { logUI } from "../utils/logger";

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseAsyncReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (...args: unknown[]) => Promise<T | null>;
  reset: () => void;
  setData: (data: T | null) => void;
}

/**
 * Hook personalizado para manejar operaciones asíncronas con estado de carga y errores
 *
 * @example
 * const { data, loading, error, execute } = useAsync(async () => {
 *   return await api.getProducts();
 * });
 *
 * useEffect(() => {
 *   execute();
 * }, []);
 */
export function useAsync<T>(
  asyncFunction: (...args: unknown[]) => Promise<T>,
  options?: {
    immediate?: boolean;
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
    logModule?: string;
  }
): UseAsyncReturn<T> {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: options?.immediate ?? false,
    error: null,
  });

  const execute = useCallback(
    async (...args: unknown[]): Promise<T | null> => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const result = await asyncFunction(...args);
        setState({ data: result, loading: false, error: null });

        if (options?.onSuccess) {
          options.onSuccess(result);
        }

        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        const errorMessage = error.message || "Error desconocido";

        setState({ data: null, loading: false, error: errorMessage });

        logUI.error(`useAsync error: ${errorMessage}`, {
          module: options?.logModule || "useAsync",
          stack: error.stack,
        });

        if (options?.onError) {
          options.onError(error);
        }

        return null;
      }
    },
    [asyncFunction, options]
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  const setData = useCallback((data: T | null) => {
    setState(prev => ({ ...prev, data }));
  }, []);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    execute,
    reset,
    setData,
  };
}

/**
 * Hook para manejar múltiples operaciones asíncronas con un único estado de carga
 */
export function useAsyncQueue() {
  const [pending, setPending] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);

  const wrap = useCallback(
    async <T>(promise: Promise<T>, label?: string): Promise<T | null> => {
      setPending(p => p + 1);

      try {
        const result = await promise;
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        const errorMessage = label
          ? `${label}: ${error.message}`
          : error.message;

        setErrors(e => [...e, errorMessage]);
        logUI.error(`useAsyncQueue error: ${errorMessage}`, {
          module: "useAsyncQueue",
          label,
        });

        return null;
      } finally {
        setPending(p => p - 1);
      }
    },
    []
  );

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  return {
    loading: pending > 0,
    pendingCount: pending,
    errors,
    wrap,
    clearErrors,
  };
}
