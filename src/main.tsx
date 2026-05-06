import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom' // Ensure this is imported
import './index.css'
import App from './app/App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Set basename to your repository name exactly as it appears in the URL */}
    <BrowserRouter basename="/nchu-project">
      <App />
    </BrowserRouter>
  </StrictMode>,
)
