import { TabRow } from './components/TabRow/TabRow';
import { createMemoryRouter, RouterProvider, Outlet, useLocation } from 'react-router';
import { BankedItems, Changelog, PlannedPotions, PlannedPotionsConfirmation, PlannedPotionsSetup, Toasts, ErrorBoundary } from './components';
import { usePotionWatcher } from './hooks';
import { Tooltip } from 'react-tooltip';
import { useEffect } from 'react';
import styles from './App.module.css';

const router = createMemoryRouter([
  {
    path: '/',
    ErrorBoundary,
    Component: () => {
      const location = useLocation();
      usePotionWatcher();

      useEffect(() => {
        document.querySelector('main')?.scrollTo({top: 0, behavior: 'smooth'});
      }, [location.pathname]);
    
      return <>
        <div className={styles.root}>
          <TabRow />
          <main
            className={styles.main}
            children={<Outlet />}
          />
        </div>
        <Tooltip id="tooltip" className={styles.tooltip} float place="bottom" offset={20} noArrow />
        <Toasts />
      </>;
    },
    children: [
      {
        path: '/planned_potions',
        children: [
          {
            path: '',
            Component: PlannedPotions,
          },
          {
            path: 'setup',
            Component: PlannedPotionsSetup
          },
          {
            path: 'confirm',
            Component: PlannedPotionsConfirmation
          }
        ]
      },
      // {
      //   path: '/tracked_potions',
      //   element: <div>Tracked potions</div>
      // },
      // {
      //   path: '/settings',
      //   element: <div>Settings</div>
      // },
      {
        path: '/inventory',
        Component: BankedItems,
      },
      {
        path: '/changelog',
        Component: Changelog,
      },
    ]
  },
], {
  initialEntries: ['/planned_potions'],
});

export const App = () => {
  return <RouterProvider router={router} />;
};