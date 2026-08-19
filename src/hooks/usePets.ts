import { useState, useCallback } from 'react';
import { Pet, CreatePetDto, UpdatePetDto } from '../types';
import { petsApi } from '../api/pets';

export function usePets() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await petsApi.list();
      setPets(data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load pets');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const create = useCallback(async (dto: CreatePetDto): Promise<Pet | null> => {
    try {
      const pet = await petsApi.create(dto);
      setPets((prev) => [pet, ...prev]);
      return pet;
    } catch (e) {
      throw e;
    }
  }, []);

  const update = useCallback(async (id: string, dto: UpdatePetDto): Promise<Pet | null> => {
    try {
      const updated = await petsApi.update(id, dto);
      setPets((prev) => prev.map((p) => (p.id === id ? updated : p)));
      return updated;
    } catch (e) {
      throw e;
    }
  }, []);

  const remove = useCallback(async (id: string): Promise<void> => {
    await petsApi.delete(id);
    setPets((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return { pets, isLoading, error, load, create, update, remove };
}
