import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const rootElement = document.getElementById('root');
if (rootElement) {
  rootElement.innerHTML = '<div style="color: blue; font-size: 24px; text-align: center;">React Mounting...</div>';
}

createRoot(document.getElementById('root')!).render(
    <App />
);
