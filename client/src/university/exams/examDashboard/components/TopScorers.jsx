import React from 'react';

const TopScorers = ({ students }) => {
  const results = students.flatMap(s =>
    s.students.map(st => ({
      name: st.studentName,
      score: st.studentResults.reduce((acc, r) => acc + r.examScore, 0)
    }))
  );
  const topScorers = results.sort((a, b) => b.score - a.score).slice(0, 5);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Top Scorers</h2>
      <ul className="space-y-2">
        {topScorers.map((student, idx) => (
          <li key={idx} className="flex justify-between text-gray-700">
            <span>{student.name}</span>
            <span className="font-bold">{student.score}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TopScorers;
