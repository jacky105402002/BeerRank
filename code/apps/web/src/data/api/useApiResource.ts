import { useEffect, useState } from "react";

type ApiResource<T> = {
  data: T;
  error: Error | null;
  loading: boolean;
};

export function useApiResource<T>(loader: () => Promise<T>, fallback: T, deps: unknown[] = []): ApiResource<T> {
  const [data, setData] = useState<T>(fallback);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    loader()
      .then((nextData) => {
        if (active) {
          setData(nextData);
        }
      })
      .catch((nextError: Error) => {
        if (active) {
          setError(nextError);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, deps);

  return { data, error, loading };
}
