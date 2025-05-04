import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

const StudentPerformanceChart = ({ students }) => {
  const performance = students.flatMap(s =>
    s.students.map(st => ({
      name: st.studentName,
      score: st.studentResults.reduce((acc, r) => acc + r.examScore, 0)
    }))
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Student Performance Trend</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={performance}>
          <XAxis dataKey="name" />
          <YAxis />
          <CartesianGrid stroke="#ccc" />
          <Tooltip />
          <Line type="monotone" dataKey="score" stroke="#10b981" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StudentPerformanceChart;
