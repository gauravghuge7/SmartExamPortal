import { emptyFieldValidator } from "../../helper/emptyFieldValidator.js";
import { Exam } from "../../models/exam.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/AsyncHandler.js";
import { Question } from './../../models/question.model.js';
import mongoose from "mongoose";
import { Student } from './../../models/student.model.js';
import { University } from "../../models/university.model.js";
import { GoogleGenerativeAI } from '@google/generative-ai';
import { StudentResult } from "../../models/student.result.model.js";


const createExam = asyncHandler( async (req, res, next) => {

    try {

        const {
            examName,
            examDate,
            examTime,
            examDuration,
            examQualification,
            examType,
            examDescription,

        } = req.body;
        

        emptyFieldValidator(
            examName,
            examDate,
            examTime,
            examDuration,
            examType,
            examDescription
        )

        const validateExam = await Exam.findOne({
            $or: [
                {examName: examName},
            ],

            $and: [
                {examDate: examDate},
                {examTime: examTime},
            ]
        });

        if(validateExam) {
            throw new ApiError(400, "Exam already exists at this date and time");
        }

        const exam = await Exam.create({

            university: req.university._id,
            examName,
            examDate,
            examTime,
            examDuration,
            examQualification,
            examType,
            examDescription,
        })
    

        return res 
        .status(200)
        .json(
            new ApiResponse(
                201, 
                "Exam created successfully", 
                {
                    exam
                }
            )
        )
        
    } 
    catch (error) {
        throw new ApiError(500, error.message)
    }

})


const addQuestions = asyncHandler (async (req, res, next) => {

    try {

        const {
            exam,
            questionTitle,
            questionDescription,
            questionType,
            questionOptions,
            questionAnswer,
            questionMarks,
            questionLevel,
        } = req.body;

        console.log("body :", req.body);

        emptyFieldValidator(
            questionTitle,
            questionDescription,
            questionType,
            questionOptions,
            questionAnswer,
            questionMarks,
            questionLevel
        )

        const validateQuestion = await Question.findOne({
            $or: [
                {questionTitle: questionTitle},
            ],
        });

        if(validateQuestion) {
            throw new ApiError(400, "Question already exists");
        }

        const question = await Question.create({
            exam,
            questionTitle,
            questionDescription,
            questionType,
            questionOptions,
            questionAnswer,
            questionMarks,
            questionLevel,
        })
    

        return res 
        .status(200)
        .json(
            new ApiResponse(
                201, 
                "Question created successfully", 
                {
                    question
                }
            )
        )

        
    } 
    catch (error) {
        throw new ApiError(500, error.message)
    }

})


const removeQuestion = asyncHandler( async (req, res, next) => {    
    try {
        const { questionId } = req.params;

        console.log("questionId :", questionId);

        if(!questionId) {
            throw new ApiError(400, "questionId is required");
        }

        const question = await Question.findByIdAndDelete(questionId);

        if(!question) {
            throw new ApiError(400, "Question not found");
        }

        return res
        .status(200)
        .json(
            new ApiResponse(
                200, 
                "Question removed successfully", 
                {
                    question
                }
            )
        )

    } catch(error) {
        throw new ApiError(500, error.message)
    }

})

const getAllExams = asyncHandler( async (req, res, next) => {
    try {
        
        const { university } = req;
        
        const exams = await Exam.find({
            university: university._id
        })
        
        return res
        .status(200)
        .json(
            new ApiResponse(
                200, 
                "Exams retrieved successfully", 
                {
                    exams
                }
            )
        )
        
    } 
    catch (error) {
        throw new ApiError(500, error.message)
    }
})


const getExamDetails = asyncHandler( async (req, res, next) => {
    try {
        
        const { examId } = req.params;
        
        const examDetails = await Exam.findById(examId);
        
        return res
        .status(200)
        .json(
            new ApiResponse(
                200, 
                "Exam details retrieved successfully", 
                {
                    examDetails
                }
            )
        )
        
    } 
    catch (error) {
        throw new ApiError(500, error.message)
    }
})

