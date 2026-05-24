import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const storedTheme = window.localStorage.getItem('devflow-theme-mode')
document.documentElement.setAttribute('data-theme', storedTheme === 'dark' ? 'dark' : 'light')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
