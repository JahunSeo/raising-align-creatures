const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, "../.env") });

const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const morgan = require("morgan");
const app = express();
const mysql = require("mysql");
/* log in middleware */
const bodyParser = require("body-parser");
const compression = require("compression");
const helmet = require("helmet");
const session = require("express-session");
const FileStore = require("session-file-store")(session);
const fs = require("fs");
const flash = require("connect-flash");
const schedule = require("node-schedule");

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "localhost:3000");
  res.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS, DELETE");
  next();
});

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  multipleStatements: true,
});
connection.connect();

/**/
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);

app.use(compression());
app.use(helmet());
app.use(
  session({
    secret: "asadlfkj!@#!@#dfgasdg",
    resave: false,
    saveUninitialized: true,
    store: new FileStore(),
    cookie: { maxAge: 30000, secure: false, httpOnly: false },
  })
);

app.use(cors());
app.use(flash()); // 반드시 session 다음에
const passport = require("./lib/passport")(app, connection);
const userRouter = require("./routes/user.js")(passport, connection);
const challengeRouter = require("./routes/challenge.js")(connection);
const alienRouter = require("./routes/alien.js")(connection);
app.use("/api/user", userRouter);
app.use("/api/challenge", challengeRouter);
app.use("/api/alien", alienRouter);
/*************/

app.use(express.json()); // middleware for parsing application/json
app.use(express.urlencoded({ extended: false })); // middleware for parsing application/x-www-form-urlencoded
app.use(cookieParser()); // middleware for parsing cookie
app.use(morgan("dev")); // middleware for logging HTTP request

/************************************/
var isOwner = (req, res) => {
  if (req.user) {
    return true;
  } else {
    return false;
  }
};

/***********/

// 생명체 사망 api and 졸업 api
const j = schedule.scheduleJob({ hour: 00, minute: 00 }, function () {
  let today = new Date();
  let day = today.getDay();
  console.log(day);
  connection.query(
    "INSERT INTO Alien_dead SELECT * FROM Alien where week_auth_cnt < total_auth_cnt AND (auth_day = 7 OR auth_day = ?)",
    [day],
    function (err, results) {
      if (err) {
        console.error(err);
      }
      console.log("success insert dead_alien!!!!!!!!!", results);
    }
  );
  connection.query(
    "INSERT INTO dead_authentification SELECT Authentification.id, Authentification.user_info_id, Alien_id, Authentification.Challenge_id, requestDate, responseDate, requestUserNickname, responseUserNickname, isAuth, imgURL FROM Authentification LEFT JOIN Alien ON Alien.id = Authentification.Alien_id where week_auth_cnt < total_auth_cnt AND (auth_day = 7 OR auth_day = ?)",
    [day],
    function (err, results) {
      if (err) {
        console.error(err);
      }
      console.log("success insert dead_authentification!!!!!!!!!", results);
    }
  );
  connection.query(
    "DELETE FROM Authentification USING Alien LEFT JOIN Authentification ON Alien.id = Authentification.Alien_id where week_auth_cnt < total_auth_cnt AND (auth_day = 7 OR auth_day = ?)",
    [day],
    function (err, results) {
      if (err) {
        console.error(err);
      }
      console.log("success delete authentification!!!!!!!!!", results);
    }
  );
  connection.query(
    "DELETE FROM Alien where week_auth_cnt < total_auth_cnt AND (auth_day = 7 OR auth_day = ?)",
    [day],
    function (err, results) {
      if (err) {
        console.error(err);
      }
      console.log("success delete Alien!!!!!!!!!", results);
    }
  );
  connection.query(
    "UPDATE Alien SET week_auth_cnt = 0 where auth_day = 7 OR auth_day = ?",
    [day],
    function (err, results) {
      if (err) {
        console.error(err);
      }
      console.log("success update Alien!!!!!!!!!", results);
    }
  );

  // 졸업 API
  connection.query(
    "INSERT INTO Alien_graduated SELECT * FROM Alien where graduate_toggle = 1 AND (auth_day = 7 OR auth_day = ?)",
    [day],
    function (err, results) {
      if (err) {
        console.error(err);
      }
      console.log("success insert graduated_alien!!!!!!!!!", results);
    }
  );
  connection.query(
    "INSERT INTO graduated_authentification SELECT Authentification.id, Authentification.user_info_id, Alien_id, Authentification.Challenge_id, requestDate, responseDate, requestUserNickname, responseUserNickname, isAuth, imgURL FROM Authentification LEFT JOIN Alien ON Alien.id = Authentification.Alien_id where graduate_toggle = 1 AND (auth_day = 7 OR auth_day = ?)",
    [day],
    function (err, results) {
      if (err) {
        console.error(err);
      }
      console.log(
        "success insert graduated_authentification!!!!!!!!!",
        results
      );
    }
  );
  connection.query(
    "DELETE FROM Authentification USING Alien LEFT JOIN Authentification ON Alien.id = Authentification.Alien_id where graduate_toggle = 1 AND (auth_day = 7 OR auth_day = ?)",
    [day],
    function (err, results) {
      if (err) {
        console.error(err);
      }
      console.log("success delete authentification!!!!!!!!!", results);
    }
  );
  connection.query(
    "DELETE FROM Alien where graduate_toggle = 1 AND (auth_day = 7 OR auth_day = ?)",
    [day],
    function (err, results) {
      if (err) {
        console.error(err);
      }
      console.log("success delete Alien!!!!!!!!!", results);
    }
  );
});

/***********/

// GET test
app.get("/api/test", (req, res) => {
  connection.query("SELECT * FROM topic", function (error, results, fields) {
    if (error) {
      console.log(error);
    }
    res.status(200).json({
      msg: "(API TEST GET) Hello, Alien!",
      body: Math.random(),
      data: results,
    });
  });
});

// PUT test with params
app.put("/api/test/:dummy_id", (req, res) => {
  res.status(200).json({
    msg: `(API TEST PUT) You sent params '${JSON.stringify(
      req.params
    )}' and body '${JSON.stringify(req.body)}'`,
    params: req.params,
    body: req.body,
  });
});

// POST test
app.post("/api/test", (req, res) => {
  res.status(200).json({
    msg: `(API TEST POST) You sent post data '${JSON.stringify(req.body)}'`,
    body: req.body,
  });
});

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`** Raising Alien Creatures Web Server **`);
  console.log(`App listening on port ${port}`);
  console.log(`DB_NAME: ${process.env.DB_NAME}`);
});