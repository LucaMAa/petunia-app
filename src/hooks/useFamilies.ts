import { useState, useCallback } from 'react';
import { Family, CreateFamilyDto } from '../types';
import { familiesApi } from '../api/families';

export function useFamilies() {
  const [families, setFamilies] = useState<Family[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setFamilies((await familiesApi.list()) ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load families');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const create = useCallback(async (dto: CreateFamilyDto): Promise<Family> => {
    const family = await familiesApi.create(dto);
    setFamilies((prev) => [family, ...prev]);
    return family;
  }, []);

  const remove = useCallback(async (id: string) => {
    await familiesApi.delete(id);
    setFamilies((prev) => prev.filter((f) => f.id !== id));
  }, []);

  return { families, isLoading, error, load, create, remove };
}
