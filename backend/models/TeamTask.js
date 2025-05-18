// models/TeamTask.js
const mongoose = require("mongoose");

const teamTaskSchema = new mongoose.Schema({
  taskId: {
    type: String,  // Or mongoose.Schema.Types.ObjectId if you prefer
    required: true,
    unique: true,  // optional, but good if taskId must be unique
    trim: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  members: [
    {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      totalProgress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      currentProgress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },// ... existing member fields ...
      hasUpdated: {
        type: Boolean,
        default: false
      }
    },
  ],
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
   isCompleted: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
}, {
  timestamps: true,
});

const TeamTask = mongoose.model("TeamTask", teamTaskSchema);
module.exports = TeamTask;
