// import { StrictMode } from 'react';
import 'core-js/actual/iterator';
import ReactDOM from 'react-dom/client';
import { App } from './components';
import appconfig from '@assets/appconfig.json?url';
import './index.css';

if (window.alt1) {
  window.alt1.identifyAppUrl(appconfig);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <>
    <App />
  </>
);