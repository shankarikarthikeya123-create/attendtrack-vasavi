import React from 'react';
import AttendanceRecordsPage from '../admin/AttendanceRecordsPage';
import useAuth from '../../hooks/useAuth';

const AttendanceHistoryPage = () => {
  const { user } = useAuth();
  return <AttendanceRecordsPage lockedSiteId={user?.siteId} />;
};

export default AttendanceHistoryPage;
