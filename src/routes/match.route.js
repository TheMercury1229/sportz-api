import { Router } from "express";
import { createMatch, listMatches } from "../controllers/match.controller.js";
const matchRouter = Router();

matchRouter.get("/", listMatches);

matchRouter.post("/", createMatch);

export default matchRouter;
