const path = require("path");
const express = require("express");
const dotenv = require("dotenv");
// const morgan  = require('morgan')
const connectDB = require("./config/db");
const cookieParser = require("cookie-parser");
const errorHandler = require("./middleware/error");
const app = express();
const session = require("express-session");

//Route Files
const activitiesPost = require("./routes/activityPost");
const auth = require("./routes/auth");
const friends = require("./routes/friends");
const comment = require("./routes/comments");

// //Body Parser
app.use(express.json());

// // Cookie Parser
app.use(cookieParser());

//Load the env variables
dotenv.config({ path: "./config/config.env" });

// Connect to database
connectDB();

// //Dev Logging middleware
// if(process.env.NODE_ENV==='development'){
//     app.use(morgan('dev'))
// }

//express-sessions
app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: false,
  })
);

//Set static folder
app.use(express.static(path.join(__dirname, "public")));

//Mount Routes
app.use("/api/v1/postactivity", activitiesPost);
app.use("/api/v1/comment", comment);
app.use("/api/v1/friends", friends);
app.use("/api/v1/auth", auth);

//Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 9000;

const server = app.listen(
  PORT,
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
);

// handle Unhandled Promise rejections

process.on("unhandleRejection", (err, promise) => {
  console.log(`Error ${err.message}`.red);
  //close server and exit process
  server.close(() => process.exit(1));
});
