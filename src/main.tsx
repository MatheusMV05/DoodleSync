import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import "@excalidraw/excalidraw/index.css";
import App from './App.tsx'
import { ThemeProvider } from './contexts/ThemeContext';

// @ts-ignore
window.EXCALIDRAW_ASSET_PATH = "/";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>
)
