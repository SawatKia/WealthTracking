import * as functions from "firebase-functions";
import * as express from "express";
import * as cors from "cors";
import * as bodyParser from "body-parser";
// import * as cookieParser from "cookie-parser";

import testRouter from "./routes/testRouter"
import MemberRouter from "./routes/MemberRouter";
import logger from "./logger";

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
// app.use(cookieParser());

app.use("/test", testRouter);
app.use("/member", MemberRouter);

// app.listen(PORT, () => {
//   logger.info(`App listening on port ${PORT}`);
// });

exports.app = functions.https.onRequest(app);
