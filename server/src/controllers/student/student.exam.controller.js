import mongoose from "mongoose";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/AsyncHandler.js";
import { Exam } from './../../models/exam.model.js';
import { StudentAnswers } from "../../models/student.answers.model.js";
import { Question } from './../../models/question.model.js';
import { emptyFieldValidator } from "../../helper/emptyFieldValidator.js";
import { StudentResult } from "../../models/student.result.model.js";
import { Student } from "../../models/student.model.js";



const getMyExams = asyncHandler(async (req, res, next) => {

    try {
        const { _id } = req.student;


        const studentExams = await Exam.find({
            students: new mongoose.Types.ObjectId(_id),
        })


        const student = await Student.findById(_id);

        // console.log("StudentExams :",studentExams);
        // console.log("student :",student);


        const exams = studentExams.filter(
            exam => !student.exams.includes(exam._id.toString())
        );
        

        // console.log("id :",_id);
        // console.log("exams :",exams);



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
        );
        
    } 
    catch (error) {
        throw new ApiError(500, error.message);
    }
    
})


const getExamDetails = asyncHandler(async (req, res, next) => {

    try {
        const { examId } = req.params;
        const { _id } = req.student;

        console.log("examId :",examId);
        console.log("_id :",_id);
        
        const exam = await Exam.aggregate([
            {
                $match: {
                    $and: [
                        {
                            _id: new mongoose.Types.ObjectId(examId),
                        },
                        {
                            students: new mongoose.Types.ObjectId(_id),
                        }
                    ]
                }
            },


            {
                $lookup: {
                    from: "questions",
                    localField: "_id",
                    foreignField: "exam",
                    as: "questions",
                }
            },

            {
                $addFields: {
                    questions: "$questions"
                }
            },

            {
                $project: {

                    examName: 1,
                    examCode: 1,
                    examDate: 1,
                    examTime: 1,
                    examDuration: 1,
                    duration: 1,
                    startDate: 1,
                    endDate: 1,
                    questions: 1,
                    createdBy: 1,
                    createdAt: 1,
                    updatedBy: 1,
                    updatedAt: 1,
                }
            }
        ])

        const student = await Student.findById(_id);
        student.exams.push(examId);
        await student.save();
        
        const result = await StudentResult.create({
            student: _id, 
            exam: examId,
            examStatus: "pending",
            examScore: 0,
            examMarks: 0,

        })
    
        return res
        .status(200)
        .json(      
            new ApiResponse(
                200, 
                "Exam details retrieved successfully", 
                {
                    exam
                }
            )
        );
        
    } 
    catch (error) {
        throw new ApiError(500, error.message);
    }

})



const submitAnswer = asyncHandler(async (req, res, next) => {
    try {
        const { examId } = req.params;
        const { _id } = req.student;

        const { 
            questionId,
            answerText,
            answerDuration,
        } = req.body;

        // Validate fields
        emptyFieldValidator(answerText, answerDuration);

        // Find question
        const question = await Question.findOne({
            _id: new mongoose.Types.ObjectId(questionId),
            exam: new mongoose.Types.ObjectId(examId),
        });

        if (!question) {
            throw new ApiError(400, "Question not found");
        }

        const isCorrect = question.questionAnswer === answerText;
        const answerScore = isCorrect ? question.questionMarks : 0;

        // Check if answer already exists
        let existedAnswer = await StudentAnswers.findOne({
            student: _id,
            exam: examId,
            question: question._id,
        });

        if (existedAnswer) {
            // Calculate delta score
            const previousScore = existedAnswer.answerMarks || 0;
            const deltaScore = answerScore - previousScore;

            existedAnswer.answerText = answerText;
            existedAnswer.answerDuration = answerDuration;
            existedAnswer.answerMarks = answerScore;
            existedAnswer.isCorrect = isCorrect;
            existedAnswer.isAnswered = true;
            await existedAnswer.save();

            // Update StudentResult
            await StudentResult.findOneAndUpdate(
                { student: _id, exam: examId },
                { $inc: { examScore: deltaScore, totalQuestionsSolved: 0 } }, // optional: update `totalQuestionsSolved`
                { new: true, upsert: true }
            );

            return res.status(200).json(
                new ApiResponse(200, "Question updated successfully", { answer: existedAnswer })
            );
        }

        // If answer doesn't exist, create it
        const answer = await StudentAnswers.create({
            student: _id,
            exam: examId,
            question: question._id,
            answerText,
            answerDuration,
            answerMarks: answerScore,
            isCorrect,
            isAnswered: true,
            answerTime: new Date(),
        });

        // Add to StudentResult or create new
        await StudentResult.findOneAndUpdate(
            { student: _id, exam: examId },
            {
                $inc: { examScore: answerScore, totalQuestionsSolved: 1 },
                $setOnInsert: {
                    examMarks: question.exam.examMarks, // optional if needed
                    examStatus: 'pending',
                    isSubmitted: false,
                }
            },
            { new: true, upsert: true }
        );

        return res.status(200).json(
            new ApiResponse(200, "Question created successfully", { answer })
        );

    } catch (error) {
        throw new ApiError(500, error.message);
    }
});




