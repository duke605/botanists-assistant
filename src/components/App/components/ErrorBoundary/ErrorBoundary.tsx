import { Button, Heading, Stack } from '@lib/components';
import { useNavigate, useRouteError } from 'react-router';
import { useCallback, useEffect } from 'react';
import { useBankedItemInputs, useItemPrices, usePlannedPotions, usePotionPlanner } from '@state';
import styles from './ErrorBoundary.module.css';

export const ErrorBoundary = () => {
  const error = useRouteError() as Error;
  const nav = useNavigate();

  useEffect(() => {
    console.error(error);
  }, [error]);

  const copy = useCallback(() => {
    navigator.clipboard.writeText(error.stack!);
  }, [error]);

  const clearState = useCallback(() => {
    usePotionPlanner.persist.clearStorage();
    useBankedItemInputs.persist.clearStorage();
    useItemPrices.persist.clearStorage();
    usePlannedPotions.persist.clearStorage();
    nav('/planned_potions');
  }, [error]);

  return (
    <Stack direction="vertical" alignItems="center" spacing="extraLoose">
      <Heading noMargin>Error</Heading>
      <p className={styles.code}>
        {error.stack ?? `${error}`}
      </p>
      <div style={{display: 'grid', gap: '8px', gridTemplateColumns: '1fr 1fr', width: '90vw'}}>
        <Button onClick={clearState} danger>Clear storage</Button>
        <Button onClick={copy}>Copy to clipboard</Button>
      </div>
      <p style={{width: '90vw', textAlign: 'center', margin: 0}}>
        If you still see this page after closing, reopening, uninstalling, and reinstalling the app, use the clear state button to clear out persisted state. This will clear your banked items, planned potions, potion planner settings, and item prices.
      </p>
    </Stack>
  );
}