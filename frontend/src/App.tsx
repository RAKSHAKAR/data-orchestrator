import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, CircularProgress, Box } from '@mui/material';
import { lightTheme, darkTheme } from './theme';
import { useStore } from './store/useStore';
import { useAuthStore } from './store/useAuthStore';
import { Layout } from './components/Layout';

const Dashboard = React.lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const DocumentList = React.lazy(() => import('./pages/DocumentList').then(m => ({ default: m.DocumentList })));
const DocumentDetails = React.lazy(() => import('./pages/DocumentDetails').then(m => ({ default: m.DocumentDetails })));
const Login = React.lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Upload = React.lazy(() => import('./pages/Upload').then(m => ({ default: m.Upload })));
const Settings = React.lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));

const SuspenseLoader = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <CircularProgress />
  </Box>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {
  const { darkMode } = useStore();

  return (
    <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
      <CssBaseline />
      <BrowserRouter>
        <React.Suspense fallback={<SuspenseLoader />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/*" element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/documents" element={<DocumentList />} />
                    <Route path="/documents/:id" element={<DocumentDetails />} />
                    <Route path="/upload" element={<Upload />} />
                    <Route path="/settings" element={<Settings />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            } />
          </Routes>
        </React.Suspense>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
