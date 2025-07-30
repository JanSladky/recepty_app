import { Router } from "express";
import { getAllUsers, deleteUser, toggleAdmin } from "../controllers/adminController";
import { verifyAdmin } from "../middleware/auth";

const router = Router();

router.get("/users", verifyAdmin, getAllUsers);
router.delete("/users/:id", verifyAdmin, deleteUser);
router.put("/users/:id/role", verifyAdmin, toggleAdmin);

export default router;