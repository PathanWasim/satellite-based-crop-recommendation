import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { WeatherAlertsProvider } from './context/WeatherAlertsContext';
import ToastContainer from './components/ToastContainer';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import MyFarms from './pages/MyFarms';
import Predictions from './pages/Predictions';
import Results from './pages/Results';
import History from './pages/History';
import Reports from './pages/Reports';
import Login from './pages/Login';
import Alerts from './pages/Alerts';
import './App.css';

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

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <WeatherAlertsProvider>
          <ToastProvider>
            <Router>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/*" element={
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
                } />
              </Routes>
            </Router>
          </ToastProvider>
        </WeatherAlertsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
