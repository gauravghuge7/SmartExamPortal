// Dashboard.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import InfoCards from './components/InfoCards';
import QuestionInsights from './components/QuestionsInsights';
import MarksHistogram from './components/MarkHistogram';
import StudentPerformanceChart from './components/StudentPerformanceChart';
import TopScorers from './components/TopScorers';
import axiosInstance from './../../../services/axiosInstance';

const Dashboard = () => {
  const { examId } = useParams();
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axiosInstance.get(`/university/exam/getDashboardOfExam/${examId}`);
        setDashboardData(res.data.data);
      } catch (error) {
        console.error('Error fetching dashboard data', error);
      }
    };

    fetchData();
  }, [examId]);

  if (!dashboardData) return <div>Loading...</div>;

  const { questions, students, exam, questionsLevel } = dashboardData;
  const totalQuestions = questions?.length || 0;
  const totalStudents = students?.length || 0;
  const attemptedStudents = dashboardData?.attemptedStudents || 0;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Exam Dashboard</h1>
      <InfoCards
        totalQuestions={totalQuestions}
        totalStudents={totalStudents}
        attemptedStudents={attemptedStudents}
        averageScore={calculateAverageScore(students)}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <QuestionInsights questionsLevel={questionsLevel} />
        <MarksHistogram students={students} />
      </div>
      <div className="mt-6">
        <StudentPerformanceChart students={students} />
      </div>
      <div className="mt-6">
        <TopScorers students={students} />
      </div>
    </div>
  );
};

function calculateAverageScore(students) {
  const scores = students.flatMap(s =>
    s.students.flatMap(st => st.studentResults.map(r => r.examScore))
  );
  if (!scores.length) return 0;
  return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2);
}

export default Dashboard;
