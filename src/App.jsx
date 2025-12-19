import { useState } from 'react';
import { WelcomePage } from './pages/WelcomePage';
import { LinearRegression } from './pages/lectures/LinearRegression';

export default function App() {
  const [currentView, setCurrentView] = useState('welcome');

  if (currentView === 'linear-regression') {
    return <LinearRegression onBack={() => setCurrentView('welcome')} />;
  }

  return <WelcomePage onNavigate={setCurrentView} />;
}
