import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './mobile-fixes.css'; // Comprehensive mobile UI fixes
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
