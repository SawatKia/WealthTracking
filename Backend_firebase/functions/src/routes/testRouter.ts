import { Router, Request, Response } from "express";
import PingController from "../controllers/PingController";

const router = Router();

// Middleware to verify the HTTP method
const verifyMethod = (req: Request, res: Response, next: Function): void => {
  //   const ALLOWED_METHODS = ['POST', 'PUT', 'DELETE', 'GET'];
  const ALLOWED_METHODS = ["GET"];
  if (!ALLOWED_METHODS.includes(req.method)) {
    res.status(405).json({ status_code: 405, message: "Method Not Allowed" });
  }
  next();
};

// Apply middleware
router.use(verifyMethod);

const handleRequest = (controllerMethod: Function) => {
  return async (req: Request, res: Response) => {
    let statusCode = 0;
    try {
      const result = await controllerMethod(req);
      if (result.message == "pong") {
        statusCode = 200;
      }
      res
        .status(statusCode)
        .json({
          status_code: statusCode,
          message: result.message || "Success",
          data: result.data,
        });
    } catch (error: Error | any) {
      res.status(500).json({ status_code: 500, message: error.message });
    }
  };
};

// Ping route for testing connection
router.get("/ping", handleRequest(PingController.ping));

export default router;
