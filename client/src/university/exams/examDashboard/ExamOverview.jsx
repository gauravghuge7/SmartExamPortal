import React from "react";

const ExamOverview = ({ examData }) => {
    if (!examData) return <div className="text-gray-500">No exam data available.</div>;

    const {
        examName,
        examDescription,
        examDate,
        examTime,
        examDuration,
        examQualification,
        examType,
        isSubmitted,
        students,
        createdAt,
        updatedAt,
    } = examData;

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-md border">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">{examName}</h2>

            <p className="text-gray-600 mb-6 italic">{examDescription}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
                <div>
                    <span className="font-medium text-gray-800">Date:</span> {new Date(examDate).toLocaleDateString()}
                </div>
                <div>
                    <span className="font-medium text-gray-800">Time:</span> {examTime}
                </div>
                <div>
                    <span className="font-medium text-gray-800">Duration:</span> {examDuration} minutes
                </div>
                <div>
                    <span className="font-medium text-gray-800">Qualification:</span> {examQualification}
                </div>
                <div>
                    <span className="font-medium text-gray-800">Type:</span> {examType}
                </div>
                <div>
                    <span className="font-medium text-gray-800">Submitted:</span>{" "}
                    <span className={isSubmitted ? "text-green-600" : "text-red-600"}>
                       
                    </span>
                </div>
                <div>
                    <span className="font-medium text-gray-800">Student Count:</span> {students?.length}
                </div>
                <div>
                    <span className="font-medium text-gray-800">Created:</span>{" "}
                    {new Date(createdAt).toLocaleString()}
                </div>
                <div>
                    <span className="font-medium text-gray-800">Updated:</span>{" "}
                    {new Date(updatedAt).toLocaleString()}
                </div>
            </div>
        </div>
    );
};

export default ExamOverview;
