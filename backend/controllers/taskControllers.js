// ../controllers/taskControllers.js
const mongoose = require('mongoose');
const Task = require("../models/Task");
const TeamTask = require("../models/TeamTask");
const { validateObjectId } = require("../utils/validation");

// controllers/taskController.js

exports.getTasks = async (req, res) => {
  try {
    // Fetch personal tasks
    const personalTasks = await Task.find({ user: req.user.id });

    // Fetch team tasks where the user is the creator
    const teamTasks = await TeamTask.find({ createdBy: req.user.id });

    res.status(200).json({
      personalTasks,
      teamTasks,
      status: true,
      msg: 'Tasks found successfully..',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: false,
      msg: 'Internal Server Error',
    });
  }
};


exports.getTask = async (req, res) => {
  try {
    if (!validateObjectId(req.params.taskId)) {
      return res.status(400).json({ status: false, msg: 'Task id not valid' });
    }

    let task = await Task.findOne({ user: req.user.id, _id: req.params.taskId });
    if (!task) {
      task = await TeamTask.findOne({ taskId: req.params.taskId, createdBy: req.user.id });
    }

    if (!task) {
      return res.status(400).json({ status: false, msg: 'No task found..' });
    }
    res.status(200).json({ task, status: true, msg: 'Task found successfully..' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: false, msg: 'Internal Server Error' });
  }
};

exports.findTeamTaskByTaskId = async (req, res) => {
  try {
    const { taskId } = req.query;

    if (!taskId) {
      return res.status(400).json({ status: false, msg: 'Task ID is required' });
    }

    // ✅ No filtering by createdBy — allow anyone to fetch with taskId
    const task = await TeamTask.findOne({
      taskId: taskId.toUpperCase()
    });

    if (!task) {
      return res.status(404).json({ status: false, msg: 'Team task not found' });
    }

    res.status(200).json({ task, status: true, msg: 'Team task found successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: false, msg: 'Internal Server Error' });
  }
};


exports.postTask = async (req, res) => {
  try {
    const keysCount = Object.keys(req.body).length;

    if (keysCount <= 3) {
      const { title, endDate, endTime } = req.body;
      if (!title || !endDate || !endTime) {
        return res.status(400).json({ status: false, msg: 'Title, end date, and end time are required' });
      }
      const task = await Task.create({ user: req.user.id, title, endDate, endTime });
      return res.status(200).json({ task, status: true, msg: 'Task created successfully..' });

    } else if (keysCount >= 4) {
      const { taskId, title, description, startDate, endDate, time, members } = req.body;

      if (!taskId || !title || !description || !startDate || !endDate || !time || !members) {
        return res.status(400).json({ status: false, msg: 'Task ID, title, description, startDate, endDate, time, and members are required for team task' });
      }
      if (!Array.isArray(members)) {
        return res.status(400).json({ status: false, msg: 'Members must be an array' });
      }

      const existingTask = await TeamTask.findOne({ taskId: taskId.toUpperCase() });
      if (existingTask) {
        return res.status(400).json({ status: false, msg: 'Task ID already exists' });
      }

      const preparedMembers = members.map(member => ({
        name: member.name.trim(),
        totalProgress: 0,
        currentProgress: 0
      }));

      const teamTask = await TeamTask.create({
        taskId: taskId.toUpperCase(),
        createdBy: req.user.id,
        title,
        description,
        startDate,
        endDate,
        time,
        members: preparedMembers,
        progress: 0
      });

      return res.status(200).json({ teamTask, status: true, msg: 'Team task created successfully with progress starting at 0.' });

    } else {
      return res.status(400).json({ status: false, msg: 'Invalid task data provided' });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: false, msg: 'Internal Server Error' });
  }
};


exports.putTask = async (req, res) => {
  try {
    const taskIdParam = req.params.taskId;
    const updatedTaskData = req.body;

    if (!taskIdParam) {
      return res.status(400).json({ status: false, msg: 'Task ID is required' });
    }

    if (!updatedTaskData || Object.keys(updatedTaskData).length === 0) {
      return res.status(400).json({ status: false, msg: 'Request body cannot be empty' });
    }

    const isObjectId = mongoose.Types.ObjectId.isValid(taskIdParam);

    let taskToUpdate;

    // ✅ Removed "createdBy" check so any user can access if they have correct ID
    if (isObjectId) {
      taskToUpdate = await TeamTask.findOne({ _id: taskIdParam }) || 
                     await Task.findOne({ _id: taskIdParam });
    } else {
      taskToUpdate = await TeamTask.findOne({ taskId: taskIdParam }) || 
                     await Task.findOne({ taskId: taskIdParam });
    }

    if (!taskToUpdate) {
      return res.status(404).json({ status: false, msg: 'Task not found' });
    }

    // Check if it's a TeamTask
    if (taskToUpdate instanceof mongoose.model('TeamTask')) {
      const { title, description, startDate, endDate, time, members, progress } = updatedTaskData;

      if (title === undefined || description === undefined || startDate === undefined || 
          endDate === undefined || time === undefined || members === undefined || progress === undefined) {
        return res.status(400).json({ 
          status: false, 
          msg: 'All fields (title, description, startDate, endDate, time, members, progress) are required for team task update' 
        });
      }

      if (!Array.isArray(members)) {
        return res.status(400).json({ status: false, msg: 'Members must be an array' });
      }

      try {
        const updatedTeamTask = await TeamTask.findByIdAndUpdate(
          taskToUpdate._id,
          { title, description, startDate, endDate, time, members, progress },
          { new: true, runValidators: true }
        );

        return res.status(200).json({ 
          task: updatedTeamTask, 
          status: true, 
          msg: 'Team task updated successfully' 
        });
      } catch (error) {
        if (error.name === 'ValidationError') {
          return res.status(400).json({ status: false, msg: 'Validation error: ' + error.message });
        }
        console.error("Error updating TeamTask:", error);
        return res.status(500).json({ status: false, msg: 'Internal server error' });
      }
    } else {
      // Handle regular Task
      const { title, endDate, endTime } = updatedTaskData;

      if (title === undefined || endDate === undefined || endTime === undefined) {
        return res.status(400).json({ 
          status: false, 
          msg: 'Title, end date, and end time are required for simple task update' 
        });
      }

      try {
        const updatedTask = await Task.findByIdAndUpdate(
          taskToUpdate._id,
          { title, endDate, endTime },
          { new: true, runValidators: true }
        );

        return res.status(200).json({ 
          task: updatedTask, 
          status: true, 
          msg: 'Task updated successfully' 
        });
      } catch (error) {
        if (error.name === 'ValidationError') {
          return res.status(400).json({ status: false, msg: 'Validation error: ' + error.message });
        }
        console.error("Error updating Task:", error);
        return res.status(500).json({ status: false, msg: 'Internal server error' });
      }
    }
  } catch (err) {
    console.error('Error in putTask:', err);
    return res.status(500).json({ status: false, msg: 'Internal Server Error' });
  }
};




exports.deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;




    // Try deleting from Task collection (MongoDB _id)
    if (mongoose.Types.ObjectId.isValid(taskId)) {
      const deletedTask = await Task.findOneAndDelete({ 
        _id: taskId, 
        user: userId 
      });

      if (deletedTask) {
        return res.status(200).json({ 
          status: true, 
          msg: 'Personal task deleted successfully.' 
        });
      }
    }

    // Try deleting from TeamTask (custom taskId)
    const deletedTeamTask = await TeamTask.findOneAndDelete({ 
      $or: [
        { taskId: taskId, createdBy: userId }, // Match custom ID
        { _id: taskId, createdBy: userId }     // Also check MongoDB _id for TeamTask
      ]
    });

    if (deletedTeamTask) {

      return res.status(200).json({ 
        status: true, 
        msg: 'Team task deleted successfully.' 
      });
    }

    return res.status(404).json({ 
      status: false, 
      msg: 'Task not found or you dont have permission' 
    });

  } catch (err) {
    console.error('Delete error:', err);
    return res.status(500).json({ 
      status: false, 
      msg: 'Server error during deletion' 
    });
  }
};