import {createRoot} from 'react-dom/client';
import App from './App.tsx';

const root = document.getElementById('root')!;

if (window.location.pathname === '/cv' || window.location.pathname === '/cv/') {
  import('./components/CvDocument.tsx').then(({CvDocument}) => {
    createRoot(root).render(<CvDocument />);
  });
} else {
  createRoot(root).render(<App />);
}
