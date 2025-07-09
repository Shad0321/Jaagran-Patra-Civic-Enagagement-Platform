import { createRoot } from 'react-dom/client';
import './index.css';
import { store } from './redux/store.js';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import router from './routes/routes.jsx';

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <RouterProvider router={router} />
  </Provider>
);
