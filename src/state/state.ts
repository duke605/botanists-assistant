import { PersistOptions, StorageValue } from "zustand/middleware"

interface createCustomJSONStorageOptions<S, J = S> {
  version?: number;
  name: string;
  beforeSave?: (value: StorageValue<S>) => StorageValue<J>;
  migrate?: (value: StorageValue<unknown>) => StorageValue<J>;
  transform?: (value: StorageValue<J>) => StorageValue<S>;
  storage?: Storage;
}

export const createCustomJSONStorage = <S, J>(options: createCustomJSONStorageOptions<S, J>): PersistOptions<S> => {
  const storage = options.storage ?? localStorage;

  return {
    version: options.version,
    name: options.name,
    migrate: s => s as any,
    storage: {
      removeItem: name => storage.removeItem(name),
      setItem: (name, value) => {
        const transformedValue = options.beforeSave?.(value) ?? value;
        storage.setItem(name, JSON.stringify(transformedValue));
      },
      getItem: (name): StorageValue<any> | null => {
        const item = storage.getItem(name);
        if (item === null) return null;

        const value: StorageValue<unknown> = JSON.parse(item);
        const migratedValue = options.migrate?.(value) ?? (value as StorageValue<J>);
        
        return (options.transform?.(migratedValue) ?? value) as StorageValue<any>;
      }
    }
  };
};