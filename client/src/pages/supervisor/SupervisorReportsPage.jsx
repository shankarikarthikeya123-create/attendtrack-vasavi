import React from 'react';
import MonthlyReportsPage from '../admin/MonthlyReportsPage';
import useAuth from '../../hooks/useAuth';

const SupervisorReportsPage = () => {
  const { user } = useAuth();
  return <MonthlyReportsPage lockedSiteId={user?.siteId} />;
};

export default SupervisorReportsPage;
