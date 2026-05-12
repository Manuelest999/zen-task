import React from 'react';
import Sidebar from './Sidebar';
import NetworkStatus from './NetworkStatus';

const Layout = ({ children }) => (
  <div className="app-layout">
    <Sidebar />
    <main className="page-main">
      <NetworkStatus />
      {children}
    </main>
  </div>
);

export default Layout;
