import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import PersonList from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <PersonList />
  </React.StrictMode>
);