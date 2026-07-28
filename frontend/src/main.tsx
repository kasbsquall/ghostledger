import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import '@fontsource-variable/archivo';
import '@fontsource/martian-mono/300.css';
import '@fontsource/martian-mono/400.css';

import App from './App';

const container = document.getElementById('root');
if (!container) throw new Error('Missing #root element');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>
);
