import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import ToastContainer from './components/ToastContainer';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import MyFarms from './pages/MyFarms';
import Predictions from './pages/Predictions';
import Results from './pages/Results';
import History from './pages/History';
import './App.css';

// Placeholder components for routes not yet implemented
const Reports = () => (
  <div className="placeholder-page">
    <h1>📊 Reports</h1>
    <p>Yield and health reports coming soon!</p>
  </div>
);

const Assistant = () => (
  <div className="placeholder-page">
    <h1>🤖 AI Assistant</h1>
    <p>Chat assistant coming soon!</p>
  </div>
);

const Weather = () => (
  <div className="placeholder-page">
    <h1>☁️ Weather</h1>
    <p>Detailed weather insights coming soon!</p>
  </div>
);

const Alerts = () => (
  <div className="placeholder-page">
    <h1>⚠️ Crop Risk Alerts</h1>
    <p>Risk alerts and notifications coming soon!</p>
  </div>
);

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <Router>
          <div className="app">
            <Navbar />
            <ToastContainer />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/farms" element={<MyFarms />} />
                <Route path="/predictions" element={<Predictions />} />
                <Route path="/results" element={<Results />} />
                <Route path="/history" element={<History />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/assistant" element={<Assistant />} />
                <Route path="/weather" element={<Weather />} />
                <Route path="/alerts" element={<Alerts />} />
              </Routes>
            </main>
          </div>
        </Router>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
