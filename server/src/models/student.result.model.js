
import { Schema, model } from 'mongoose';

const studentResultSchmea = new Schema({

    student: {
        type: Schema.Types.ObjectId,
        ref: "Student",
        required: true,
    },
    
    exam: {
        type: Schema.Types.ObjectId,
        ref: "Exam",
        required: true,
    },
    

    examStatus: {
        type: String,
        enum: ["pending", "passed", "failed"]
    },

    examScore: {
        type: Number,
    },

    examMarks: {
        type: Number,
        // required: true,
    },

    examDurationByStudent: {
        type: Number,
    },

    totalQuestionsSolved: {
        type: Number,
        default: 0,
    },

    isSubmitted: {
        type: Boolean,
        default: false,
    }
    
})


export const StudentResult = model('StudentResult', studentResultSchmea);