const assignExam = asyncHandler( async (req, res, next) => {

    try {

        const { examId } = req.params;
        const { studentIds } = req.body;
        const students = studentIds;
    
        const exam = await Exam.findById(examId);
        
        if(!exam) {
            throw new ApiError(404, "Exam not found");
        }

        exam.students.push(...students);

        await exam.save();

        return res
        .status(200)
        .json(
            new ApiResponse(
                200, 
                "Exam assigned successfully", 
                {
                    exam
                }
            )
        )
        
    } 
    catch (error) {
        throw new ApiError(500, error.message)
    }

})


const getOldQuestions = asyncHandler( async (req, res, next) => {
    try {
        
        const { examId } = req.params;

        if(!examId) {
            throw new ApiError(400, "examId is required");
        }

        const questions = await Question.find({ exam: examId });

        return res
            .status(200)
            .json(
                new ApiResponse(200, "Questions retrieved successfully", {
                    questions
                })
            )
    } catch (error) {
        return next(error);
    }
})


const getExamDashboard = asyncHandler( async (req, res, next) => {
    try {
        
        const { _id } = req.university;
        const {examId } = req.params;

        console.log(examId)
        
        const exam = await Exam.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(examId),
                }
            },

            {
                $lookup: {

                    from: "questions",
                    localField: "_id",
                    foreignField: "exam",
                    as: "questions"
                }
            },

            {
                $lookup: {
                    from: "students",
                    foreignField: "_id",
                    localField: "students",
                    as: "students"
                }
            },

            {
                $addFields: {
                    students: "$students",
                    questions: "$questions"
                }
            },
            {
                $project: {
                    _id: 0,
                    examName: 1,
                    examDate: 1,
                    examTime: 1,
                    examQualification: 1,
                    examType: 1,
                    examDuration: 1,
                    examDescription: 1,
                    students: 1,
                    questions: 1,
                }
            }
        ])
        
        

        
        return res
        .status(200)
        .json(
            new ApiResponse(
                200, 
                "Questions retrieved successfully", 
                {
                    exam
                }   
            )
        )
  
    } 
    catch (error) {
        throw new ApiError(500, error.message)
    }
})


const getStudentsParticipatingExam = asyncHandler(async (req, res, next) => {
    try {
        const { examId } = req.params;
        const exam = await Exam.findById(examId);
        
        if(!exam) {
            throw new ApiError(404, "Exam not found");
        }
        
        const students = await Exam.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(examId),
                }
            },

            {
                $lookup: {
                    from: "students",
                    localField: "students",
                    foreignField: "_id",
                    as: "students",

                    pipeline: [
                        {
                            $lookup: {
                                from: "studentresults",
                                foreignField: "student",
                                localField: "_id",
                                as: "studentResults"
                            }
                        }, 
                        {
                            $addFields: {
                                studentResults: "$studentResults",
                            }
                        }
                    ]
                }
            }, 

            {
                $project: {
                    _id: 0,
                    examName: 1,
                    examDate: 1,
                    examTime: 1,
                    examQualification: 1,
                    examResults: 1,
                    students: {
                        _id : 1,
                        studentName : 1,
                        studentEmail : 1,
                        studentPhone : 1,
                        studentAddress : 1,
                        studentResults: 1,
                        
                    }
                }
            }
        ])
        
        return res
        .status(200)
        .json(
            new ApiResponse(
                200, 
                "Students retrieved successfully", 
                {
                    students
                }
            )
        )     
        
    }
    catch (error) {
        throw new ApiError(500, error.message)
    }

})


