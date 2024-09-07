import { TabRow } from './components/TabRow/TabRow';
import { createMemoryRouter, RouterProvider, Outlet, useLocation } from 'react-router';
import { BankedItems, PlannedPotions, PlannedPotionsConfirmation, PlannedPotionsSetup, Toasts } from './components';
import { usePotionWatcher } from './hooks';
import { Tooltip } from 'react-tooltip';
import styles from './App.module.css';
import { useEffect } from 'react';

const router = createMemoryRouter([
  {
    path: '/',
    Component: () => {
      const location = useLocation();

      useEffect(() => {
        document.querySelector('main')?.scrollTo({top: 0, behavior: 'smooth'});
      }, [location.pathname]);
    
      return (
        <div className={styles.root}>
          <TabRow />
          <main
            className={styles.main}
            children={<Outlet />}
          />
        </div>
      );
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
    ]
  },
], {
  initialEntries: ['/planned_potions'],
});

export const App = () => {
  usePotionWatcher();

  return <>
    <RouterProvider router={router} />
    <Tooltip id="tooltip" className={styles.tooltip} float place="bottom" offset={20} noArrow />
    <Toasts />
  </>;
};