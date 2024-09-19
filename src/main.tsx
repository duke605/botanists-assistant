// import { StrictMode } from 'react';
import 'core-js/actual/iterator';
import ReactDOM from 'react-dom/client';
import { App } from './components';
import appconfig from '@assets/appconfig.json?url';
import './index.css';
import 'react-toastify/dist/ReactToastify.css';
import { engage, track } from '@lib/mixpanel';

if (window.alt1) {
  window.alt1.identifyAppUrl(appconfig);
  engage('set_once', {first_seen: Date.now()});
  track('Plugin load');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <>
    <App />
  </>
);