const submitExam = asyncHandler(async (req, res, next) => {
    try {

        const { examId } = req.params;
        const {_id} = req.student;


        

        const questionAnswers = await StudentAnswers.aggregate([

            /** Match the Fields **/
            {
                $match: {
                    $and: [
                        {
                            student: new mongoose.Types.ObjectId(_id),
                        },
                        {
                            exam: new mongoose.Types.ObjectId(examId),
                        }
                    ]
                }
            },

            
        ])

    
        let totalMarks = 0;
        questionAnswers.map(doc => totalMarks += doc.answerMarks);

        console.log("totalMarks => ", totalMarks);

        // const existedExam = await StudentResult.find({
        //     student: new mongoose.Types.ObjectId(_id),
        //     exam: new mongoose.Types.ObjectId(examId),
        // })

        const existedExam = await StudentResult.findOne({
            student: new mongoose.Types.ObjectId(_id),
            exam: new mongoose.Types.ObjectId(examId),
        });

        if(existedExam) {


            existedExam.examStatus = "passed";
            existedExam.examScore = totalMarks;
            existedExam.examMarks = totalMarks;
            existedExam.totalQuestionsSolved = questionAnswers.length;
            await existedExam.save();

            return res
            .status(200)
            .json(
                new ApiResponse(
                    200, 
                    "Exam submitted successfully", 
                    {
                        answers : existedExam
                    }
                )
            )
        }


        const answers = await StudentExam.create({
            student: new mongoose.Types.ObjectId(_id),
            exam: new mongoose.Types.ObjectId(examId),
            examStatus: "pending",
            examScore: totalMarks,
            examDurationByStudent: 1,
            totalQuestionsSolved : questionAnswers.length
            
        })
        
        return res
        .status(200)
        .json(
            new ApiResponse(
                200, 
                "Exam submitted successfully", 
                {
                    answers
                }
            )
        )
            
    } 
    catch (error) {
        throw new ApiError(500, error.message)
    }
})




// const attemptedExam = asyncHandler(async (req, res, next) => {
//     try {
//         const { _id } = req.student;

//         const exams = await StudentAnswers.aggregate([
//             {
//                 $match: {
//                     student: new mongoose.Types.ObjectId(_id),
//                 }
//             },
//             {
//                 $lookup: {
//                     from: "exams",
//                     localField: "exam",
//                     foreignField: "_id",
//                     as: "examDetails"
//                 }
//             },
//             { $unwind: "$examDetails" },
//             {
//                 $lookup: {
//                     from: "universities",
//                     localField: "examDetails.university",
//                     foreignField: "_id",
//                     as: "universityDetails"
//                 }
//             },
//             { $unwind: "$universityDetails" },
//             {
//                 $group: {
//                     _id: "$exam",
//                     studentScore: { $sum: "$answerMarks" },
//                     totalQuestions: { $sum: 1 },
//                     examName: { $first: "$examDetails.examName" },
//                     examDate: { $first: "$examDetails.examDate" },
//                     examType: { $first: "$examDetails.examType" },
//                     examMarks: { $first: "$examDetails.examMarks" },
//                     universityName: { $first: "$universityDetails.universityName" },
//                     universityEmail: { $first: "$universityDetails.universityEmail" },
//                 }
//             },
//             {
//                 $sort: { examDate: -1 }
//             }
//         ]);

