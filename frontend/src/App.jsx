import React, { useState, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { FaBox, FaUsers, FaBriefcase, FaTools, FaSignOutAlt, FaMoon, FaSun, FaChartBar } from 'react-icons/fa';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import toast, { Toaster } from 'react-hot-toast';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { getAssetCounts, getMaintenanceTrend } from './api/dashboard';
import './App.css';

export const ThemeContext = createContext();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

import AssetList from './Components/assets/AssetList';
import VendorList from './Components/vendors/VendorList';
import EmployeeList from './Components/employees/EmployeeList';
import AllocationList from './Components/allocations/AllocationList';
import MaintenanceList from './Components/maintenance/MaintenanceList';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [theme, setTheme] = useState('light');

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeContext.Provider value={theme}>
        <Router>
          <div className={`app-container ${theme}`}>
            <Toaster position="top-right" toastOptions={{ duration: 4000, style: { background: theme === 'dark' ? '#333' : '#fff', color: theme === 'dark' ? '#fff' : '#000' } }} />
            <header className="app-header">
              <div className="header-left">
                <button className="menu-toggle" onClick={toggleSidebar} aria-label="Toggle menu">
                  ☰
                </button>
                <h1>Asset Management</h1>
              </div>
              <div className="header-right">
                <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle theme">
                  {theme === 'light' ? <FaMoon /> : <FaSun />}
                </button>
                <span className="user-profile">John Doe</span>
                <button className="logout-btn" aria-label="Logout">
                  <FaSignOutAlt /> Logout
                </button>
              </div>
            </header>

            <div className="main-layout">
              <nav className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <ul>
                  <li>
                    <NavLink
                      to="/dashboard"
                      className={({ isActive }) => (isActive ? 'active' : '')}
                      onClick={() => setIsSidebarOpen(false)}
                    >
                      <FaChartBar /> Dashboard
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/assets"
                      className={({ isActive }) => (isActive ? 'active' : '')}
                      onClick={() => setIsSidebarOpen(false)}
                    >
                      <FaBox /> Assets
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/vendors"
                      className={({ isActive }) => (isActive ? 'active' : '')}
                      onClick={() => setIsSidebarOpen(false)}
                    >
                      <FaUsers /> Vendors
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/employees"
                      className={({ isActive }) => (isActive ? 'active' : '')}
                      onClick={() => setIsSidebarOpen(false)}
                    >
                      <FaBriefcase /> Employees
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/allocations"
                      className={({ isActive }) => (isActive ? 'active' : '')}
                      onClick={() => setIsSidebarOpen(false)}
                    >
                      <FaUsers /> Allocations
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/maintenance"
                      className={({ isActive }) => (isActive ? 'active' : '')}
                      onClick={() => setIsSidebarOpen(false)}
                    >
                      <FaTools /> Maintenance
                    </NavLink>
                  </li>
                </ul>
              </nav>

              <main className="content">
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route
                    path="/assets"
                    element={
                      <div className="tab-content">
                        <AssetList />
                      </div>
                    }
                  />
                  <Route
                    path="/vendors"
                    element={
                      <div className="tab-content">
                        <VendorList />
                      </div>
                    }
                  />
                  <Route
                    path="/employees"
                    element={
                      <div className="tab-content">
                        <EmployeeList />
                      </div>
                    }
                  />
                  <Route
                    path="/allocations"
                    element={
                      <div className="tab-content">
                        <AllocationList />
                      </div>
                    }
                  />
                  <Route
                    path="/maintenance"
                    element={
                      <div className="tab-content">
                        <MaintenanceList />
                      </div>
                    }
                  />
                  <Route path="/" element={<Navigate to="/dashboard" />} />
                  <Route path="*" element={<Navigate to="/dashboard" />} />
                </Routes>
              </main>
            </div>
          </div>
        </Router>
        <ReactQueryDevtools initialIsOpen={false} />
      </ThemeContext.Provider>
    </QueryClientProvider>
  );
}

const Dashboard = () => {
  const theme = useContext(ThemeContext);

  const { data: assetCounts = { total: 0, allocated: 0, underMaintenance: 0 }, isLoading: countsLoading } = useQuery({
    queryKey: ['assetCounts'],
    queryFn: getAssetCounts,
  });

  const { data: maintenanceTrend = [], isLoading: trendLoading } = useQuery({
    queryKey: ['maintenanceTrend'],
    queryFn: getMaintenanceTrend,
  });

  const assetStatusData = [
    { name: 'In Stock', value: assetCounts.total - assetCounts.allocated - assetCounts.underMaintenance },
    { name: 'Allocated', value: assetCounts.allocated },
    { name: 'Under Maintenance', value: assetCounts.underMaintenance },
  ].filter(item => item.value > 0);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b'];

  if (countsLoading || trendLoading) return <div className="loading-spinner"></div>;

  return (
    <div className="dashboard">
      <div className="stat-row">
        <div className="stat-card">
          <FaBox className="stat-icon" />
          <div>
            <h3>Total Assets</h3>
            <p className="stat-number">{assetCounts.total}</p>
          </div>
        </div>
        <div className="stat-card">
          <FaUsers className="stat-icon" />
          <div>
            <h3>Allocated</h3>
            <p className="stat-number">{assetCounts.allocated}</p>
          </div>
        </div>
        <div className="stat-card">
          <FaTools className="stat-icon" />
          <div>
            <h3>Under Maintenance</h3>
            <p className="stat-number">{assetCounts.underMaintenance}</p>
          </div>
        </div>
      </div>
      <div className="chart-row">
        <div className="chart-card">
          <h3>Asset Status Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={assetStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius= {80}
                fill="#8884d8"
                dataKey="value"
              >
                {assetStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card">
          <h3>Maintenance Trend (Last 6 Months)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={maintenanceTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="repairs" stroke="#3b82f6" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default App;