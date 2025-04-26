import React from 'react';
import StudentDashboardLayout from './StudentDashboardLayout';

function Settings() {
  return (
    <StudentDashboardLayout sidebarOpen={true} setSidebarOpen={true}>
      <h1>Settings</h1>
    </StudentDashboardLayout>
  )
}

export default Settings
