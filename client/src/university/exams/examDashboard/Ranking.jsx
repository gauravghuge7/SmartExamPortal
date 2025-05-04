import React, { useEffect, useState } from "react";
import axiosInstance from './../../../services/axiosInstance';
import { useNavigate } from "react-router-dom";

const Ranking = ({ examId }) => {
    const [rankingData, setRankingData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchRanking = async () => {
            try {
                const response = await axiosInstance.get(`/university/exam/getStudentRanking/${examId}`);

                console.log("response :", response);

                const rawData = response.data?.data?.students ?? [];

                const processedData = rawData.map((entry) => {
                    const studentInfo = entry.students?.[0];
                    const resultForExam = studentInfo?.studentResults?.find(
                        res => res.exam === examId
                    );

                    return {
                        studentId: resultForExam?.student,
                        name: studentInfo?.studentName,
                        score: resultForExam?.examScore,
                        email: studentInfo?.studentEmail,
                        phone: studentInfo?.studentPhone,
                    };
                }).filter(student => student.score !== undefined);

                const sortedData = [...processedData].sort((a, b) => b.score - a.score);
                setRankingData(sortedData);
            } catch (err) {
                setError("Failed to fetch rankings.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (examId) fetchRanking();
    }, [examId]);

    const handleViewExam = (studentId) => {
        console.log("View exam for student:", studentId);
        navigate(`/university/exam/student/?studentId=${studentId}&examId=${examId}`);
    };

    if (loading) return <div className="text-gray-500 p-4">Loading rankings...</div>;
    if (error) return <div className="text-red-500 p-4">{error}</div>;
    if (!rankingData.length) return <div className="text-gray-500 p-4">No ranking data available.</div>;

    return (
        <div className="max-w-5xl mx-auto p-6 bg-gradient-to-br from-white to-gray-100 rounded-2xl shadow-lg">
            <h2 className="text-3xl font-semibold text-gray-800 mb-6 border-b pb-2">🏆 Student Rankings</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                    <thead>
                        <tr className="bg-blue-50 text-gray-700">
                            <th className="p-3 border-b">#</th>
                            <th className="p-3 border-b">Name</th>
                            <th className="p-3 border-b">Email</th>
                            <th className="p-3 border-b">Score</th>
                            <th className="p-3 border-b">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rankingData.map((student, index) => (
                            <tr key={student.studentId} className="hover:bg-blue-50 transition">
                                <td className="p-3 border-b font-semibold">{index + 1}</td>
                                <td className="p-3 border-b">{student.name}</td>
                                <td className="p-3 border-b">{student.email}</td>
                                <td className="p-3 border-b text-blue-700 font-medium">{student.score}</td>
                                <td className="p-3 border-b">
                                    <button
                                        onClick={() => handleViewExam(student.studentId)}
                                        className="bg-blue-600 text-white px-4 py-1 rounded-md hover:bg-blue-700 transition text-sm"
                                    >
                                        View Exam
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Ranking;
