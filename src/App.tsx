import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Layout } from './components/Layout';
import { PageLoading } from './components/ui/Loading';

const Dashboard = React.lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Production = React.lazy(() => import('./pages/Production').then(m => ({ default: m.Production })));
const Materials = React.lazy(() => import('./pages/Materials').then(m => ({ default: m.Materials })));
const Expenses = React.lazy(() => import('./pages/Expenses').then(m => ({ default: m.Expenses })));
const Incomes = React.lazy(() => import('./pages/Incomes').then(m => ({ default: m.Incomes })));
const Models = React.lazy(() => import('./pages/Models').then(m => ({ default: m.Models })));
const Employees = React.lazy(() => import('./pages/Employees'));
const SalaryAllowances = React.lazy(() => import('./pages/SalaryAllowances'));
const PieceWorkers = React.lazy(() => import('./pages/PieceWorkers'));
const Suppliers = React.lazy(() => import('./pages/Suppliers'));

function App() {
  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <Layout>
        <Suspense fallback={<PageLoading />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/production" element={<Production />} />
            <Route path="/materials" element={<Materials />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/incomes" element={<Incomes />} />
            <Route path="/models" element={<Models />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/salary-allowances" element={<SalaryAllowances />} />
            <Route path="/piece-workers" element={<PieceWorkers />} />
            <Route path="/suppliers" element={<Suppliers />} />
          </Routes>
        </Suspense>
      </Layout>
    </Router>
  );
}

export default App;
