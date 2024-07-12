import * as functions from "firebase-functions";
import * as express from "express";

const app = express();
app.get("/", (req, res) => {
  res.send("Hello from Firebase!!!!!!");
});
app.listen(3000);

exports.app = functions.https.onRequest(app);
