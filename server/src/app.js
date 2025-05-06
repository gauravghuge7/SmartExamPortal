import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { ApiError } from './utils/ApiError.js';
import { asyncHandler } from './utils/AsyncHandler.js';
import connectRouter from './routes/connect.router.js';

const app = express();


app.use(morgan('dev'));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



const allowedOrigins = process.env.CLIENT_URL;


app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Accept",
    "Origin",
    "X-Requested-With",
    "Access-Control-Allow-Origin",
    "Access-Control-Allow-Credentials",
    "Access-Control-Allow-Methods",
    "Access-Control-Allow-Headers"
  ],
  exposedHeaders: [
    "Content-Type",
    "Authorization",
    "Access-Control-Allow-Origin",
    "Access-Control-Allow-Credentials",
    "Access-Control-Allow-Methods",
    "Access-Control-Allow-Headers"
  ],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));



// Handle preflight requests for all routes
app.options('*', cors()); // Automatically handles preflight requests


app.get('/', (req, res) => {

    return res
    .send('Hello World! from our server ');
});


app.get('/health', asyncHandler( async (req, res) => {
    
    return res
    .status(200)
    .send('Server is health is good now you can check any routes');
}));



app.use("/api/v1", connectRouter);


app.use("*", asyncHandler( async (req, res) => {
    throw new ApiError(404, "this path is not available on server")
}));


export default app;