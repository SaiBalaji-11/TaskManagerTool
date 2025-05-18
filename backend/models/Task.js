const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  title: {
    type: String,
    required: true,
  },
  endDate: {  // Renamed for consistency
    type: Date,
    required: true,
  },
  endTime: {
    type: String, // Expecting a time string like "14:30" or "02:00 PM"
    required: false,
  },
    isCompleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const Task = mongoose.model("Task", taskSchema);
module.exports = Task;