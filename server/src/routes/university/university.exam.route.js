import { Router } from "express";
import { addQuestions, assignExam, createExam, getAllExams, getAllStudents, getExamDashboard, getOldQuestions, getUniversityDashboard, removeQuestion, getAiDescription, getStudent , getStudentExamDetails, getExamDetails, getStudentsParticipatingExam, getDashboardOfExam } from "../../controllers/university/university.exam.controller.js";
import { upload } from "../../middlewares/multer.middleware.js";
import { isUniversityLogin } from "../../middlewares/university.middleware.js";


const examRouter = Router();


examRouter.route("/create")
.post(
    isUniversityLogin,
    upload.none(),
    createExam
)

examRouter.route("/addQuestions")
.post(
    isUniversityLogin,
    upload.none(),
    addQuestions
)   

examRouter.route("/getAllExams")
.get(
    isUniversityLogin,
    upload.none(),
    getAllExams
)

examRouter.route("/getExamDetails/:examId")
.get(
    isUniversityLogin,
    upload.none(),
    getExamDetails
)

examRouter.route("/getStudentRanking/:examId")
.get(
    isUniversityLogin,
    upload.none(),
    getStudentsParticipatingExam
)

examRouter.route("/getDashboardOfExam/:examId")
.get(
    isUniversityLogin,
    upload.none(),
    getDashboardOfExam
)

examRouter.route("/getExamDashboard/:examId")
.get(
    isUniversityLogin,
    upload.none(),
    getExamDashboard
)



examRouter.route("/getOldQuestions/:examId")
.get(
    isUniversityLogin,
    getOldQuestions
)


examRouter.route("/removeQuestion/:questionId")
.delete(
    isUniversityLogin,
    removeQuestion
)


examRouter.route("/getAllStudents")
.get(
    isUniversityLogin,
    getAllStudents
)


examRouter.route("/assignExam/:examId")
.post(
    isUniversityLogin,
    upload.none(),
    assignExam
)

examRouter.route("/getUniversityDashboard")
.get(
    isUniversityLogin,
    getUniversityDashboard
)



examRouter.route("/generate-description")
.post(
    isUniversityLogin,
    getAiDescription
)


// get a student by id
examRouter.route("/getStudent/:studentId")
.get(
    isUniversityLogin,
    getStudent
)


examRouter.route("/student/:studentId/exams")
.get(
    isUniversityLogin,
    getStudentExamDetails
)

export default examRouter;