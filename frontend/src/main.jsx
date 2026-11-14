import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { DataCacheProvider } from './context/DataCacheContext.jsx'
import App from './App.jsx'
import '@fontsource-variable/instrument-sans/index.css'
import '@fontsource/dm-mono/400.css'
import '@fontsource/dm-mono/500.css'
import '@fontsource/barlow-condensed/800-italic.css'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <DataCacheProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </DataCacheProvider>
    </BrowserRouter>
  </StrictMode>,
)