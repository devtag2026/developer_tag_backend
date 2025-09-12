import { Router } from "express";
import { getCurrentUser, loginUser, logoutUser, passwordChange, refreshAccessToken, registerUser, updateAccountDetails, updateUserAvatar } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";


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
router.route("/update-account").patch(verifyJWT, authorizeRoles("admin"), updateAccountDetails)

router.route("/update-avatar").patch(
    verifyJWT,
    authorizeRoles("admin"),
    (req, res, next) => {
        upload.single("avatar")(req, res, (err) => {
            if (err) {
                console.log("Multer error:", err);
                return res.status(400).json({
                    success: false,
                    message: "File upload error: " + err.message
                });
            }
            next();
        });
    },
    updateUserAvatar
)




export default router