import express from "express";
import { signup,signin, logout, googleAuthSignIn, generateOTP} from "../controllers/auth.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { localVariables } from "../middleware/auth.js";

const router = express.Router();

//create a user
router.post("/signup", signup);
//signin
router.post("/signin", signin);
//logout
router.post("/logout", logout);
//google signin
router.post("/google", googleAuthSignIn);
//generate opt
router.get("/generateotp",localVariables, generateOTP);






export default router;