const getDashboardOfExam = asyncHandler( async (req, res, next) => {
    try {

        const { examId } = req.params;
        
        const exam = await Exam.findById(examId);
        
        if(!exam) {
            throw new ApiError(404, "Exam not found");
        }

        const students = await Exam.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(examId),
                }
            },

            {
                $lookup: {
                    from: "students",
                    localField: "students",
                    foreignField: "_id",
                    as: "students",

                    pipeline: [
                        {
                            $lookup: {
                                from: "studentresults",
                                foreignField: "student",
                                localField: "_id",
                                as: "studentResults"
                            }
                        }, 
                        {
                            $addFields: {
                                studentResults: "$studentResults",
                            }
                        }
                    ]
                }
            }, 

            {
                $project: {
                    _id: 0,
                    examName: 1,
                    examDate: 1,
                    examTime: 1,
                    examQualification: 1,
                    examResults: 1,
                    students: {
                        _id : 1,
                        studentName : 1,
                        studentEmail : 1,
                        studentPhone : 1,
                        studentAddress : 1,
                        studentResults: 1,
                        
                    }
                }
            }
        ])

        const attemptedStudents = await Student.countDocuments({ exams: examId });
        const totalStudents = await Student.countDocuments();

        const questions = await Question.find({ exam: examId });
        
        let easyQuestions = 0;
        let mediumQuestions = 0;
        let hardQuestions = 0;

        questions.forEach(question => {
            if(question.questionLevel === "Easy") {
                easyQuestions++;
            }
            else if(question.questionLevel === "Medium") {
                mediumQuestions++;
            }
            else if(question.questionLevel === "Hard") {
                hardQuestions++;
            }
        });




        return res
        .status(200)
        .json(
            new ApiResponse(
                200, 
                "Exam dashboard retrieved successfully", 
                {
                    exam,
                    students,
                    attemptedStudents,
                    totalStudents,
                    questionsLevel: {
                        easy: easyQuestions,
                        medium: mediumQuestions,
                        hard: hardQuestions,
                        totalQuestionss: questions.length
                    },
                    questions,


                }
            )
        )
    } 
    catch (error) {
        throw new ApiError(500, error.message)
    }
})



