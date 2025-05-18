// src/pages/add-member.jsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const AddMember = () => {
  const [memberName, setMemberName] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const handleAdd = () => {
    if (memberName.trim()) {
      const existingMembers = location.state?.members || [];
      const updatedMembers = [...existingMembers, { name: memberName.trim(), hours: 0 }];
      navigate('/teamtask', { state: { members: updatedMembers } });
    }
  };

  return (
    <div className='flex flex-col items-center justify-center min-h-screen bg-gray-100'>
      <div className='bg-white p-6 rounded shadow-md w-full max-w-md'>
        <h2 className='text-xl font-bold mb-4'>Add Team Member</h2>
        <input
          type='text'
          placeholder='Enter name'
          value={memberName}
          onChange={(e) => setMemberName(e.target.value)}
          className='w-full p-2 border border-gray-300 rounded mb-4'
        />
        <button
          onClick={handleAdd}
          className='w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700'
        >
          Add Member
        </button>
      </div>
    </div>
  );
};

export default AddMember;
