import { TabRow } from './components/TabRow/TabRow';
import { createMemoryRouter, RouterProvider, Outlet } from 'react-router';
import { BankedItems, PlannedPotions, PlannedPotionsConfirmation, PlannedPotionsSetup } from './components';
import { usePotionWatcher } from './hooks';
import { Tooltip } from 'react-tooltip';
import styles from './App.module.css';

const router = createMemoryRouter([
  {
    path: '/',
    element:  <div className={styles.root}>
      <TabRow />
      <main
        className={styles.main}
        children={<Outlet />}
      />
    </div>,
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
      {
        path: '/tracked_potions',
        element: <div>Tracked potions</div>
      },
      {
        path: '/settings',
        element: <div>Settings</div>
      },
      {
        path: '/inventory',
        Component: BankedItems,
      },
    ]
  },
], {
  initialEntries: ['/planned_potions'],
})

export const App = () => {
  usePotionWatcher();

  return <>
    <RouterProvider router={router} />
    <Tooltip id="tooltip" className={styles.tooltip} float place="bottom" offset={20} />
  </>;
};