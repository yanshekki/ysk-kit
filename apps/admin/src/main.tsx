import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { createRoot } from 'react-dom/client';
import { queryClient } from './lib/client';
import { router } from './router';
import './styles.css';

const root = document.getElementById('root');
if (!root) throw new Error('#root missing');

createRoot(root).render(
  <QueryClientProvider client={queryClient}>
    <RouterProvider router={router} />
  </QueryClientProvider>,
);
