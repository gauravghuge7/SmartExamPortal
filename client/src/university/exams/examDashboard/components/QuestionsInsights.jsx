import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const COLORS = ['#4ade80', '#facc15', '#f87171'];

const QuestionInsights = ({ questionsLevel }) => {
  const data = [
    { name: 'Easy', value: questionsLevel?.easy || 0 },
    { name: 'Medium', value: questionsLevel?.medium || 0 },
    { name: 'Hard', value: questionsLevel?.hard || 0 }
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Question Difficulty Distribution</h2>
      <PieChart width={300} height={250}>
        <Pie data={data} dataKey="value" cx="50%" cy="50%" outerRadius={80} label>
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </div>
  );
};

export default QuestionInsights;
