import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const UserInteractions = ({ examId }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`/api/exam/${examId}/user-interactions`);
                // Mock data structure if API response is unavailable
                const mockData = {
                    totalUsers: 1000,
                    attempted: 750,
                    notAttempted: 250,
                    uniqueCountries: 45,
                    avgAttemptsPerUser: 1.8,
                    completionRate: 65
                };
                setData(response.data || mockData);
            } catch (err) {
                setError('Failed to fetch data');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [examId]);

    const chartData = {
        labels: ['Attempted', 'Not Attempted'],
        datasets: [
            {
                data: data ? [data.attempted, data.notAttempted] : [0, 0],
                backgroundColor: ['#3B82F6', '#EF4444'],
                borderColor: ['#FFFFFF'],
                borderWidth: 2,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: '#1F2937',
                    font: {
                        size: 14,
                    },
                },
            },
            title: {
                display: true,
                text: 'User Attempt Distribution',
                color: '#1F2937',
                font: {
                    size: 18,
                },
            },
        },
    };

    if (loading) return <div className="text-center py-10">Loading...</div>;
    if (error) return <div className="text-center py-10 text-red-500">{error}</div>;

    return (
        <div className="container mx-auto p-6 bg-gray-100 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Exam Analytics Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-gray-700">Total Users</h2>
                    <p className="text-3xl font-bold text-blue-600">{data.totalUsers}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-gray-700">Unique Countries</h2>
                    <p className="text-3xl font-bold text-green-600">{data.uniqueCountries}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-gray-700">Completion Rate</h2>
                    <p className="text-3xl font-bold text-purple-600">{data.completionRate}%</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md mb-8 max-w-2xl mx-auto">
                <Pie data={chartData} options={chartOptions} />
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Insights</h2>
                <ul className="list-disc pl-5 space-y-2 text-gray-600">
                    <li>Average attempts per user: {data.avgAttemptsPerUser}</li>
                    <li>{((data.attempted / data.totalUsers) * 100).toFixed(1)}% of users attempted the exam</li>
                    <li>Users from {data.uniqueCountries} different countries participated</li>
                    <li>Completion rate is {data.completionRate}% indicating strong engagement</li>
                </ul>
            </div>
        </div>
    );
};

export default UserInteractions;