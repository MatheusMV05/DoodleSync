import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// @ts-ignore
window.EXCALIDRAW_ASSET_PATH = "/";

createRoot(document.getElementById('root')!).render(
  <App />
)
