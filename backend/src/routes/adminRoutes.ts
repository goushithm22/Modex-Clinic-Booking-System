import { Router } from "express";
import {
  handleCreateDoctor,
  handleGetDoctors,
  handleCreateSlot,
  handleUpdateSlot,
  handleSoftDeleteSlot,
  handleDeleteDoctor
} from "../controllers/adminController";
import { handleHardDeleteSlot } from "../controllers/adminController";

const router: Router = Router();

router.post("/doctors", handleCreateDoctor);
router.get("/doctors", handleGetDoctors);
router.delete("/doctors/:doctorId", handleDeleteDoctor);
router.post("/slots", handleCreateSlot);
router.delete("/slots/:slotId", handleHardDeleteSlot);
router.patch("/slots/:slotId", handleUpdateSlot);
router.patch("/slots/:slotId/soft-delete", handleSoftDeleteSlot);


export default router;
