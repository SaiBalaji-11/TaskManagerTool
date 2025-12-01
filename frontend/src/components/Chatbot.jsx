import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import api from '../api'; // <-- NEW IMPORT: Use the configured axios instance

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hi! I am your AI assistant. How can I help you?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const authState = useSelector(state => state.authReducer);

  const toggleChat = () => setIsOpen(!isOpen);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    const currentInput = input;
    setInput("");

    try {
      // --- FIX APPLIED HERE: Using api.post instead of fetch ---
      const response = await api.post('/chat', { message: currentInput }, {
        headers: {
          'Authorization': authState.token // Pass the token in the Authorization header
        }
      });
      
      // Axios automatically parses JSON, and response.data contains the server reply
      const botMessage = { sender: "bot", text: response.data.reply };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Chat Error:", error);
      
      // Axios error handling: use error.response?.data?.message for server-side error messages
      const errorMessage = error.response?.data?.message || "Sorry, I am having trouble connecting.";
      setMessages((prev) => [...prev, { sender: "bot", text: errorMessage }]);
    }
    setLoading(false);
  };

  // Only show chatbot if user is logged in
  if (!authState.isLoggedIn) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="bg-white border border-gray-200 shadow-xl rounded-lg w-80 h-96 flex flex-col mb-4 overflow-hidden">
          <div className="bg-blue-600 text-white p-3 font-semibold flex justify-between items-center">
            <span>AI Assistant</span>
            <button onClick={toggleChat} className="text-sm font-bold">✕</button>
          </div>
          
          <div className="flex-1 p-3 overflow-y-auto bg-gray-50 flex flex-col gap-2">
            {messages.map((msg, index) => (
              <div key={index} className={`${msg.sender === 'user' ? 'self-end bg-blue-500 text-white' : 'self-start bg-gray-200 text-gray-800'} p-2 rounded-lg max-w-[80%] text-sm`}>
                {msg.text}
              </div>
            ))}
            {loading && <div className="text-xs text-gray-400 italic">Thinking...</div>}
          </div>

          <div className="p-3 border-t flex gap-2 bg-white">
            <input 
              type="text" 
              className="flex-1 border rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
              placeholder="Ask a question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button 
              onClick={sendMessage}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition"
            >
              Send
            </button>
          </div>
        </div>
      )}

      <button 
        onClick={toggleChat}
        className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-transform hover:scale-110 flex items-center justify-center w-14 h-14 text-2xl"
      >
        🤖
      </button>
    </div>
  );
};

export default Chatbot;