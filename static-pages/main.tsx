import React from 'react';
import ReactDOM from 'react-dom/client';
import { PackStudio } from '../app/pack-studio';
import '../app/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PackStudio userName="Modo demo" staticDemo />
  </React.StrictMode>,
);
