const db = require("./api");
const userdb = require("./user");
const morgan = require("morgan");
const winston = require("./winston");
const studentsRouter = require("./school/students.router");
const teachersRouter = require("./school/teachers.router");
const classroomsRouter = require("./school/classrooms.router");
const classroomSessionsRouter = require("./school/classroom-sessions.router");
const scheduleRouter = require("./school/schedule.router");
const examsRouter = require("./school/exams.router");
const onlineExamsRouter = require("./school/online-exams.router");
const subjectsRouter = require("./school/subjects.router");
const feesRouter = require("./school/fees.router");
const staffRouter = require("./school/staff.router");
const transportsRouter = require("./school/transports.router");
const teacherLeavesRouter = require("./school/teacher-leaves.router");
const hostelRouter = require("./school/hostel.router");
const portalRouter = require("./school/portal.router");
const timetableRouter = require("./school/timetable.router");
const settingsRouter = require("./school/settings.router");
const salaryRouter = require("./school/salary.router");
const syllabusRouter = require("./school/syllabus.router");
const holidaysRouter = require("./school/holidays.router");
const paymentsRouter = require("./school/payments.router");
const whatsappRouter = require("./school/whatsapp.router");
const reportsRouter = require("./school/reports.router");

const multer = require('multer');
const storage = multer.diskStorage({
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Keep original file name
  }
});
const upload = multer({ storage: storage });

module.exports = function (app) {
  app.use(morgan("combined", { stream: winston.stream }));

  app.all("/", function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT,DELETE");
    res.header(
      "Access-Control-Allow-Headers",
      "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers"
    );
    next();
  });

  app.post("/api/login", userdb.login);
  app.use("/api", timetableRouter);
  app.use("/api/school", timetableRouter);
  app.use("/api/school/students", studentsRouter);
  app.use("/api/students", studentsRouter);
  app.use("/api/school/teachers", teachersRouter);
  app.use("/api/teachers", teachersRouter);
  app.use("/api/school/classrooms", classroomsRouter);
  app.use("/api/classrooms", classroomsRouter);
  app.use("/api/school/classroom-sessions", classroomSessionsRouter);
  app.use("/api/classroom-sessions", classroomSessionsRouter);
  app.use("/api/school/schedules", scheduleRouter);
  app.use("/api/class-schedules", scheduleRouter);
  app.use("/api/school/subjects", subjectsRouter);
  app.use("/api/subjects", subjectsRouter);
  app.use("/api/school/exams", examsRouter);
  app.use("/api/exams", examsRouter);
  app.use("/api/school/online-exams", onlineExamsRouter);
  app.use("/api/online-exams", onlineExamsRouter);
  app.use("/api/school/fees", feesRouter);
  app.use("/api/fees", feesRouter);
  app.use("/api/school/staff", staffRouter);
  app.use("/api/staff", staffRouter);
  app.use("/api/school/transports", transportsRouter);
  app.use("/api/transports", transportsRouter);
  app.use("/api/school/teacher-leaves", teacherLeavesRouter);
  app.use("/api/teacher-leaves", teacherLeavesRouter);
  app.use("/api/school/hostel", hostelRouter);
  app.use("/api/hostel", hostelRouter);
  app.use("/api/school/portal", db.checkToken, portalRouter);
  app.use("/api/portal", db.checkToken, portalRouter);
  app.use("/api/school/settings", settingsRouter);
  app.use("/api/settings", settingsRouter);
  app.use("/api/school/holidays", holidaysRouter);
  app.use("/api/holidays", holidaysRouter);
  app.use("/api/school/payments", paymentsRouter);
  app.use("/api/payments", paymentsRouter);
  app.use("/api/school/whatsapp", whatsappRouter);
  app.use("/api/whatsapp", whatsappRouter);
  app.use("/api/school/reports", reportsRouter);
  app.use("/api/reports", reportsRouter);
  app.use("/api/school/salaries", salaryRouter);
  app.use("/api/salaries", salaryRouter);
  app.use("/api/school/syllabus", syllabusRouter);
  app.use("/api/syllabus", syllabusRouter);

};
