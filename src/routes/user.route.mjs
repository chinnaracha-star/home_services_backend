import { Router } from "express";
import multer from "multer";
import { protect } from "../middlewares/protect.middleware.mjs";
import {
  changeMyPassword,
  getMyProfile,
  uploadMyAvatar,
  updateMyProfile,
} from "../controllers/user.controller.mjs";
import { HttpError } from "../utils/http-error.mjs";

const userRouter = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      callback(
        new HttpError(
          400,
          "INVALID_AVATAR_TYPE",
          "รองรับเฉพาะรูป JPEG, PNG, GIF หรือ WebP",
        ),
      );
      return;
    }

    callback(null, true);
  },
});

userRouter.get("/me", protect, getMyProfile);
userRouter.patch("/me", protect, updateMyProfile);
userRouter.patch("/me/password", protect, changeMyPassword);
userRouter.post(
  "/me/avatar",
  protect,
  upload.single("avatar"),
  uploadMyAvatar,
);

export { userRouter };
