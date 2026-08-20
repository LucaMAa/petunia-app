import { useState, useCallback } from 'react';
import { CreateReportDto, MapReport } from '../types';
import { reportsApi } from '../api/reports';

export function useMapReports() {
  const [reports, setReports] = useState<MapReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNearby = useCallback(async (lat: number, lng: number, radius?: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await reportsApi.nearby(lat, lng, radius);
      setReports(data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore caricamento');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const create = useCallback(async (dto: CreateReportDto) => {
    const r = await reportsApi.create(dto);
    setReports((prev) => [r, ...prev]);
    return r;
  }, []);

  const remove = useCallback(async (id: string) => {
    await reportsApi.delete(id);
    setReports((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const reportAbuse = useCallback(async (id: string, reason?: string) => {
    await reportsApi.reportAbuse(id, reason);
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, abuse_count: r.abuse_count + 1 } : r)),
    );
  }, []);

  return { reports, isLoading, error, loadNearby, create, remove, reportAbuse };
}
