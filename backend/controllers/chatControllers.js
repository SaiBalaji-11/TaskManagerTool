const { GoogleGenerativeAI } = require("@google/generative-ai");
const User = require("../models/User");
const Task = require("../models/Task");
const TeamTask = require("../models/TeamTask");

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

exports.handleChat = async (req, res) => {
  const { message } = req.body;
  const userId = req.user.id;

  console.log("--- Chat Request ---");
  console.log("User Message:", message);

  try {
    // 1. Get User details (We need the name to check 'members' list)
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // 2. Fetch PERSONAL Tasks
    const personalTasks = await Task.find({ user: userId });

    // 3. Fetch TEAM Tasks (FIXED)
    // - Check 'createdBy' because your model uses that field for the admin.
    // - Check 'members.name' because your model stores members as objects with names.
    const teamTasks = await TeamTask.find({
      $or: [
        { createdBy: userId },           // You are the admin/creator
        { "members.name": user.name }    // You are in the members list
      ]
    });

    // --- FORMAT DATA FOR AI ---
    const personalContext = personalTasks.length > 0 
      ? personalTasks.map((t, i) => {
          const status = t.isCompleted ? "Completed" : "Pending";
          // Format date to be readable
          const date = t.endDate ? new Date(t.endDate).toDateString() : "No date";
          return `${i + 1}. [Personal] ${t.title || t.description} (Due: ${date}, Status: ${status})`;
        }).join("\n")
      : "No personal tasks.";

    const teamContext = teamTasks.length > 0
      ? teamTasks.map((t, i) => {
          const status = t.isCompleted ? "Completed" : "Pending";
          const title = t.title || "Untitled Team Task";
          const date = t.endDate ? new Date(t.endDate).toDateString() : "No date";
          return `${i + 1}. [Team] ${title} (Due: ${date}, Status: ${status})`;
        }).join("\n")
      : "No team tasks.";

    // --- CONSTRUCT PROMPT ---
    const prompt = `
      You are a helpful Task Manager Assistant for ${user.name}.
      
      Here is the user's REAL-TIME task list:

      === PERSONAL TASKS ===
      ${personalContext}

      === TEAM TASKS ===
      ${teamContext}

      --------------------
      User's Question: "${message}"

      Instructions:
      - Answer based strictly on the tasks listed above.
      - If the user asks "What are my tasks?", list both Personal and Team tasks.
      - If the list is empty, say "You have no tasks found."
    `;

    // --- SEND TO GEMINI ---
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log("AI Reply:", text);
    res.status(200).json({ reply: text });

  } catch (error) {
    console.error("Chat Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};












// const { GoogleGenerativeAI } = require("@google/generative-ai");
// const User = require("../models/User");
// const Task = require("../models/Task");
// const TeamTask = require("../models/TeamTask");

// // Initialize Gemini
// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// // Use the model we confirmed works for you
// const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// exports.handleChat = async (req, res) => {
//   const { message } = req.body;
  
//   // 1. We need the User's ID (from the token) AND their Name (for Team Tasks)
//   const userId = req.user.id; 

//   console.log("--- Chat Request ---");
//   console.log("User Message:", message);

//   try {
//     // Fetch the User details to get their "name"
//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // --- FETCH PERSONAL TASKS ---
//     // Using your Schema: 'title', 'endDate', 'isCompleted'
//     const personalTasks = await Task.find({ user: userId });

//     // --- FETCH TEAM TASKS ---
//     // Using your Schema: 'members' is an array of objects with 'name'
//     // We find tasks where ANY member's name matches the current user's name
//     const teamTasks = await TeamTask.find({ "members.name": user.name });

//     // --- FORMAT DATA FOR AI ---
    
//     // Format Personal Tasks
//     const personalContext = personalTasks.length > 0 
//       ? personalTasks.map((t, i) => {
//           const status = t.isCompleted ? "Completed" : "Pending";
//           const date = new Date(t.endDate).toLocaleDateString();
//           return `${i + 1}. [Personal] ${t.title} (Due: ${date}, Status: ${status})`;
//         }).join("\n")
//       : "No personal tasks.";

//     // Format Team Tasks
//     const teamContext = teamTasks.length > 0
//       ? teamTasks.map((t, i) => {
//           const status = t.isCompleted ? "Completed" : "In Progress";
//           const date = new Date(t.endDate).toLocaleDateString();
//           return `${i + 1}. [Team] ${t.title} (Due: ${date}, Status: ${status})`;
//         }).join("\n")
//       : "No team tasks.";

//     // --- CONSTRUCT THE PROMPT ---
//     const prompt = `
//       You are a smart Task Manager Assistant.
      
//       The user (${user.name}) is asking a question.
//       Here is their REAL-TIME database content:

//       === PERSONAL TASKS ===
//       ${personalContext}

//       === TEAM TASKS ===
//       ${teamContext}

//       --------------------
//       User's Question: "${message}"

//       Instructions:
//       1. Answer based ONLY on the tasks listed above.
//       2. If asked "What do I have to do?", list both personal and team tasks.
//       3. If asked about "Team tasks", only list the [Team] items.
//       4. Be friendly and concise.
//     `;

//     // --- SEND TO GEMINI ---
//     const result = await model.generateContent(prompt);
//     const response = await result.response;
//     const text = response.text();

//     console.log("AI Reply:", text);
//     res.status(200).json({ reply: text });

//   } catch (error) {
//     console.error("Chat Error:", error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };