const express = require("express");
const router = express.Router();
const { 
  getTasks, 
  getTask, 
  postTask, 
  putTask, 
  deleteTask,
  findTeamTaskByTaskId  // Import the new controller function
} = require("../controllers/taskControllers");
const { verifyAccessToken } = require("../middlewares.js");

// Routes beginning with /api/tasks
router.get("/", verifyAccessToken, getTasks);
router.get("/find", verifyAccessToken, findTeamTaskByTaskId);  // New search endpoint
router.get("/:taskId", verifyAccessToken, getTask);
router.post("/", verifyAccessToken, postTask);
router.put("/:taskId", verifyAccessToken, putTask);
router.delete("/:taskId", verifyAccessToken, deleteTask);

module.exports = router;