const getUniversityDashboard = asyncHandler(async (req, res, next) => {
    try {
        const universityId = req.university?._id; // Assuming you're getting this from auth middleware

        const dashboardData = await University.aggregate([
            // Match specific university if ID is provided
            universityId ? { $match: { _id: universityId } } : { $match: {} },
            
            // Lookup exams for this university
            {
                $lookup: {
                    from: 'exams',
                    localField: '_id',
                    foreignField: 'university',
                    as: 'exams'
                }
            },
            
            // Lookup students
            {
                $lookup: {
                    from: 'students',
                    localField: '_id',
                    foreignField: 'exams.students', // This might need adjustment based on your data structure
                    as: 'students'
                }
            },
            
            // Project the fields we want
            {
                $project: {
                    universityName: 1,
                    universityEmail: 1,
                    universityPhone: 1,
                    universityAddress: 1,
                    totalExams: { $size: '$exams' },
                    totalStudents: { $size: '$students' },
                    // Exam statistics
                    examStats: {
                        upcomingExams: {
                            $size: {
                                $filter: {
                                    input: '$exams',
                                    cond: { $gt: ['$examDate', new Date()] }
                                }
                            }
                        },
                        completedExams: {
                            $size: {
                                $filter: {
                                    input: '$exams',
                                    cond: { $lt: ['$examDate', new Date()] }
                                }
                            }
                        },
                        examTypes: {
                            $arrayToObject: {
                                $map: {
                                    input: { $setUnion: ['$exams.examType'] },
                                    in: [
                                        '$$this',
                                        {
                                            $size: {
                                                $filter: {
                                                    input: '$exams',
                                                    cond: { $eq: ['$$this', '$$ROOT.examType'] }
                                                }
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    },
                    // Student performance overview
                    studentPerformance: {
                        $cond: {
                            if: { $gt: [{ $size: '$exams' }, 0] },
                            then: {
                                averageScore: {
                                    $avg: '$exams.students.examScore' // This might need adjustment
                                },
                                passRate: {
                                    $multiply: [
                                        {
                                            $divide: [
                                                {
                                                    $size: {
                                                        $filter: {
                                                            input: '$exams',
                                                            cond: { $eq: ['$$this.examStatus', 'passed'] }
                                                        }
                                                    }
                                                },
                                                { $size: '$exams' }
                                            ]
                                        },
                                        100
                                    ]
                                }
                            },
                            else: null
                        }
                    }
                }
            }
        ]);

        // Add additional aggregations for more detailed statistics
        const examPerformance = await Exam.aggregate([
            { $match: { university: universityId } },
            {
                $group: {
                    _id: '$examType',
                    avgDuration: { $avg: '$examDuration' },
                    avgMarks: { $avg: '$examMarks' },
                    totalQuestions: { $sum: 1 }
                }
            }
        ]);

        const studentStats = await StudentExam.aggregate([
            { $match: { 'exam.university': universityId } },
            {
                $group: {
                    _id: '$examStatus',
                    count: { $sum: 1 },
                    avgScore: { $avg: '$examScore' },
                    avgDuration: { $avg: '$examDurationByStudent' }
                }
            }
        ]);

        return res.status(200).json(
            new ApiResponse(
                200,
                "Dashboard fetched successfully",
                {
                    universityDetails: dashboardData[0] || {},
                    examPerformance,
                    studentStats
                }
            )
        );
    } catch (error) {
        throw new ApiError(500, error.message || "Error fetching dashboard data");
    }
});

const getAllStudents = asyncHandler(async (req, res, next) => {
    try {

        const students = await Student.find();

        return res
        .status(200)
        .json(
            new ApiResponse(
                200, 
                "Students retrieved successfully", 
                {
                    students
                }
            )
        )
        
    } 
    catch (error) {
        throw new ApiError(500, error.message)
    }
})


const getExamsOfStudent = asyncHandler(async (req, res, next) => {
    try {

        
        const { studentId } = req.params;

        const exams = await Exam.find({ students: studentId });
        
        return res
        .status(200)
        .json(
            new ApiResponse(
                200, 
                "Exams retrieved successfully", 
                {
                    exams
                }
            )
        )
        
    } 
    catch (error) {
        throw new ApiError(500, error.message)
    }
})



const genAI = new GoogleGenerativeAI("AIzaSyDEGudfuHZHpbQI94GGHWzoeEfVIvhbf0M");

const getAiDescription = asyncHandler(async (req, res) => {
    try {
        // Extract inputText from request body
        const { inputText , type } = req.body;

        // Validate input
        if (!inputText || typeof inputText !== 'string') {
            return res.status(400).json({
                status: 'error',
                message: 'Input text is required and must be a string'
            });
        }


        // Get the generative model
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        // Define the prompt
        let prompt = `Create a description for the question ${inputText} in 10 to 15 words`;

        if(type === "OA") {
            prompt = `Create a description for a coding question  (${inputText}) in details in 40 to 50 words`
        }

        // Generate content
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const description = response.text();

        // Send successful response
        res.status(200).json({
            status: 'success',
            data: {
                description: description.trim()
            }
        });

    } 
    catch(error) {
        throw new ApiError(500, error.message || "Error in getting AI Suggestions");
    }

});


const getStudent = asyncHandler(async (req, res) => {
    try {
        const { studentId } = req.params;

        const student = await Student.findById(studentId);
        
        console.log("studentId :", studentId);
        console.log("student :", student);

        return res.status(200).json({
            status: 'success',
            data: {
                student
            }
        });
    } catch(error) {
        throw new ApiError(500, error.message || "Error in getting student details");
    }

});


// in this function we want to get all the exams that a student has taken
const getStudentExamDetails = asyncHandler(async (req, res) => {
    try {
        const { studentId } = req.params;

        // Validate studentId
        if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
            throw new ApiError(400, "Invalid student ID");
        }

        // Fetch all exams where the student is listed in the students array
        const exams = await Exam.find({ students: studentId })
            .populate({
                path: 'university',
                select: 'universityName universityEmail' // Adjust fields as per your University schema
            })
            .lean(); // Use lean() for better performance (returns plain JS objects)

        if (!exams || exams.length === 0) {
            return res.status(200).json({
                statusCode: 200,
                data: {
                    exams: [],
                    message: "No exams found for this student"
                },
                success: true
            });
        }

        // Fetch questions for each exam
        const examIds = exams.map(exam => exam._id);
        const questions = await Question.find({ exam: { $in: examIds } })
            .lean();

        // Organize questions by exam
        const examDetails = exams.map(exam => {
            const examQuestions = questions.filter(q => q.exam.toString() === exam._id.toString());
            return {
                ...exam,
                questions: examQuestions
            };
        });

        // Response
        res.status(200).json({
            statusCode: 200,
            data: {
                exams: examDetails,
                totalExams: examDetails.length,
                studentId
            },
            success: true
        });

    } catch (error) {
        throw new ApiError(500, error.message || "Error in getting student exam details");
    }
});


export {
    createExam,
    addQuestions,
    getAllExams,
    getOldQuestions,
    removeQuestion,
    getExamDetails,
    getExamDashboard,
    assignExam,
    getAllStudents,
    getUniversityDashboard,
    getAiDescription,
    getStudent,
    getStudentExamDetails,
    getStudentsParticipatingExam, 
    getDashboardOfExam
}