//         return res.status(200).json(
//             new ApiResponse(200, "Exams attempted successfully", { exams })
//         );

//     } catch (error) {
//         throw new ApiError(500, error.message);
//     }
// });

const attemptedExam = asyncHandler(async (req, res, next) => {
    try {
        const { _id } = req.student;

        const exams = await StudentAnswers.aggregate([
            {
                $match: {
                    student: new mongoose.Types.ObjectId(_id),
                }
            },
            {
                $lookup: {
                    from: "questions",
                    localField: "question",
                    foreignField: "_id",
                    as: "questionDetails"
                }
            },
            {
                $unwind: "$questionDetails"
            },
            {
                $lookup: {
                    from: "exams",
                    localField: "questionDetails.exam",
                    foreignField: "_id",
                    as: "examDetails"
                }
            },
            {
                $unwind: "$examDetails"
            },
            {
                $lookup: {
                    from: "universities",
                    localField: "examDetails.university",
                    foreignField: "_id",
                    as: "universityDetails"
                }
            },
            {
                $unwind: "$universityDetails"
            },
            {
                $group: {
                    _id: "$questionDetails.exam",
                    studentScore: { $sum: "$answerMarks" },
                    totalQuestions: { $sum: 1 },
                    examName: { $first: "$examDetails.examName" },
                    examDate: { $first: "$examDetails.examDate" },
                    examType: { $first: "$examDetails.examType" },
                    examMarks: { $first: "$examDetails.examMarks" },
                    universityName: { $first: "$universityDetails.universityName" },
                    universityEmail: { $first: "$universityDetails.universityEmail" },
                }
            },
            {
                $sort: { examDate: -1 }
            }
        ]);


        return res.status(200).json(
            new ApiResponse(200, "Exams attempted successfully", { exams })
        );

    } catch (error) {
        throw new ApiError(500, error.message);
    }
});



const viewExamResult = asyncHandler(async (req, res, next) => {
    try {

        const { examId } = req.params;
        const {_id} = req.student;

        const answerSheet = await StudentExam.aggregate([
            {
                $match: {
                    $and: [
                        {
                            student: new mongoose.Types.ObjectId(_id),
                        },
                        {
                            exam: new mongoose.Types.ObjectId(examId),
                        },
                    ]
                }
            },
            {
                $lookup: {
                    from: "questions",
                    localField: "exam",
                    foreignField: "exam",
                    as: "questions",

                    pipeline: [
                        {
                            $match: {
                                $and: [
                                    {
                                        "$questions.questionAnswer": "answer"
                                    }
                                ]
                            }
                        }
                    ]
                }
            },
        ])



        return res
        .status(200)
        .json(      
        new ApiResponse(
            200, 
            "Exam result viewed successfully", 
            {
                answerSheet
            }
        )
        );
    } 
    catch (error) {
        throw new ApiError(500, error.message);
    }
});

const getStudentDashboard = asyncHandler(async (req, res, next) => {

    try {
        const { _id } = req.student;

        const dashboard = await Exam.aggregate([
            {
                $match: {
                    $and: [
                        {
                            student: new mongoose.Types.ObjectId(_id),
                        },
                    ]
                }
            },
            {
                $lookup: {
                    from: "answers",
                    localField: "_id",
                    foreignField: "exam",
                    as: "answers",

                    pipeline: [
                        {
                            $match: {
                                $and: [
                                    {
                                        "$answers.student": new mongoose.Types.ObjectId(_id),
                                    }
                                ]
                            }
                        },
                        {
                            $project: {
                                answers: 1,
                            }
                        }
                    ]
                }
            },
            {
                $project: {
                    exam: 1,
                    answers: 1,
                }
            }
        ])

        return res
        .status(200)
        .json(      
            new ApiResponse(
                200, 
                "Student dashboard retrieved successfully", 
                {
                    dashboard
                }
            )
        );
    } 
    catch (error) {
        throw new ApiError(500, error.message);
    }

})

