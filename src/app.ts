import "dotenv/config";
import express from "express";
import session from "express-session";
import passport from "passport";
import morgan from "morgan";
import cors from "cors";
import {config} from "./config";
import routes from "./route/v1";
import { connectToDatabase } from "./lib/database";
import { verifyAPI } from "./middleware/core";

declare global {
  // eslint-disable-next-line no-var
  var router: import("express").Router;
  var catchAsync: any;
  var getId: any;
  var statusCodeMap: any;
  var formatResponse: any;
  var handleResponse: any;
  var httpStatus: typeof import("http-status");
}

const app = express();

app.use(cors());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
  next();
});

app.use(
  session({
    secret: "myBigSecret",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
  })
);

if (config.env !== "prod" && config.env !== "test") {
  app.use(
    morgan("combined", {
      stream: {
        write: (message: string) => {
          // Log to a file or external service
          console.log(message.trim());
        }
      }
    })
  );
}

app.use(passport.initialize());
app.use(passport.session());

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

connectToDatabase();

app.use((req, res, next) => {
  // console.log(`Request size: ${req.headers['content-length']} bytes`);
  // console.log(`Headers:`, req.headers);
  next();
});

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.use("/:version", verifyAPI, routes);

export default app;
