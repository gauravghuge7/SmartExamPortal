import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const MarksHistogram = ({ students }) => {
  const scores = students.flatMap(s =>
    s.students.flatMap(st => st.studentResults.map(r => r.examScore))
  );
  const scoreDistribution = Array.from({ length: 11 }, (_, i) => ({
    name: `${i * 10}-${i * 10 + 9}`,
    students: scores.filter(score => score >= i * 10 && score <= i * 10 + 9).length
  }));

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Score Distribution</h2>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={scoreDistribution}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="students" fill="#6366f1" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MarksHistogram;
