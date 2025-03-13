import { Router } from "express";
import { getCurrentUser, loginUser, logoutUser, passwordChange, refreshAccessToken, registerUser, updateAccountDetails, updateUserAvatar } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router()


// --All Routes for User--

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },

    ]),
    registerUser
)

router.route("/login").post(loginUser)

router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)

router.route("/change-password").post(verifyJWT, passwordChange)
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/update-account").patch(verifyJWT, updateAccountDetails)

router.route("/update-avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)




export default router