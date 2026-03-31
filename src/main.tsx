import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { ExercisesProvider } from './hooks/useExercises'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ExercisesProvider>
      <App />
    </ExercisesProvider>
  </React.StrictMode>,
)
