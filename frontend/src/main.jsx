import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import MergeBuilder from './pages/MergeBuilder';
import NetworkVisualizer from './pages/NetworkVisualizer';
import Quantizer from './pages/Quantizer';
import ProcessLogs from './pages/ProcessLogs';
import Settings from './pages/Settings';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<MergeBuilder />} />
          <Route path="visualizer" element={<NetworkVisualizer />} />
          <Route path="quantizer" element={<Quantizer />} />
          <Route path="logs" element={<ProcessLogs />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