// const getExamResult = asyncHandler(async (req, res, next) => {
//     try {

//         const { examId } = req.params;
//         const {_id} = req.student;

//         const answerSheet = await Exam.aggregate([
//             {
//                 $match: {
//                     $and: [
//                         {
//                             student: new mongoose.Types.ObjectId(_id),
//                         },
//                         {
//                             exam: new mongoose.Types.ObjectId(examId),
//                         },
//                     ]
//                 }
//             },
//             {
//                 $lookup: {
//                     from: "studentanswers",
//                     localField: "exam",
//                     foreignField: "exam",
//                     as: "studentanswers",
//                 }
//             },

//             {
//                 $lookup: {
//                     from: "questions",
//                     localField: "exam",
//                     foreignField: "exam",
//                     as: "questions",
//                 }
//             },

//             {
//                 $addFields: {
//                     questions: "$questions",
//                     studentanswers: "$studentanswers"
//                 }
//             },


//             {
//                 $project: {
//                     _id: 1,
//                     student: 1,
//                     exam: 1,

//                     answers: 1,
//                     totalQuestionsSolved: 1,
//                     examStatus: 1,
//                     examScore: 1,
//                     examDurationByStudent: 1,


//                     questions: 1,
//                     studentanswers: 1,

//                 }
//             }
//         ])

//         console.log("answerSheet :",answerSheet);

//         return res
//         .status(200)
//         .json(      
//             new ApiResponse(
//                 200, 
//                 "Exam result viewed successfully", 
//                 {
//                     answerSheet
//                 }
//             )
//         );
//     } 
//     catch (error) {
//         throw new ApiError(500, error.message);
//     }
// }); 

const getExamResult = asyncHandler(async (req, res, next) => {
    try {
        const { examId } = req.params;
        const { _id: studentId } = req.student;

        const result = await StudentResult.aggregate([
            {
                $match: {
                    student: new mongoose.Types.ObjectId(studentId),
                    exam: new mongoose.Types.ObjectId(examId),
                }
            },
            {
                $lookup: {
                    from: "studentanswers",
                    let: { studentId: "$student", examId: "$exam" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$student", "$$studentId"] },
                                        { $eq: ["$exam", "$$examId"] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: "studentAnswers"
                }
            },
            {
                $lookup: {
                    from: "questions",
                    localField: "exam",
                    foreignField: "exam",
                    as: "questions"
                }
            },
            {
                $lookup: {
                    from: "exams",
                    localField: "exam",
                    foreignField: "_id",
                    as: "examInfo"
                }
            },
            {
                $unwind: "$examInfo"
            },
            {
                $project: {
                    _id: 1,
                    examStatus: 1,
                    examScore: 1,
                    examMarks: 1,
                    examDurationByStudent: 1,
                    totalQuestionsSolved: 1,
                    isSubmitted: 1,
                    studentAnswers: 1,
                    questions: 1,
                    examInfo: {
                        examName: 1,
                        examDate: 1,
                        examType: 1,
                        examDuration: 1,
                        examDescription: 1
                    }
                }
            }
        ]);


        console.log("result :", result);

        if (!result || result.length === 0) {
            throw new ApiError(404, "Result not found");
        }

        return res.status(200).json(
            new ApiResponse(200, "Exam result viewed successfully", {
                answerSheet: result[0]
            })
        );
    } catch (error) {
        throw new ApiError(500, error.message);
    }
});



export {
    getMyExams,
    submitExam,
    viewExamResult,
    getExamDetails,
    submitAnswer,
    getExamResult,
    attemptedExam
};