import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router";
import './index.css'
import App from './app.tsx'
import { ThemeProvider } from './components/theme-provider.tsx';
import { Toaster } from './components/ui/sonner.tsx'
import PwaUpdatePrompt from './components/pwa-update-prompt.tsx'

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <ThemeProvider>
      <StrictMode>
        <Toaster 
          visibleToasts={1}
          closeButton={false}
          duration={2200}
          offset={40}
          mobileOffset={{
            top: "calc(1rem + env(safe-area-inset-top))",
            left: 16,
            right: 16,
        }}/>
        <PwaUpdatePrompt />
        <App />
      </StrictMode>
    </ThemeProvider>
  </BrowserRouter>,
)
