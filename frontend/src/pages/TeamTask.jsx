import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import useFetch from '../hooks/useFetch';
import MainLayout from '../layouts/MainLayout';
import validateManyFields from '../validations';

const TaskTeam = () => {
  const authState = useSelector((state) => state.authReducer);
  const navigate = useNavigate();
  const [fetchData, { loading }] = useFetch();
  const { taskId } = useParams();

  const [mode, setMode] = useState(taskId ? 'update' : 'add');
  const [formData, setFormData] = useState({
    taskId: '',
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    time: '',
    members: [],
    progress: 0
  });

  const [newMemberName, setNewMemberName] = useState('');
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  const [searchTaskId, setSearchTaskId] = useState('');
  const [searchError, setSearchError] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState(''); // Stores MongoDB _id

  useEffect(() => {
    document.title = mode === 'add' ? 'Add Task' : 'Update Task';
  }, [mode]);

  useEffect(() => {
    if (mode === 'update' && taskId) {
      loadTaskData(taskId);
    }
  }, [mode, taskId]);

  const loadTaskData = (id) => {
    const config = {
      url: `/tasks/${id}`,
      method: 'get',
      headers: { Authorization: authState.token },
    };
    fetchData(config, { showSuccessToast: false }).then((data) => {
      if (data.task) {
        setCurrentTaskId(data.task._id); // Store MongoDB _id
        setFormData({
          taskId: data.task.taskId || '',
          title: data.task.title,
          description: data.task.description,
          startDate: data.task.startDate.split('T')[0],
          endDate: data.task.endDate.split('T')[0],
          time: data.task.time || '',
          members: data.task.members || [],
          progress: data.task.progress || 0
        });
        setSearchTaskId(data.task.taskId || '');
      }
    });
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setSearchLoading(true);
    setSearchError('');

    if (!searchTaskId.trim()) {
      setSearchError('Please enter a Task ID');
      setSearchLoading(false);
      return;
    }

    try {
      const config = {
        url: `/tasks/find?taskId=${searchTaskId}`,
        method: 'get',
        headers: { Authorization: authState.token },
      };

      const data = await fetchData(config, { showSuccessToast: false });
      if (data && data.task) {
        const foundTask = data.task;
        setCurrentTaskId(foundTask._id); // Store MongoDB _id
        setMode('update');
        setFormData({
          taskId: foundTask.taskId || '',
          title: foundTask.title,
          description: foundTask.description,
          startDate: foundTask.startDate.split('T')[0],
          endDate: foundTask.endDate.split('T')[0],
          time: foundTask.time || '',
          members: foundTask.members || [], // Keep existing members data
          progress: foundTask.progress || 0
        });
        setSearchError('');
      } else {
        setSearchError('Task not found');
        resetForm();
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchError('Error searching for task');
      resetForm();
    } finally {
      setSearchLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      taskId: '',
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      time: '',
      members: [],
      progress: 0
    });
    setCurrentTaskId('');
    setMode('add');
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddMember = (e) => {
    if (e) e.preventDefault();
    if (!newMemberName.trim()) return;

    const exists = formData.members.some(
      member => member.name.toLowerCase() === newMemberName.trim().toLowerCase()
    );
    
    if (exists) {
      alert('Member with this name already exists.');
      return;
    }

    const newMember = {
      name: newMemberName.trim(),
      totalProgress: 0,
      currentProgress: 0
    };

    setFormData(prev => ({
      ...prev,
      members: [...prev.members, newMember]
    }));

    setNewMemberName('');
    setShowAddMemberForm(false);
  };

  const handleAddMemberClick = () => {
    handleAddMember(null);
  };

  const handleDailyProgressChange = (index, value) => {
    const inputProgress = value === '' ? 0 : Number(value);
    if (isNaN(inputProgress)) return;

    const updated = [...formData.members];
    updated[index].currentProgress = Math.min(Math.max(inputProgress, 0), 100);
    setFormData({ ...formData, members: updated });
  };

  const updateProgress = (index) => {
    const updated = [...formData.members];
    const inputProgress = updated[index].currentProgress || 0;
    
    updated[index].totalProgress = Math.min(
      Math.max((updated[index].totalProgress || 0) + inputProgress, 0), 
      100
    );
    updated[index].currentProgress = 0;

    const totalProgress = updated.reduce((sum, member) => sum + member.totalProgress, 0);
    const averageProgress = updated.length > 0 
      ? Math.round(totalProgress / updated.length) 
      : 0;

    setFormData({
      ...formData,
      members: updated,
      progress: averageProgress
    });
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      updateProgress(index);
    }
  };

  const handleRemoveMember = (index) => {
    const updatedMembers = formData.members.filter((_, i) => i !== index);
    const totalProgress = updatedMembers.reduce((sum, member) => sum + member.totalProgress, 0);
    const averageProgress = updatedMembers.length > 0 
      ? Math.round(totalProgress / updatedMembers.length) 
      : 0;

    setFormData({ 
      ...formData, 
      members: updatedMembers,
      progress: averageProgress
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = validateManyFields('task', formData);

    if (errors.length > 0) {
      return;
    }

    // Use currentTaskId (MongoDB _id) for updates
    const endpoint = mode === 'add' ? '/tasks' : `/tasks/${currentTaskId}`;
    
    const config = {
      url: endpoint,
      method: mode === 'add' ? 'post' : 'put',
      data: formData,
      headers: { Authorization: authState.token },
    };
    
    fetchData(config).then(() => {
      navigate('/');
    });
  };

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto my-8">
        {/* Search Section */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Search Task</h2>
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchTaskId}
              onChange={(e) => setSearchTaskId(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none
                         focus:ring-2 focus:ring-blue-400 transition"
              placeholder="Enter Task ID (e.g., QWERTY)"
            />
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition"
              disabled={searchLoading}
            >
              {searchLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Searching...
                </>
              ) : 'Search'}
            </button>
          </form>
          {searchError && <p className="mt-2 text-red-500">{searchError}</p>}
        </div>

        {/* Task Form */}
        <form
          className="bg-white border rounded-lg shadow-lg p-10 flex flex-col gap-6"
          onSubmit={handleSubmit}
        >
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              <h2 className="text-3xl font-semibold text-center text-gray-800 mb-6">
                {mode === 'add' ? 'Add New Team Task' : 'Edit Team Task'}
              </h2>

              {/* Task ID */}
              <div className="flex flex-col">
                <label
                  htmlFor="taskId"
                  className="mb-2 font-medium text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Task ID
                </label>
                <input
                  type="text"
                  name="taskId"
                  id="taskId"
                  value={formData.taskId}
                  onChange={handleChange}
                  className="px-4 py-3 border border-gray-300 rounded-md focus:outline-none
                             focus:ring-2 focus:ring-blue-400 transition"
                  placeholder="Enter task ID"
                />
              </div>

              {/* Title */}
              <div className="flex flex-col">
                <label
                  htmlFor="title"
                  className="mb-2 font-medium text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  id="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="px-4 py-3 border border-gray-300 rounded-md focus:outline-none
                             focus:ring-2 focus:ring-blue-400 transition"
                  placeholder="Enter task title"
                />
              </div>

              {/* Description */}
              <div className="flex flex-col">
                <label
                  htmlFor="description"
                  className="mb-2 font-medium text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Description
                </label>
                <textarea
                  name="description"
                  id="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="px-4 py-3 border border-gray-300 rounded-md focus:outline-none
                             focus:ring-2 focus:ring-blue-400 transition min-h-[120px]"
                  placeholder="Enter task description"
                />
              </div>

              {/* Dates and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label
                    htmlFor="startDate"
                    className="mb-2 font-medium text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    Start Date
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    id="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className="px-4 py-3 border border-gray-300 rounded-md focus:outline-none
                               focus:ring-2 focus:ring-blue-400 transition"
                  />
                </div>

                <div className="flex flex-col">
                  <label
                    htmlFor="endDate"
                    className="mb-2 font-medium text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    End Date
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    id="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    className="px-4 py-3 border border-gray-300 rounded-md focus:outline-none
                               focus:ring-2 focus:ring-blue-400 transition"
                  />
                </div>
              </div>

              <div className="flex flex-col">
                <label
                  htmlFor="time"
                  className="mb-2 font-medium text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Time
                </label>
                <input
                  type="time"
                  name="time"
                  id="time"
                  value={formData.time}
                  onChange={handleChange}
                  className="px-4 py-3 border border-gray-300 rounded-md focus:outline-none
                             focus:ring-2 focus:ring-blue-400 transition"
                />
              </div>

              {/* Team Members Section */}
              <div className="mt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-800">Team Members</h3>
                  <button
                    type="button"
                    onClick={() => setShowAddMemberForm(true)}
                    className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2"
                  >
                    <span>+ Add Member</span>
                  </button>
                </div>

                {/* Add Member Form */}
                {showAddMemberForm && (
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none
                                   focus:ring-2 focus:ring-blue-400 transition"
                        placeholder="Enter member name"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleAddMemberClick}
                        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddMemberForm(false)}
                        className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {formData.members.map((member, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex-1">
                          <span className="font-medium text-gray-800">{member.name}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            placeholder="Today's progress"
                            value={member.currentProgress || ''}
                            onChange={(e) => handleDailyProgressChange(index, e.target.value)}
                            onBlur={() => updateProgress(index)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none
                                       focus:ring-2 focus:ring-blue-400 transition"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(index)}
                            className="text-red-500 hover:text-red-700 px-3 py-2"
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="flex items-center gap-4">
                          <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${member.totalProgress}%` }}
                              className="h-full bg-blue-500 rounded-full"
                            />
                          </div>
                          <span className="font-medium text-gray-700">{member.totalProgress}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Overall Progress */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Overall Team Progress</h3>
                <div className="flex items-center gap-4">
                  <div className="flex-1 bg-gray-200 h-3 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${formData.progress}%` }}
                      className="h-full bg-green-500 rounded-full"
                    />
                  </div>
                  <span className="font-bold text-gray-800">{formData.progress}%</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center gap-4 mt-8">
                {mode === 'add' ? (
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-3 rounded-md font-semibold
                               hover:bg-blue-700 transition flex items-center gap-2"
                  >
                    Add Task
                  </button>
                ) : (
                  <>
                    <button
                      type="submit"
                      className="bg-green-600 text-white px-6 py-3 rounded-md font-semibold
                                 hover:bg-green-700 transition flex items-center gap-2"
                    >
                      Update Task
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="bg-yellow-500 text-white px-6 py-3 rounded-md font-semibold
                                 hover:bg-yellow-600 transition flex items-center gap-2"
                    >
                      Reset Changes
                    </button>
                  </>
                )}
                <button
                type="button"
                onClick={() => navigate('/')}
                className="bg-red-500 text-white px-6 py-3 rounded-md font-semibold
                           hover:bg-red-600 transition"
              >
                Cancel
              </button>

              </div>
            </>
          )}
        </form>
      </div>
    </MainLayout>
  );
};

export default TaskTeam;