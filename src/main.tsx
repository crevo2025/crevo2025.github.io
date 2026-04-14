// import {StrictMode} from 'react';
// import {createRoot} from 'react-dom/client';
// import App from './App.tsx';
// import './index.css';

console.log('main.tsx is executing');
const rootElement = document.getElementById('root');
if (rootElement) {
  rootElement.innerHTML = '<div style="color: blue; font-size: 24px; text-align: center;">main.tsx is WORKING! (Blue)</div>';
}

// createRoot(document.getElementById('root')!).render(
//     <App />
// );
