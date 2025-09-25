import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { defineCustomElements } from '@ionic/pwa-elements/loader'

// Call the element loader before the render call
defineCustomElements(window)

createRoot(document.getElementById("root")!).render(<App />);
