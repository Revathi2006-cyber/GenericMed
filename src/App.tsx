import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SettingsProvider } from './contexts/SettingsContext';
import { AuthProvider } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Home } from './pages/Home';
import { Scan } from './pages/Scan';
import { Results } from './pages/Results';
import { Settings } from './pages/Settings';
import { Reminders } from './pages/Reminders';
import { History } from './pages/History';
import { Login } from './pages/Login';
import { SignUp } from './pages/SignUp';
import { Profile } from './pages/Profile';
import { Onboarding } from './pages/Onboarding';
import { ReminderSystem } from './components/ReminderSystem';

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <ReminderSystem />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            
            <Route element={<ProtectedRoute />}>
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="scan" element={<Scan />} />
                <Route path="results" element={<Results />} />
                <Route path="settings" element={<Settings />} />
                <Route path="reminders" element={<Reminders />} />
                <Route path="history" element={<History />} />
                <Route path="profile" element={<Profile />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </SettingsProvider>
    </AuthProvider>
  );
}

