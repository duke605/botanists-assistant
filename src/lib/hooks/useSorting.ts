import { useCallback, useState } from 'react';

export const useSorting = <T extends string>() => {
  const [ direction, setDirection ] = useState(0);
  const [ column, setColumn ] = useState<T>();

  const progressSort = useCallback((col: T) => {
    setColumn(col);
    setDirection(d => column === col ? (d+1) % 3 : 1);
  }, [column]);

  return [
    column,
    direction,
    progressSort,
    setDirection,
  ] as const;
}