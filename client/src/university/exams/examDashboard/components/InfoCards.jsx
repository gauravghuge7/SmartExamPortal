import React from 'react';

const InfoCard = ({ title, value, color }) => (
  <div className={`bg-white p-6 rounded-lg shadow-md border-l-8 ${color}`}>
    <h2 className="text-xl font-semibold text-gray-700">{title}</h2>
    <p className="text-3xl font-bold">{value}</p>
  </div>
);

const InfoCards = ({ totalQuestions, totalStudents, attemptedStudents, averageScore }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <InfoCard title="Total Questions" value={totalQuestions} color="border-blue-500" />
      <InfoCard title="Total Students" value={totalStudents} color="border-green-500" />
      <InfoCard title="Attempted Students" value={attemptedStudents} color="border-yellow-500" />
      <InfoCard title="Average Score" value={averageScore} color="border-purple-500" />
    </div>
  );
};

export default InfoCards;
