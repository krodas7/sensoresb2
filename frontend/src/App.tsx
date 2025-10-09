import React, { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

// Eager load critical components
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'

// Lazy load non-critical pages
const TemperatureMonitor = lazy(() => import('./pages/TemperatureMonitor'))
const Occupation = lazy(() => import('./pages/Occupation'))
const Lots = lazy(() => import('./pages/Lots'))
const LotIntegration = lazy(() => import('./pages/LotIntegration'))
const Suppliers = lazy(() => import('./pages/Suppliers'))
const ShippingWeights = lazy(() => import('./pages/ShippingWeights'))
const Fermentation = lazy(() => import('./pages/Fermentation'))
const Cupping = lazy(() => import('./pages/Cupping'))
const Inventory = lazy(() => import('./pages/Inventory'))
const Employees = lazy(() => import('./pages/Employees'))
const Attendance = lazy(() => import('./pages/Attendance'))
const Reports = lazy(() => import('./pages/Reports'))
const Logs = lazy(() => import('./pages/Logs'))
const Users = lazy(() => import('./pages/Users'))
const Gestions = lazy(() => import('./pages/Gestions'))

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Cargando...</p>
    </div>
  </div>
)

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <div className="App">
        <Toaster position="top-right" />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="temperatures" element={<TemperatureMonitor />} />
              <Route path="temperaturas" element={<TemperatureMonitor />} /> {/* Alias para compatibilidad */}
              <Route path="occupation" element={<Occupation />} />
              <Route path="lots" element={<Lots />} />
              <Route path="lot-integration" element={<LotIntegration />} />
              <Route path="integration" element={<LotIntegration />} /> {/* Alias */}
              <Route path="suppliers" element={<Suppliers />} />
              <Route path="shipping-weights" element={<ShippingWeights />} />
              <Route path="fermentation" element={<Fermentation />} />
              <Route path="cupping" element={<Cupping />} />
              <Route path="inventory" element={<Inventory />} />
              <Route path="employees" element={<Employees />} />
              <Route path="attendance" element={<Attendance />} />
              <Route path="reports" element={<Reports />} />
              <Route path="logs" element={<Logs />} />
              <Route path="users" element={<Users />} />
              <Route path="gestions" element={<Gestions />} />
            </Route>
          </Routes>
        </Suspense>
      </div>
    </Router>
  )
}

export default App