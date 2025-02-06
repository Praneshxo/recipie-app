import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
export interface Recipe {
  id: number;
  title: string;
  description: string;
  image: string;
  time: string;
  difficulty: string;
  category: string;
  ingredients: string[];
  instructions: string[];
  servings: number;
}
