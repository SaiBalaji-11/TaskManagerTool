// frontend/src/layouts/MainLayout.jsx
import React from 'react'
import Navbar from '../components/Navbar';
import Chatbot from '../components/Chatbot'; // Import the chatbot

const MainLayout = ({ children }) => {
  return (
    <>
      <div className='relative bg-gray-50 h-screen w-screen overflow-x-hidden'>
        <Navbar />
        {children}
        <Chatbot />
      </div>
    </>
  )
}

export default MainLayout;