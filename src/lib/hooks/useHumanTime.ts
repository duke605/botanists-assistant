import { useMemo } from "react";

const withRem = (n1: number) => [Math.floor(n1).toString().padStart(2, '0'), n1 - Math.floor(n1)] as const;

/**
 * Converts time in seconds to a human readable timestamp formatted like HH:MM:SS
 */
export const useHumanTime = (secs: number) => {
  return useMemo(() => {
    const [ hours, hoursRem ] = withRem(secs / (60 * 60));
    const [ minutes, minutesRem ] = withRem(hoursRem * 60);
    const [ seconds ] = withRem(minutesRem * 60);
  
    return `${hours}:${minutes}:${seconds}`;
  }, [secs]);
}