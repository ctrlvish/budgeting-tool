import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router";
import './index.css'
import App from './app.tsx'
import { ThemeProvider } from './components/theme-provider.tsx';

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <ThemeProvider>
      <StrictMode>
        <App />
      </StrictMode>
    </ThemeProvider>
  </BrowserRouter>,
)
