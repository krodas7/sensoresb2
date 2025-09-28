import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import TemperatureMonitor from './pages/TemperatureMonitor'
import Occupation from './pages/Occupation'
import Lots from './pages/Lots'
import LotIntegration from './pages/LotIntegration'
import Suppliers from './pages/Suppliers'
import ShippingWeights from './pages/ShippingWeights'
import Fermentation from './pages/Fermentation'
import Cupping from './pages/Cupping'
import Inventory from './pages/Inventory'
import Employees from './pages/Employees'
import Attendance from './pages/Attendance'
import Reports from './pages/Reports'
import Logs from './pages/Logs'
import Users from './pages/Users'
import Gestions from './pages/Gestions'

function App() {
  return (
    <Router>
      <div className="App">
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="temperatures" element={<TemperatureMonitor />} />
            <Route path="occupation" element={<Occupation />} />
            <Route path="lots" element={<Lots />} />
            <Route path="lot-integration" element={<LotIntegration />} />
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
      </div>
    </Router>
  )
}

export default App