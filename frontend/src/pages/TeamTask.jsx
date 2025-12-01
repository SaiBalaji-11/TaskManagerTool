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
    progress: 0,
    createdBy: ''
  });

  const [newMemberName, setNewMemberName] = useState('');
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  const [searchTaskId, setSearchTaskId] = useState('');
  const [searchError, setSearchError] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState('');
  const [isCreator, setIsCreator] = useState(false);
  const [searchedTask, setSearchedTask] = useState(false);

  // helper: normalize names (remove spaces and lowercase) to compare robustly
  const normalizeName = (name) => (name || '').toString().replace(/\s+/g, '').toLowerCase();

  // check if a given memberName string corresponds to the current user
  const isUserNameEqual = (memberName) => {
    return normalizeName(authState.user?.name) === normalizeName(memberName);
  };

  // check whether current user is in the task members list
  const isUserMember = () => {
    return formData.members.some(member => isUserNameEqual(member.name));
  };

  // Set document title
  useEffect(() => {
    document.title = mode === 'add' ? 'Add Team Task' : 'Update Team Task';
  }, [mode]);

  // Load task data when in update mode
  useEffect(() => {
    if (mode === 'update' && taskId) {
      loadTaskData(taskId);
    }
  }, [mode, taskId]);

  const loadTaskData = async (id) => {
    const config = {
      url: `/tasks/${id}`,
      method: 'get',
      headers: { Authorization: authState.token },
    };
    
    try {
      const data = await fetchData(config, { showSuccessToast: false });
      if (data?.task) {
        setCurrentTaskId(data.task._id);
        setFormData({
          taskId: data.task.taskId || '',
          title: data.task.title,
          description: data.task.description,
          startDate: data.task.startDate?.split('T')[0] || '',
          endDate: data.task.endDate?.split('T')[0] || '',
          time: data.task.time || '',
          members: data.task.members || [],
          progress: data.task.progress || 0,
          createdBy: data.task.createdBy || ''
        });
        setIsCreator(data.task.createdBy === authState.user._id);
        setSearchedTask(false);
      }
    } catch (error) {
      console.error('Error loading task:', error);
    }
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
        url: `/tasks/find?taskId=${encodeURIComponent(searchTaskId)}`,
        method: 'get',
        headers: { Authorization: authState.token },
      };

      const data = await fetchData(config, { showSuccessToast: false });
      if (data?.task) {
        const foundTask = data.task;
        setCurrentTaskId(foundTask._id);
        setMode('update');
        setFormData({
          taskId: foundTask.taskId || '',
          title: foundTask.title,
          description: foundTask.description,
          startDate: foundTask.startDate?.split('T')[0] || '',
          endDate: foundTask.endDate?.split('T')[0] || '',
          time: foundTask.time || '',
          members: foundTask.members || [],
          progress: foundTask.progress || 0,
          createdBy: foundTask.createdBy || ''
        });
        setIsCreator(foundTask.createdBy === authState.user._id);
        setSearchedTask(true);
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
      progress: 0,
      createdBy: ''
    });
    setCurrentTaskId('');
    setMode('add');
    setIsCreator(false);
    setSearchedTask(false);
  };

  const handleChange = (e) => {
    // Only the creator can change task details in update mode
    if (!isCreator && mode === 'update') return;
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddMember = (e) => {
    if (e) e.preventDefault();
    // Only creator or in add mode can add members
    if (!(mode === 'add' || isCreator)) return;
    if (!newMemberName.trim()) return;

    const normalizedNew = normalizeName(newMemberName.trim());
    const exists = formData.members.some(
      member => normalizeName(member.name) === normalizedNew
    );
    
    if (exists) {
      alert('Member already exists.');
      return;
    }

    setFormData(prev => ({
      ...prev,
      members: [...prev.members, {
        name: newMemberName.trim(),
        totalProgress: 0,
        currentProgress: 0
      }]
    }));

    setNewMemberName('');
    setShowAddMemberForm(false);
  };

  const handleDailyProgressChange = (index, value) => {
    // Only the team member corresponding to this entry can edit their current progress
    if (!isUserNameEqual(formData.members[index].name)) return;
    
    const inputValue = value === '' ? 0 : Number(value);
    if (isNaN(inputValue)) return;

    const updated = [...formData.members];
    updated[index].currentProgress = Math.min(Math.max(inputValue, 0), 100);
    setFormData({ ...formData, members: updated });
  };

  const updateProgress = (index) => {
    // Only the team member corresponding to this entry can update their progress
    if (!isUserNameEqual(formData.members[index].name)) return;
    
    const updated = [...formData.members];
    updated[index].totalProgress = Math.min(
      (updated[index].totalProgress || 0) + (updated[index].currentProgress || 0),
      100
    );
    updated[index].currentProgress = 0;

    const totalProgress = updated.reduce((sum, member) => sum + (member.totalProgress || 0), 0);
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
      // Apply permission check before updating on Enter
      if (isUserNameEqual(formData.members[index].name)) {
        updateProgress(index);
      }
    }
  };

  const handleRemoveMember = (index) => {
    // Only creator or in add mode can remove members
    if (!(mode === 'add' || isCreator)) return;
    
    const updatedMembers = formData.members.filter((_, i) => i !== index);
    const totalProgress = updatedMembers.reduce((sum, member) => sum + (member.totalProgress || 0), 0);
    const averageProgress = updatedMembers.length > 0 
      ? Math.round(totalProgress / updatedMembers.length) 
      : 0;

    setFormData({ 
      ...formData, 
      members: updatedMembers,
      progress: averageProgress
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const isMember = isUserMember();

    // 1. Validation for Add mode or Creator update mode (full form validation)
    if (mode === 'add' || isCreator) {
        const errors = validateManyFields('task', formData);
        if (errors.length > 0) {
            alert('Please fix validation errors before submitting.');
            return;
        }
    } 
    // 2. Validation for Team Member update (must be a member, only submitting progress)
    else if (mode === 'update' && !isCreator) {
        if (!isMember) {
            alert('You are not a member of this task and cannot submit updates.');
            return;
        }
        // If they are a member, allow submission. Backend will enforce that only progress fields changed.
    }

    const config = {
      url: mode === 'add' ? '/tasks' : `/tasks/${currentTaskId}`,
      method: mode === 'add' ? 'post' : 'put',
      data: formData,
      headers: { Authorization: authState.token },
    };
    
    try {
      await fetchData(config);
      navigate('/');
    } catch (error) {
      console.error('Error saving task:', error);
    }
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
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              placeholder="Enter Task ID"
            />
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition"
              disabled={searchLoading}
            >
              {searchLoading ? 'Searching...' : 'Search'}
            </button>
          </form>
          {searchError && <p className="mt-2 text-red-500">{searchError}</p>}
        </div>

        {/* Task Form */}
        <form className="bg-white border rounded-lg shadow-lg p-10 flex flex-col gap-6" onSubmit={handleSubmit}>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              <h2 className="text-3xl font-semibold text-center text-gray-800 mb-6">
                {mode === 'add' ? 'Add New Team Task' : 'Edit Team Task'}
                {mode === 'update' && !isCreator && ' (Read Only)'}
              </h2>

              {/* Task Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="mb-2 font-medium text-gray-700">Task ID</label>
                  <input
                    name="taskId"
                    value={formData.taskId}
                    onChange={handleChange}
                    className={`px-4 py-3 border rounded-md focus:outline-none transition ${
                      !isCreator && mode === 'update' ? 'bg-gray-100 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-400'
                    }`}
                    readOnly={!isCreator && mode === 'update'}
                  />
                </div>

                <div className="flex flex-col">
                  <label className="mb-2 font-medium text-gray-700">Title</label>
                  <input
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className={`px-4 py-3 border rounded-md focus:outline-none transition ${
                      !isCreator && mode === 'update' ? 'bg-gray-100 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-400'
                    }`}
                    readOnly={!isCreator && mode === 'update'}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="flex flex-col">
                <label className="mb-2 font-medium text-gray-700">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className={`px-4 py-3 border rounded-md focus:outline-none transition min-h-[120px] ${
                    !isCreator && mode === 'update' ? 'bg-gray-100 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-400'
                  }`}
                  readOnly={!isCreator && mode === 'update'}
                />
              </div>

              {/* Dates and Time */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col">
                  <label className="mb-2 font-medium text-gray-700">Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className={`px-4 py-3 border rounded-md focus:outline-none transition ${
                      !isCreator && mode === 'update' ? 'bg-gray-100 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-400'
                    }`}
                    readOnly={!isCreator && mode === 'update'}
                  />
                </div>

                <div className="flex flex-col">
                  <label className="mb-2 font-medium text-gray-700">End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    className={`px-4 py-3 border rounded-md focus:outline-none transition ${
                      !isCreator && mode === 'update' ? 'bg-gray-100 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-400'
                    }`}
                    readOnly={!isCreator && mode === 'update'}
                  />
                </div>

                <div className="flex flex-col">
                  <label className="mb-2 font-medium text-gray-700">Time</label>
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    className={`px-4 py-3 border rounded-md focus:outline-none transition ${
                      !isCreator && mode === 'update' ? 'bg-gray-100 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-400'
                    }`}
                    readOnly={!isCreator && mode === 'update'}
                  />
                </div>
              </div>

              {/* Team Members Section */}
              <div className="mt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-800">Team Members</h3>
                  {(mode === 'add' || isCreator) && (
                    <button
                      type="button"
                      onClick={() => setShowAddMemberForm(true)}
                      className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2"
                    >
                      <span>+ Add Member</span>
                    </button>
                  )}
                </div>

                {/* Add Member Form */}
                {showAddMemberForm && (mode === 'add' || isCreator) && (
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddMember(e)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                        placeholder="Enter member name"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleAddMember}
                        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowAddMemberForm(false); setNewMemberName(''); }}
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
                          {isUserNameEqual(member.name) && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              You
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            placeholder="Daily Progress"
                            value={member.currentProgress || ''}
                            onChange={(e) => handleDailyProgressChange(index, e.target.value)}
                            onBlur={() => updateProgress(index)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            className={`w-24 px-3 py-2 border rounded-md focus:outline-none transition ${
                              !isUserNameEqual(member.name) 
                                ? 'bg-gray-100 cursor-not-allowed' 
                                : 'focus:ring-2 focus:ring-blue-400'
                            }`}
                            readOnly={!isUserNameEqual(member.name)}
                          />
                          {(mode === 'add' || isCreator) && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(index)}
                              className="text-red-500 hover:text-red-700 px-3 py-2"
                            >
                              Remove
                            </button>
                          )}
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
                    className="bg-blue-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-blue-700 transition"
                  >
                    Add Task
                  </button>
                ) : (
                  <>
                    {/* Submit button for both creator (Update) and member (Submit Progress) */}
                    {(isCreator || isUserMember()) && (
                        <button
                            type="submit"
                            className="bg-green-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-green-700 transition"
                        >
                            {isCreator ? 'Update Task' : 'Submit My Progress'}
                        </button>
                    )}

                    {/* Reset button only for creator */}
                    {isCreator && (
                      <button
                        type="button"
                        onClick={resetForm}
                        className="bg-yellow-500 text-white px-6 py-3 rounded-md font-semibold hover:bg-yellow-600 transition"
                      >
                        Reset Changes
                      </button>
                    )}
                  </>
                )}
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="bg-red-500 text-white px-6 py-3 rounded-md font-semibold hover:bg-red-600 transition"
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

//1-STATEMENT THING
// import React, { useEffect, useState } from 'react';
// import { useSelector } from 'react-redux';
// import { useNavigate, useParams } from 'react-router-dom';
// import useFetch from '../hooks/useFetch';
// import MainLayout from '../layouts/MainLayout';
// import validateManyFields from '../validations';

// const TaskTeam = () => {
//   const authState = useSelector((state) => state.authReducer);
//   const navigate = useNavigate();
//   const [fetchData, { loading }] = useFetch();
//   const { taskId } = useParams();

//   const [mode, setMode] = useState(taskId ? 'update' : 'add');
//   const [formData, setFormData] = useState({
//     taskId: '',
//     title: '',
//     description: '',
//     startDate: '',
//     endDate: '',
//     time: '',
//     members: [],
//     progress: 0,
//     createdBy: ''
//   });

//   const [newMemberName, setNewMemberName] = useState('');
//   const [showAddMemberForm, setShowAddMemberForm] = useState(false);
//   const [searchTaskId, setSearchTaskId] = useState('');
//   const [searchError, setSearchError] = useState('');
//   const [searchLoading, setSearchLoading] = useState(false);
//   const [currentTaskId, setCurrentTaskId] = useState('');
//   const [isCreator, setIsCreator] = useState(false);
//   const [searchedTask, setSearchedTask] = useState(false);

//   // Set document title
//   useEffect(() => {
//     document.title = mode === 'add' ? 'Add Team Task' : 'Update Team Task';
//   }, [mode]);

//   // Load task data when in update mode
//   useEffect(() => {
//     if (mode === 'update' && taskId) {
//       loadTaskData(taskId);
//     }
//   }, [mode, taskId]);

//   const loadTaskData = async (id) => {
//     const config = {
//       url: `/tasks/${id}`,
//       method: 'get',
//       headers: { Authorization: authState.token },
//     };
    
//     try {
//       const data = await fetchData(config, { showSuccessToast: false });
//       if (data?.task) {
//         setCurrentTaskId(data.task._id);
//         setFormData({
//           taskId: data.task.taskId || '',
//           title: data.task.title,
//           description: data.task.description,
//           startDate: data.task.startDate?.split('T')[0] || '',
//           endDate: data.task.endDate?.split('T')[0] || '',
//           time: data.task.time || '',
//           members: data.task.members || [],
//           progress: data.task.progress || 0,
//           createdBy: data.task.createdBy || ''
//         });
//         setIsCreator(data.task.createdBy === authState.user._id);
//         setSearchedTask(false);
//       }
//     } catch (error) {
//       console.error('Error loading task:', error);
//     }
//   };

//   const handleSearch = async (e) => {
//     e.preventDefault();
//     setSearchLoading(true);
//     setSearchError('');

//     if (!searchTaskId.trim()) {
//       setSearchError('Please enter a Task ID');
//       setSearchLoading(false);
//       return;
//     }

//     try {
//       const config = {
//         url: `/tasks/find?taskId=${searchTaskId}`,
//         method: 'get',
//         headers: { Authorization: authState.token },
//       };

//       const data = await fetchData(config, { showSuccessToast: false });
//       if (data?.task) {
//         const foundTask = data.task;
//         setCurrentTaskId(foundTask._id);
//         setMode('update');
//         setFormData({
//           taskId: foundTask.taskId || '',
//           title: foundTask.title,
//           description: foundTask.description,
//           startDate: foundTask.startDate?.split('T')[0] || '',
//           endDate: foundTask.endDate?.split('T')[0] || '',
//           time: foundTask.time || '',
//           members: foundTask.members || [],
//           progress: foundTask.progress || 0,
//           createdBy: foundTask.createdBy || ''
//         });
//         setIsCreator(foundTask.createdBy === authState.user._id);
//         setSearchedTask(true);
//       } else {
//         setSearchError('Task not found');
//         resetForm();
//       }
//     } catch (error) {
//       console.error('Search error:', error);
//       setSearchError('Error searching for task');
//       resetForm();
//     } finally {
//       setSearchLoading(false);
//     }
//   };

//   const resetForm = () => {
//     setFormData({
//       taskId: '',
//       title: '',
//       description: '',
//       startDate: '',
//       endDate: '',
//       time: '',
//       members: [],
//       progress: 0,
//       createdBy: ''
//     });
//     setCurrentTaskId('');
//     setMode('add');
//     setIsCreator(false);
//     setSearchedTask(false);
//   };

//   const handleChange = (e) => {
//     if (!isCreator && mode === 'update') return;
//     setFormData({
//       ...formData,
//       [e.target.name]: e.target.value,
//     });
//   };

//   const isCurrentUserTeamMember = (memberName) => {
//     return authState.user?.name === memberName;
//   };

//   const handleAddMember = (e) => {
//     if (e) e.preventDefault();
//     if (!(mode === 'add' || isCreator)) return;
//     if (!newMemberName.trim()) return;

//     const exists = formData.members.some(
//       member => member.name.toLowerCase() === newMemberName.trim().toLowerCase()
//     );
    
//     if (exists) {
//       alert('Member already exists.');
//       return;
//     }

//     setFormData(prev => ({
//       ...prev,
//       members: [...prev.members, {
//         name: newMemberName.trim(),
//         totalProgress: 0,
//         currentProgress: 0
//       }]
//     }));

//     setNewMemberName('');
//     setShowAddMemberForm(false);
//   };

//   const handleDailyProgressChange = (index, value) => {
//     if (!isCurrentUserTeamMember(formData.members[index].name)) return;
    
//     const inputValue = value === '' ? 0 : Number(value);
//     if (isNaN(inputValue)) return;

//     const updated = [...formData.members];
//     updated[index].currentProgress = Math.min(Math.max(inputValue, 0), 100);
//     setFormData({ ...formData, members: updated });
//   };

//   const updateProgress = (index) => {
//     if (!isCurrentUserTeamMember(formData.members[index].name)) return;
    
//     const updated = [...formData.members];
//     updated[index].totalProgress = Math.min(
//       (updated[index].totalProgress || 0) + (updated[index].currentProgress || 0),
//       100
//     );
//     updated[index].currentProgress = 0;

//     const totalProgress = updated.reduce((sum, member) => sum + (member.totalProgress || 0), 0);
//     const averageProgress = updated.length > 0 
//       ? Math.round(totalProgress / updated.length) 
//       : 0;

//     setFormData({
//       ...formData,
//       members: updated,
//       progress: averageProgress
//     });
//   };

//   const handleKeyDown = (e, index) => {
//     if (e.key === 'Enter') {
//       e.preventDefault();
//       updateProgress(index);
//     }
//   };

//   const handleRemoveMember = (index) => {
//     if (!(mode === 'add' || isCreator)) return;
    
//     const updatedMembers = formData.members.filter((_, i) => i !== index);
//     const totalProgress = updatedMembers.reduce((sum, member) => sum + (member.totalProgress || 0), 0);
//     const averageProgress = updatedMembers.length > 0 
//       ? Math.round(totalProgress / updatedMembers.length) 
//       : 0;

//     setFormData({ 
//       ...formData, 
//       members: updatedMembers,
//       progress: averageProgress
//     });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     if (mode === 'update' && !isCreator) {
//       alert('Only the task creator can update this task.');
//       return;
//     }

//     const errors = validateManyFields('task', formData);
//     if (errors.length > 0) {
//       alert('Please fix validation errors before submitting.');
//       return;
//     }

//     const config = {
//       url: mode === 'add' ? '/tasks' : `/tasks/${currentTaskId}`,
//       method: mode === 'add' ? 'post' : 'put',
//       data: formData,
//       headers: { Authorization: authState.token },
//     };
    
//     try {
//       await fetchData(config);
//       navigate('/');
//     } catch (error) {
//       console.error('Error saving task:', error);
//     }
//   };

//   return (
//     <MainLayout>
//       <div className="max-w-3xl mx-auto my-8">
//         {/* Search Section */}
//         <div className="bg-white p-6 rounded-lg shadow-md mb-8">
//           <h2 className="text-xl font-semibold mb-4">Search Task</h2>
//           <form onSubmit={handleSearch} className="flex gap-2">
//             <input
//               type="text"
//               value={searchTaskId}
//               onChange={(e) => setSearchTaskId(e.target.value)}
//               className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
//               placeholder="Enter Task ID"
//             />
//             <button
//               type="submit"
//               className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition"
//               disabled={searchLoading}
//             >
//               {searchLoading ? 'Searching...' : 'Search'}
//             </button>
//           </form>
//           {searchError && <p className="mt-2 text-red-500">{searchError}</p>}
//         </div>

//         {/* Task Form */}
//         <form className="bg-white border rounded-lg shadow-lg p-10 flex flex-col gap-6" onSubmit={handleSubmit}>
//           {loading ? (
//             <div className="flex justify-center items-center h-64">
//               <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
//             </div>
//           ) : (
//             <>
//               <h2 className="text-3xl font-semibold text-center text-gray-800 mb-6">
//                 {mode === 'add' ? 'Add New Team Task' : 'Edit Team Task'}
//                 {mode === 'update' && !isCreator && ' (Read Only)'}
//               </h2>

//               {/* Task Fields */}
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div className="flex flex-col">
//                   <label className="mb-2 font-medium text-gray-700">Task ID</label>
//                   <input
//                     name="taskId"
//                     value={formData.taskId}
//                     onChange={handleChange}
//                     className={`px-4 py-3 border rounded-md focus:outline-none transition ${
//                       !isCreator && mode === 'update' ? 'bg-gray-100 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-400'
//                     }`}
//                     readOnly={!isCreator && mode === 'update'}
//                   />
//                 </div>

//                 <div className="flex flex-col">
//                   <label className="mb-2 font-medium text-gray-700">Title</label>
//                   <input
//                     name="title"
//                     value={formData.title}
//                     onChange={handleChange}
//                     className={`px-4 py-3 border rounded-md focus:outline-none transition ${
//                       !isCreator && mode === 'update' ? 'bg-gray-100 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-400'
//                     }`}
//                     readOnly={!isCreator && mode === 'update'}
//                   />
//                 </div>
//               </div>

//               {/* Description */}
//               <div className="flex flex-col">
//                 <label className="mb-2 font-medium text-gray-700">Description</label>
//                 <textarea
//                   name="description"
//                   value={formData.description}
//                   onChange={handleChange}
//                   className={`px-4 py-3 border rounded-md focus:outline-none transition min-h-[120px] ${
//                     !isCreator && mode === 'update' ? 'bg-gray-100 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-400'
//                   }`}
//                   readOnly={!isCreator && mode === 'update'}
//                 />
//               </div>

//               {/* Dates and Time */}
//               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                 <div className="flex flex-col">
//                   <label className="mb-2 font-medium text-gray-700">Start Date</label>
//                   <input
//                     type="date"
//                     name="startDate"
//                     value={formData.startDate}
//                     onChange={handleChange}
//                     className={`px-4 py-3 border rounded-md focus:outline-none transition ${
//                       !isCreator && mode === 'update' ? 'bg-gray-100 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-400'
//                     }`}
//                     readOnly={!isCreator && mode === 'update'}
//                   />
//                 </div>

//                 <div className="flex flex-col">
//                   <label className="mb-2 font-medium text-gray-700">End Date</label>
//                   <input
//                     type="date"
//                     name="endDate"
//                     value={formData.endDate}
//                     onChange={handleChange}
//                     className={`px-4 py-3 border rounded-md focus:outline-none transition ${
//                       !isCreator && mode === 'update' ? 'bg-gray-100 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-400'
//                     }`}
//                     readOnly={!isCreator && mode === 'update'}
//                   />
//                 </div>

//                 <div className="flex flex-col">
//                   <label className="mb-2 font-medium text-gray-700">Time</label>
//                   <input
//                     type="time"
//                     name="time"
//                     value={formData.time}
//                     onChange={handleChange}
//                     className={`px-4 py-3 border rounded-md focus:outline-none transition ${
//                       !isCreator && mode === 'update' ? 'bg-gray-100 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-400'
//                     }`}
//                     readOnly={!isCreator && mode === 'update'}
//                   />
//                 </div>
//               </div>

//               {/* Team Members Section */}
//               <div className="mt-6">
//                 <div className="flex justify-between items-center mb-4">
//                   <h3 className="text-xl font-semibold text-gray-800">Team Members</h3>
//                   {(mode === 'add' || isCreator) && (
//                     <button
//                       type="button"
//                       onClick={() => setShowAddMemberForm(true)}
//                       className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2"
//                     >
//                       <span>+ Add Member</span>
//                     </button>
//                   )}
//                 </div>

//                 {/* Add Member Form */}
//                 {showAddMemberForm && (mode === 'add' || isCreator) && (
//                   <div className="bg-gray-50 p-4 rounded-lg mb-4">
//                     <div className="flex gap-2">
//                       <input
//                         type="text"
//                         value={newMemberName}
//                         onChange={(e) => setNewMemberName(e.target.value)}
//                         className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
//                         placeholder="Enter member name"
//                         autoFocus
//                       />
//                       <button
//                         type="button"
//                         onClick={handleAddMember}
//                         className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition"
//                       >
//                         Add
//                       </button>
//                       <button
//                         type="button"
//                         onClick={() => setShowAddMemberForm(false)}
//                         className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition"
//                       >
//                         Cancel
//                       </button>
//                     </div>
//                   </div>
//                 )}

//                 <div className="space-y-4">
//                   {formData.members.map((member, index) => (
//                     <div key={index} className="bg-gray-50 p-4 rounded-lg">
//                       <div className="flex flex-col md:flex-row md:items-center gap-4">
//                         <div className="flex-1">
//                           <span className="font-medium text-gray-800">{member.name}</span>
//                           {isCurrentUserTeamMember(member.name) && (
//                             <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
//                               You
//                             </span>
//                           )}
//                         </div>
                        
//                         <div className="flex items-center gap-2">
//                           <input
//                             type="number"
//                             min="0"
//                             max="100"
//                             value={member.currentProgress || ''}
//                             onChange={(e) => handleDailyProgressChange(index, e.target.value)}
//                             onBlur={() => updateProgress(index)}
//                             onKeyDown={(e) => handleKeyDown(e, index)}
//                             className={`w-24 px-3 py-2 border rounded-md focus:outline-none transition ${
//                               !isCurrentUserTeamMember(member.name) 
//                                 ? 'bg-gray-100 cursor-not-allowed' 
//                                 : 'focus:ring-2 focus:ring-blue-400'
//                             }`}
//                             readOnly={!isCurrentUserTeamMember(member.name)}
//                           />
//                           {(mode === 'add' || isCreator) && (
//                             <button
//                               type="button"
//                               onClick={() => handleRemoveMember(index)}
//                               className="text-red-500 hover:text-red-700 px-3 py-2"
//                             >
//                               Remove
//                             </button>
//                           )}
//                         </div>
//                       </div>

//                       <div className="mt-3">
//                         <div className="flex items-center gap-4">
//                           <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
//                             <div
//                               style={{ width: `${member.totalProgress}%` }}
//                               className="h-full bg-blue-500 rounded-full"
//                             />
//                           </div>
//                           <span className="font-medium text-gray-700">{member.totalProgress}%</span>
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>

//               {/* Overall Progress */}
//               <div className="bg-blue-50 p-4 rounded-lg">
//                 <h3 className="text-lg font-semibold text-gray-800 mb-3">Overall Team Progress</h3>
//                 <div className="flex items-center gap-4">
//                   <div className="flex-1 bg-gray-200 h-3 rounded-full overflow-hidden">
//                     <div
//                       style={{ width: `${formData.progress}%` }}
//                       className="h-full bg-green-500 rounded-full"
//                     />
//                   </div>
//                   <span className="font-bold text-gray-800">{formData.progress}%</span>
//                 </div>
//               </div>

//               {/* Action Buttons */}
//               <div className="flex justify-center gap-4 mt-8">
//                 {mode === 'add' ? (
//                   <button
//                     type="submit"
//                     className="bg-blue-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-blue-700 transition"
//                   >
//                     Add Task
//                   </button>
//                 ) : isCreator ? (
//                   <>
//                     <button
//                       type="submit"
//                       className="bg-green-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-green-700 transition"
//                     >
//                       Update Task
//                     </button>
//                     <button
//                       type="button"
//                       onClick={resetForm}
//                       className="bg-yellow-500 text-white px-6 py-3 rounded-md font-semibold hover:bg-yellow-600 transition"
//                     >
//                       Reset Changes
//                     </button>
//                   </>
//                 ) : null}
//                 <button
//                   type="button"
//                   onClick={() => navigate('/')}
//                   className="bg-red-500 text-white px-6 py-3 rounded-md font-semibold hover:bg-red-600 transition"
//                 >
//                   Cancel
//                 </button>
//               </div>
//             </>
//           )}
//         </form>
//       </div>
//     </MainLayout>
//   );
// };

// export default TaskTeam;

// saibalaji-11/taskmanagertool/TaskManagerTool-e7ea819678c577921747c30e4d013d404526b8e5/frontend/src/pages/TeamTask.jsx

// import React, { useEffect, useState } from 'react';
// import { useSelector } from 'react-redux';
// import { useNavigate, useParams } from 'react-router-dom';
// import useFetch from '../hooks/useFetch';
// import MainLayout from '../layouts/MainLayout';
// import validateManyFields from '../validations';

// const TaskTeam = () => {
//   const authState = useSelector((state) => state.authReducer);
//   const navigate = useNavigate();
//   const [fetchData, { loading }] = useFetch();
//   const { taskId } = useParams();

//   const [mode, setMode] = useState(taskId ? 'update' : 'add');
//   const [formData, setFormData] = useState({
//     taskId: '',
//     title: '',
//     description: '',
//     startDate: '',
//     endDate: '',
//     time: '',
//     members: [],
//     progress: 0
//   });

//   const [newMemberName, setNewMemberName] = useState('');
//   const [showAddMemberForm, setShowAddMemberForm] = useState(false);
//   const [searchTaskId, setSearchTaskId] = useState('');
//   const [searchError, setSearchError] = useState('');
//   const [searchLoading, setSearchLoading] = useState(false);
//   const [currentTaskId, setCurrentTaskId] = useState('');
//   const [membersReadOnly, setMembersReadOnly] = useState(false);
//   // START: ADDED STATE FOR PERMISSIONS
//   const [isCreator, setIsCreator] = useState(false);
//   const loggedInUserName = authState.user?.name; // Assuming logged-in user name is here
//   // END: ADDED STATE FOR PERMISSIONS

//   useEffect(() => {
//     document.title = mode === 'add' ? 'Add TeamTask' : 'Update TeamTask';
//   }, [mode]);

//   useEffect(() => {
//     if (mode === 'update' && taskId) {
//       loadTaskData(taskId);
//     } else {
//       // Reset permissions state when switching to add mode
//       setMembersReadOnly(false);
//       setIsCreator(false);
//     }
//   }, [mode, taskId]);

//   const loadTaskData = (id) => {
//     const config = {
//       url: `/tasks/${id}`,
//       method: 'get',
//       headers: { Authorization: authState.token },
//     };
//     fetchData(config, { showSuccessToast: false }).then((data) => {
//       if (data.task) {
//         // START: ADDED CREATOR/READ-ONLY LOGIC
//         const creatorId = data.task.createdBy;
//         const loggedInUserId = authState.user?._id; // Assuming user ID is available
//         const isUserCreator = creatorId === loggedInUserId;
        
//         setIsCreator(isUserCreator);
//         setMembersReadOnly(!isUserCreator); // Task details are read-only for non-creators
//         // END: ADDED CREATOR/READ-ONLY LOGIC

//         setCurrentTaskId(data.task._id);
//         setFormData({
//           taskId: data.task.taskId || '',
//           title: data.task.title,
//           description: data.task.description,
//           startDate: data.task.startDate.split('T')[0],
//           endDate: data.task.endDate.split('T')[0],
//           time: data.task.time || '',
//           members: data.task.members || [],
//           progress: data.task.progress || 0
//         });
//         setSearchTaskId(data.task.taskId || '');
//       }
//     });
//   };

//   const handleSearch = async (e) => {
//     e.preventDefault();
//     setSearchLoading(true);
//     setSearchError('');

//     if (!searchTaskId.trim()) {
//       setSearchError('Please enter a Task ID');
//       setSearchLoading(false);
//       return;
//     }

//     try {
//       const config = {
//         url: `/tasks/find?taskId=${searchTaskId}`,
//         method: 'get',
//         headers: { Authorization: authState.token },
//       };

//       const data = await fetchData(config, { showSuccessToast: false });
//       if (data && data.task) {
//         const foundTask = data.task;
        
//         // START: ADDED CREATOR/READ-ONLY LOGIC
//         const creatorId = foundTask.createdBy;
//         const loggedInUserId = authState.user?._id;
//         const isUserCreator = creatorId === loggedInUserId;
        
//         setIsCreator(isUserCreator);
//         setMembersReadOnly(!isUserCreator); // Task details are read-only for non-creators
//         // END: ADDED CREATOR/READ-ONLY LOGIC

//         setCurrentTaskId(foundTask._id);
//         setMode('update');
//         setFormData({
//           taskId: foundTask.taskId || '',
//           title: foundTask.title,
//           description: foundTask.description,
//           startDate: foundTask.startDate.split('T')[0],
//           endDate: foundTask.endDate.split('T')[0],
//           time: foundTask.time || '',
//           members: foundTask.members || [],
//           progress: foundTask.progress || 0
//         });
//         setSearchError('');
//       } else {
//         setSearchError('Task not found');
//         resetForm();
//       }
//     } catch (error) {
//       console.error('Search error:', error);
//       setSearchError('Error searching for task');
//       resetForm();
//     } finally {
//       setSearchLoading(false);
//     }
//   };

//   const resetForm = () => {
//     setFormData({
//       taskId: '',
//       title: '',
//       description: '',
//       startDate: '',
//       endDate: '',
//       time: '',
//       members: [],
//       progress: 0
//     });
//     setCurrentTaskId('');
//     setMode('add');
//     setMembersReadOnly(false);
//     setIsCreator(false); // ADDED: Reset creator status
//   };

//   const handleChange = (e) => {
//     // START: ADDED READ-ONLY CHECK FOR MAIN FIELDS
//     if (membersReadOnly) return;
//     // END: ADDED READ-ONLY CHECK FOR MAIN FIELDS
//     setFormData({
//       ...formData,
//       [e.target.name]: e.target.value,
//     });
//   };

//   const handleAddMember = (e) => {
//     if (e) e.preventDefault();
//     if (membersReadOnly) return; // Only creator can add/remove members
//     if (!newMemberName.trim()) return;

//     const exists = formData.members.some(
//       member => member.name.toLowerCase() === newMemberName.trim().toLowerCase()
//     );
    
//     if (exists) {
//       alert('Member with this name already exists.');
//       return;
//     }

//     const newMember = {
//       name: newMemberName.trim(),
//       totalProgress: 0,
//       currentProgress: 0
//     };

//     setFormData(prev => ({
//       ...prev,
//       members: [...prev.members, newMember]
//     }));

//     setNewMemberName('');
//     setShowAddMemberForm(false);
//   };

//   const handleAddMemberClick = () => {
//     handleAddMember(null);
//   };

//   const handleDailyProgressChange = (index, value) => {
//     // START: ADDED PERMISSION CHECK
//     const isCurrentUser = loggedInUserName && formData.members[index].name.trim().toLowerCase() === loggedInUserName.toLowerCase();
//     const canEditProgress = isCreator || isCurrentUser;

//     if (!canEditProgress) return;
//     // END: ADDED PERMISSION CHECK

//     const inputProgress = value === '' ? 0 : Number(value);
//     if (isNaN(inputProgress)) return;

//     const updated = [...formData.members];
//     updated[index].currentProgress = Math.min(Math.max(inputProgress, 0), 100);
//     setFormData({ ...formData, members: updated });
//   };

//   const updateProgress = (index) => {
//     // START: ADDED PERMISSION CHECK
//     const isCurrentUser = loggedInUserName && formData.members[index].name.trim().toLowerCase() === loggedInUserName.toLowerCase();
//     const canEditProgress = isCreator || isCurrentUser;

//     if (!canEditProgress) return;
//     // END: ADDED PERMISSION CHECK

//     const updated = [...formData.members];
//     const inputProgress = updated[index].currentProgress || 0;
    
//     updated[index].totalProgress = Math.min(
//       Math.max((updated[index].totalProgress || 0) + inputProgress, 0), 
//       100
//     );
//     updated[index].currentProgress = 0;

//     const totalProgress = updated.reduce((sum, member) => sum + member.totalProgress, 0);
//     const averageProgress = updated.length > 0 
//       ? Math.round(totalProgress / updated.length) 
//       : 0;

//     setFormData({
//       ...formData,
//       members: updated,
//       progress: averageProgress
//     });
//   };

//   const handleKeyDown = (e, index) => {
//     if (e.key === 'Enter') {
//       e.preventDefault();
      
//       // START: ADDED PERMISSION CHECK
//       const isCurrentUser = loggedInUserName && formData.members[index].name.trim().toLowerCase() === loggedInUserName.toLowerCase();
//       const canEditProgress = isCreator || isCurrentUser;

//       if (!canEditProgress) return;
//       // END: ADDED PERMISSION CHECK
      
//       updateProgress(index);
//     }
//   };

//   const handleRemoveMember = (index) => {
//     if (membersReadOnly) return; // Only creator can add/remove members
//     const updatedMembers = formData.members.filter((_, i) => i !== index);
//     const totalProgress = updatedMembers.reduce((sum, member) => sum + member.totalProgress, 0);
//     const averageProgress = updatedMembers.length > 0 
//       ? Math.round(totalProgress / updatedMembers.length) 
//       : 0;

//     setFormData({ 
//       ...formData, 
//       members: updatedMembers,
//       progress: averageProgress
//     });
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
    
//     // START: ADDED VALIDATION CHECK FOR NON-CREATOR SUBMISSION
//     if (!isCreator && mode === 'update') {
//         // For non-creators, simple submit without full validation
//         const currentUserMember = formData.members.find(
//             member => loggedInUserName && member.name.trim().toLowerCase() === loggedInUserName.toLowerCase()
//         );
//         if (!currentUserMember) {
//             alert("You are not a member of this task.");
//             return;
//         }
//     } else {
//         // Normal validation for Add mode or Creator update mode
//         const errors = validateManyFields('task', formData);

//         if (errors.length > 0) {
//           return;
//         }
//     }
//     // END: ADDED VALIDATION CHECK FOR NON-CREATOR SUBMISSION

//     // Use currentTaskId (MongoDB _id) for updates
//     const endpoint = mode === 'add' ? '/tasks' : `/tasks/${currentTaskId}`;
    
//     const config = {
//       url: endpoint,
//       method: mode === 'add' ? 'post' : 'put',
//       data: formData,
//       headers: { Authorization: authState.token },
//     };
    
//     fetchData(config).then(() => {
//       navigate('/');
//     });
//   };

//   return (
//     <MainLayout>
//       <div className="max-w-3xl mx-auto my-8">
//         {/* Search Section */}
//         <div className="bg-white p-6 rounded-lg shadow-md mb-8">
//           <h2 className="text-xl font-semibold mb-4">Search Task</h2>
//           <form onSubmit={handleSearch} className="flex gap-2">
//             <input
//               type="text"
//               value={searchTaskId}
//               onChange={(e) => setSearchTaskId(e.target.value)}
//               className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none
//                          focus:ring-2 focus:ring-blue-400 transition"
//               placeholder="Enter Task ID"
//             />
//             <button
//               type="submit"
//               className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition"
//               disabled={searchLoading}
//             >
//               {searchLoading ? (
//                 <>
//                   <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                   </svg>
//                   Searching...
//                 </>
//               ) : 'Search'}
//             </button>
//           </form>
//           {searchError && <p className="mt-2 text-red-500">{searchError}</p>}
//         </div>

//         {/* Task Form */}
//         <form
//           className="bg-white border rounded-lg shadow-lg p-10 flex flex-col gap-6"
//           onSubmit={handleSubmit}
//         >
//           {loading ? (
//             <div className="flex justify-center items-center h-64">
//               <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
//             </div>
//           ) : (
//             <>
//               <h2 className="text-3xl font-semibold text-center text-gray-800 mb-6">
//                 {mode === 'add' ? 'Add New Team Task' : 'Edit Team Task'}
//               </h2>

//               {/* Task ID */}
//               <div className="flex flex-col">
//                 <label
//                   htmlFor="taskId"
//                   className="mb-2 font-medium text-gray-700 hover:text-blue-600 transition-colors"
//                 >
//                   Task ID
//                 </label>
//                 <input
//                   type="text"
//                   name="taskId"
//                   id="taskId"
//                   value={formData.taskId}
//                   onChange={handleChange}
//                   readOnly={membersReadOnly} 
//                   className="px-4 py-3 border border-gray-300 rounded-md focus:outline-none
//                              focus:ring-2 focus:ring-blue-400 transition"
//                   placeholder="Enter task ID"
//                 />
//               </div>

//               {/* Title */}
//               <div className="flex flex-col">
//                 <label
//                   htmlFor="title"
//                   className="mb-2 font-medium text-gray-700 hover:text-blue-600 transition-colors"
//                 >
//                   Title
//                 </label>
//                 <input
//                   type="text"
//                   name="title"
//                   id="title"
//                   value={formData.title}
//                   onChange={handleChange}
//                   readOnly={membersReadOnly}
//                   className="px-4 py-3 border border-gray-300 rounded-md focus:outline-none
//                              focus:ring-2 focus:ring-blue-400 transition"
//                   placeholder="Enter task title"
//                 />
//               </div>

//               {/* Description */}
//               <div className="flex flex-col">
//                 <label
//                   htmlFor="description"
//                   className="mb-2 font-medium text-gray-700 hover:text-blue-600 transition-colors"
//                 >
//                   Description
//                 </label>
//                 <textarea
//                   name="description"
//                   id="description"
//                   value={formData.description}
//                   onChange={handleChange}
//                   readOnly={membersReadOnly} 
//                   className="px-4 py-3 border border-gray-300 rounded-md focus:outline-none
//                              focus:ring-2 focus:ring-blue-400 transition min-h-[120px]"
//                   placeholder="Mention the names and Roles of Team members"
//                 />
//               </div>

//               {/* Dates and Time */}
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div className="flex flex-col">
//                   <label
//                     htmlFor="startDate"
//                     className="mb-2 font-medium text-gray-700 hover:text-blue-600 transition-colors"
//                   >
//                     Start Date
//                   </label>
//                   <input
//                     type="date"
//                     name="startDate"
//                     id="startDate"
//                     value={formData.startDate}
//                     onChange={handleChange}
//                     readOnly={membersReadOnly} 
//                     className="px-4 py-3 border border-gray-300 rounded-md focus:outline-none
//                                focus:ring-2 focus:ring-blue-400 transition"
//                   />
//                 </div>

//                 <div className="flex flex-col">
//                   <label
//                     htmlFor="endDate"
//                     className="mb-2 font-medium text-gray-700 hover:text-blue-600 transition-colors"
//                   >
//                     End Date
//                   </label>
//                   <input
//                     type="date"
//                     name="endDate"
//                     id="endDate"
//                     value={formData.endDate}
//                     onChange={handleChange}
//                     readOnly={membersReadOnly} 
//                     className="px-4 py-3 border border-gray-300 rounded-md focus:outline-none
//                                focus:ring-2 focus:ring-blue-400 transition"
//                   />
//                 </div>
//               </div>

//               <div className="flex flex-col">
//                 <label
//                   htmlFor="time"
//                   className="mb-2 font-medium text-gray-700 hover:text-blue-600 transition-colors"
//                 >
//                   Time
//                 </label>
//                 <input
//                   type="time"
//                   name="time"
//                   id="time"
//                   value={formData.time}
//                   onChange={handleChange}
//                   readOnly={membersReadOnly} 
//                   className="px-4 py-3 border border-gray-300 rounded-md focus:outline-none
//                              focus:ring-2 focus:ring-blue-400 transition"
//                 />
//               </div>

//               {/* Team Members Section */}
//               <div className="mt-6">
//                 <div className="flex justify-between items-center mb-4">
//                   <h3 className="text-xl font-semibold text-gray-800">Team Members</h3>
//                   {/* Only creator can add members */}
//                   {!membersReadOnly && (
//                     <button
//                       type="button"
//                       onClick={() => setShowAddMemberForm(true)}
//                       className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2"
//                     >
//                       <span>+ Add Member</span>
//                     </button>
//                   )}
//                 </div>

//                 {/* Add Member Form (Only visible to creator) */}
//                 {showAddMemberForm && !membersReadOnly && (
//                   <div className="bg-gray-50 p-4 rounded-lg mb-4">
//                     <div className="flex gap-2">
//                       <input
//                         type="text"
//                         value={newMemberName}
//                         onChange={(e) => setNewMemberName(e.target.value)}
//                         className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none
//                                    focus:ring-2 focus:ring-blue-400 transition"
//                         placeholder="Enter member name"
//                         autoFocus
//                       />
//                       <button
//                         type="button"
//                         onClick={handleAddMemberClick}
//                         className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition"
//                       >
//                         Add
//                       </button>
//                       <button
//                         type="button"
//                         onClick={() => setShowAddMemberForm(false)}
//                         className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition"
//                       >
//                         Cancel
//                       </button>
//                     </div>
//                   </div>
//                 )}

//                 <div className="space-y-4">
//                   {formData.members.map((member, index) => {
//                     // MEMBER-SPECIFIC PERMISSION CHECK
//                     const isCurrentUser = loggedInUserName && member.name.trim().toLowerCase() === loggedInUserName.toLowerCase();
//                     const canEditProgress = isCreator || isCurrentUser;

//                     return (
//                       <div key={index} className="bg-gray-50 p-4 rounded-lg">
//                         <div className="flex flex-col md:flex-row md:items-center gap-4">
//                           <div className="flex-1">
//                             <span className="font-medium text-gray-800">{member.name}</span>
//                           </div>
                          
//                           <div className="flex items-center gap-2">
//                             <input
//                               type="number"
//                               min="0"
//                               max="100"
//                               placeholder="Today's progress"
//                               value={member.currentProgress || ''}
//                               onChange={(e) => handleDailyProgressChange(index, e.target.value)}
//                               onBlur={() => canEditProgress && updateProgress(index)}
//                               onKeyDown={(e) => canEditProgress && handleKeyDown(e, index)}
//                               readOnly={!canEditProgress} 
//                               className={`w-24 px-3 py-2 border rounded-md focus:outline-none
//                                          focus:ring-2 transition ${!canEditProgress ? 'bg-gray-200 border-gray-300' : 'bg-white border-gray-300 focus:ring-blue-400'}`}
//                             />
//                             {/* Only creator can remove members */}
//                             {!membersReadOnly && (
//                               <button
//                                 type="button"
//                                 onClick={() => handleRemoveMember(index)}
//                                 className="text-red-500 hover:text-red-700 px-3 py-2"
//                               >
//                                 Remove
//                               </button>
//                             )}
//                           </div>
//                         </div>

//                         <div className="mt-3">
//                           <div className="flex items-center gap-4">
//                             <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
//                               <div
//                                 style={{ width: `${member.totalProgress}%` }}
//                                 className="h-full bg-blue-500 rounded-full"
//                               />
//                             </div>
//                             <span className="font-medium text-gray-700">{member.totalProgress}%</span>
//                           </div>
//                         </div>
//                       </div>
//                     );
//                   })}
//                 </div>
//               </div>

//               {/* Overall Progress */}
//               <div className="bg-blue-50 p-4 rounded-lg">
//                 <h3 className="text-lg font-semibold text-gray-800 mb-3">Overall Team Progress</h3>
//                 <div className="flex items-center gap-4">
//                   <div className="flex-1 bg-gray-200 h-3 rounded-full overflow-hidden">
//                     <div
//                       style={{ width: `${formData.progress}%` }}
//                       className="h-full bg-green-500 rounded-full"
//                     />
//                   </div>
//                   <span className="font-bold text-gray-800">{formData.progress}%</span>
//                 </div>
//               </div>

//               {/* Action Buttons */}
//               <div className="flex justify-center gap-4 mt-8">
//                 {mode === 'add' ? (
//                   <button
//                     type="submit"
//                     className="bg-blue-600 text-white px-6 py-3 rounded-md font-semibold
//                                hover:bg-blue-700 transition flex items-center gap-2"
//                   >
//                     Add Task
//                   </button>
//                 ) : (
//                   <>
//                     <button
//                       type="submit"
//                       className="bg-green-600 text-white px-6 py-3 rounded-md font-semibold
//                                  hover:bg-green-700 transition flex items-center gap-2"
//                     >
//                       {/* Dynamically change button text */}
//                       {isCreator ? 'Update Task' : 'Submit My Progress'}
//                     </button>
//                     {/* Only creator can reset form */}
//                     {isCreator && (
//                       <button
//                         type="button"
//                         onClick={resetForm}
//                         className="bg-yellow-500 text-white px-6 py-3 rounded-md font-semibold
//                                    hover:bg-yellow-600 transition flex items-center gap-2"
//                       >
//                         Reset Changes
//                       </button>
//                     )}
//                   </>
//                 )}
//                 <button
//                   type="button"
//                   onClick={() => navigate('/')}
//                   className="bg-red-500 text-white px-6 py-3 rounded-md font-semibold
//                              hover:bg-red-600 transition"
//                 >
//                   Cancel
//                 </button>
//               </div>
//             </>
//           )}
//         </form>
//       </div>
//     </MainLayout>
//   );
// };

// export default TaskTeam;