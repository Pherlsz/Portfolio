import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {CvDocument} from './components/CvDocument.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  window.location.pathname === '/cv' ? <CvDocument /> : <App />
);
