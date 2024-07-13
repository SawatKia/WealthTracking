import { Router, Request, Response } from "express";
import MemberController from "../controllers/MemberController";

const router = Router();

const verifyMethod = (req: Request, res: Response, next: Function): void => {
    //   const ALLOWED_METHODS = ['POST', 'PUT', 'DELETE', 'GET'];
    const ALLOWED_METHODS = ["POST","GET"];
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
        if (result) {
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

router.post("/create", handleRequest(MemberController.addMember));
router.post("/read", handleRequest(MemberController.getMember))

export default router;