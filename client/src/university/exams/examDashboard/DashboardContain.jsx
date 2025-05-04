import { useEffect, useState } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import axiosInstance from './../../../services/axiosInstance';
import Dashboard from './Dashboard';

const COLORS = ['#4CAF50', '#FF9800', '#F44336'];

const DashboardContain = ({ examId }) => {
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    axiosInstance.get(`/university/exam/getDashboardOfExam/${examId}`)
      .then(res => setDashboardData(res.data.data))
      .catch(err => console.error(err));
  }, [examId]);

  if (!dashboardData) return <div>Loading...</div>;

  const {
    students,
    exam,
    questions,
    questionsLevel,
  } = dashboardData;

  const totalStudents = students.length;
  const attemptedStudents = dashboardData.attemptedStudents;
  const totalQuestions = questions.length;

  const allResults = students.flatMap(s => s.students[0]?.studentResults || []);
  const submittedResults = allResults.filter(r => r.isSubmitted !== false && r.examMarks > 0);
  const totalMarks = submittedResults.reduce((acc, r) => acc + r.examMarks, 0);
  const averageMarks = submittedResults.length > 0 ? (totalMarks / submittedResults.length) : 0;

  const examStatusData = [
    { name: 'Passed', value: allResults.filter(r => r.examStatus === 'passed').length },
    { name: 'Pending', value: allResults.filter(r => r.examStatus === 'pending').length },
    { name: 'Failed', value: allResults.filter(r => r.examStatus === 'failed').length },
  ];

  const difficultyData = [
    { name: 'Easy', value: questionsLevel?.easy || 0 },
    { name: 'Medium', value: questionsLevel?.medium || 0 },
    { name: 'Hard', value: questionsLevel?.hard || 0 },
  ];

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Exam Dashboard: {exam.examName}</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <DashboardCard title="Total Students" value={totalStudents} color="blue" />
        <DashboardCard title="Attempted Students" value={attemptedStudents} color="green" />
        <DashboardCard title="Average Marks" value={averageMarks.toFixed(2)} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        <ChartCard title="Question Difficulty">
          <PieChart width={300} height={200}>
            <Pie
              data={difficultyData}
              cx={150}
              cy={100}
              innerRadius={40}
              outerRadius={80}
              label
              dataKey="value"
            >
              {difficultyData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ChartCard>

        <ChartCard title="Exam Status Distribution">
          <PieChart width={300} height={200}>
            <Pie
              data={examStatusData}
              cx={150}
              cy={100}
              outerRadius={80}
              fill="#8884d8"
              label
              dataKey="value"
            >
              {examStatusData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ChartCard>
      </div>

      <ChartCard title="Questions Solved vs Total">
        <BarChart width={500} height={300} data={[
          {
            name: 'Questions',
            Solved: submittedResults.reduce((acc, r) => acc + r.totalQuestionsSolved, 0),
            Total: totalQuestions * attemptedStudents,
          },
        ]}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="Solved" fill="#4CAF50" />
          <Bar dataKey="Total" fill="#2196F3" />
        </BarChart>
      </ChartCard>

      <Dashboard />
    </div>
  );
};

const DashboardCard = ({ title, value, color }) => (
  <div className="bg-white shadow rounded-lg p-5">
    <h3 className={`text-lg font-semibold text-${color}-700`}>{title}</h3>
    <p className={`text-3xl font-bold text-${color}-500`}>{value}</p>
  </div>
);

const ChartCard = ({ title, children }) => (
  <div className="bg-white shadow rounded-lg p-5">
    <h3 className="text-lg font-semibold text-gray-700 mb-4">{title}</h3>
    {children}
  </div>
);

export default DashboardContain;
