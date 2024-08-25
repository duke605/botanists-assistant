import { Tab } from '@lib/components';
import styles from './TabRow.module.css';
import backpack from '@assets/backpack.png';
import settings from '@assets/settings.png';
import elderSalve from '@assets/potions/Elder_overload_salve_(6).png';
import herblore from '@assets/herblore.png';
import { useNavigate, useLocation } from 'react-router';

export const TabRow = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className={styles.tabRow}>
      <Tab title="Planned Potions" icon={herblore} onClick={() => navigate('/planned_potions/')} active={location.pathname.startsWith('/planned_potions')} />
      <Tab title="Tracked Potions" icon={elderSalve} onClick={() => navigate('/tracked_potions')} active={location.pathname === '/tracked_potions'} />
      <Tab title="Settings" icon={settings} onClick={() => navigate('/settings')} active={location.pathname === '/settings'} />
      <Tab title="Inventory" icon={backpack} onClick={() => navigate('/inventory')} active={location.pathname === '/inventory'} />
    </div>
  )
}