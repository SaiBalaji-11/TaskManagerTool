// src/components/Tasks.jsx
import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import useFetch from '../hooks/useFetch';
import Loader from './utils/Loader';
import Tooltip from './utils/Tooltip';
import moment from 'moment';

const Tasks = () => {
  const authState = useSelector((state) => state.authReducer);
  const [personalTasks, setPersonalTasks] = useState([]);
  const [teamTasks, setTeamTasks] = useState([]);
  const [fetchData, { loading }] = useFetch();
  const navigate = useNavigate();

  // fetch tasks from server
  const fetchTasks = useCallback(() => {
    const config = { url: '/tasks', method: 'get', headers: { Authorization: authState.token } };
    return fetchData(config, { showSuccessToast: false }).then(data => {
      setPersonalTasks(data.personalTasks || []);
      setTeamTasks(data.teamTasks || []);
    }).catch(err => {
      console.error('Fetch tasks error:', err);
    });
  }, [authState.token, fetchData]);

  useEffect(() => {
    if (!authState.isLoggedIn) return;
    fetchTasks();
  }, [authState.isLoggedIn, fetchTasks]);

  // Navigate to edit page - if isTeam true -> teamtask page else personal task page
  const handleEdit = (taskId, isTeam = false) => {
    if (!taskId) return;
    if (isTeam) {
      // navigate to team task edit route
      navigate(`/teamtask/${taskId}`);
    } else {
      // navigate to personal task edit route
      navigate(`/tasks/${taskId}`);
    }
  };

  // Delete task (works for both personal and team)
  const handleDelete = async (id) => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      const config = {
        url: `/tasks/${id}`,
        method: 'delete',
        headers: { Authorization: authState.token }
      };
      const response = await fetchData(config);
      if (response && response.status) {
        // refresh after delete
        fetchTasks();
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  // Optional: update handler if you want to PUT updates from this component
  const handleUpdate = async (id, updatedData) => {
    if (!id) return;
    try {
      const config = {
        url: `/tasks/${id}`,
        method: 'put',
        data: updatedData,
        headers: { Authorization: authState.token }
      };
      const res = await fetchData(config);
      if (res?.status) {
        fetchTasks();
      }
    } catch (err) {
      console.error('Update error:', err);
    }
  };

  // Reuse your reminder rendering function (keep same behaviour)
  const getReminderDetails = (endDate, endTime) => {
    if (!endDate) return null;
    const now = moment();
    let end = moment(endDate);

    if (endTime) {
      const [hours, minutes] = (endTime || '').split(':');
      if (!isNaN(+hours) && !isNaN(+minutes)) end.set({ hour: +hours, minute: +minutes });
    }

    if (!end.isValid()) return null;
    const diffMinutes = end.diff(now, 'minutes');

    if (diffMinutes <= 0) {
      const formattedTime = endTime ? ` at ${end.format('h:mm A')}` : '';
      return { message: `⚠️ Deadline exceeded on ${end.format('MMM D')}${formattedTime}`, bg: 'bg-gray-100', color: 'text-gray-700' };
    }
    if (now.isSame(end, 'day')) {
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours >= 1) return { message: `⏳ ${diffHours} hour${diffHours !== 1 ? 's' : ''} remaining until deadline`, bg: 'bg-red-100', color: 'text-red-800' };
      return { message: `⏳ ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} remaining until deadline`, bg: 'bg-red-200', color: 'text-red-900' };
    }
    return { message: `🔔 Scheduled for ${end.format('MMM D')}${endTime ? ` at ${end.format('h:mm A')}` : ''}`, bg: 'bg-blue-50', color: 'text-blue-800' };
  };

  const renderReminder = (task) => {
    const reminder = getReminderDetails(task.endDate || task.end_date, task.time || task.endTime || task.end_time);
    if (!reminder) return null;
    return (
      <div className={`mt-4 p-3 rounded-md ${reminder.bg} ${reminder.color}`}>
        <p className="text-sm font-medium">{reminder.message}</p>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Tasks</h1>
        <div className="flex gap-3">
          <Link to="/tasks/add" className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
            <i className="fas fa-plus mr-2"></i> Add Personal Task
          </Link>
          <Link to="/teamtask" className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">
            <i className="fas fa-users mr-2"></i> Add Team Task
          </Link>
        </div>
      </div>

      {/* Personal Tasks */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <i className="fas fa-user-circle text-indigo-500 mr-3"></i>
            Personal Tasks
            <span className="ml-2 bg-indigo-100 text-indigo-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">{personalTasks.length}</span>
          </h2>
        </div>

        {loading ? <Loader /> : personalTasks.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <i className="fas fa-tasks text-4xl text-gray-300 mb-4"></i>
            <h3 className="text-lg font-medium text-gray-500 mb-2">No personal tasks yet</h3>
            <p className="text-gray-400 mb-4">Get started by creating your first task</p>
            <Link to="/tasks/add" className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
              <i className="fas fa-plus mr-2"></i> Create Task
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {personalTasks.map(task => (
              <div key={task._id} className="bg-white rounded-lg shadow-md p-5 border-l-4 border-indigo-500">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-gray-800 truncate">{task.title}</h3>
                  <div className="flex space-x-2">
                    <Tooltip text="Edit task">
                      <button onClick={() => handleEdit(task._id, false)} className="text-indigo-500 hover:text-indigo-700">
                        <i className="fas fa-edit mr-2"></i>
                      </button>
                    </Tooltip>
                    <Tooltip text="Delete task">
                      <button onClick={() => handleDelete(task._id)} className="text-red-500 hover:text-red-700">
                        <i className="fas fa-trash"></i>
                      </button>
                    </Tooltip>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{task.description}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-500">
                    <i className="far fa-calendar-alt mr-2 w-4"></i>
                    <span>{moment(task.endDate).format('MMM D, YYYY')}</span>
                  </div>
                  <div className="flex items-center text-gray-500">
                    <i className="far fa-clock mr-2 w-4"></i>
                    <span>{task.endTime || task.time}</span>
                  </div>
                </div>
                {renderReminder(task)}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Team Tasks */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <i className="fas fa-users text-purple-500 mr-3"></i>
            Team Tasks
            <span className="ml-2 bg-purple-100 text-purple-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">{teamTasks.length}</span>
          </h2>
        </div>

        {loading ? <Loader /> : teamTasks.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <i className="fas fa-users text-4xl text-gray-300 mb-4"></i>
            <h3 className="text-lg font-medium text-gray-500 mb-2">No team tasks yet</h3>
            <p className="text-gray-400 mb-4">Collaborate with your team by creating a shared task</p>
            <Link to="/teamtask" className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">
              <i className="fas fa-plus mr-2"></i> Create Team Task
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {teamTasks.map(task => {
              const isCreator = String(task.createdBy) === String(authState.user?._id);
              return (
                <div key={task._id} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800">{task.title}</h3>
                      <p className="text-sm text-purple-600 font-medium">ID: {task.taskId}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button onClick={() => handleDelete(task._id)} className="text-red-500 hover:text-red-700 px-3 py-1 rounded-md">
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>

                  <p className="text-gray-600 mb-5">{task.description}</p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-500 mb-1">DATES</div>
                      <div className="flex items-center">
                        <i className="far fa-calendar-alt text-gray-400 mr-2"></i>
                        <span className="text-sm font-medium">{moment(task.startDate).format('MMM D')} - {moment(task.endDate).format('MMM D, YYYY')}</span>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-500 mb-1">TIME</div>
                      <div className="flex items-center">
                        <i className="far fa-clock text-gray-400 mr-2"></i>
                        <span className="text-sm font-medium">{task.time}</span>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-500 mb-1">PROGRESS</div>
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mr-3">
                          <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: `${task.progress}%` }} />
                        </div>
                        <span className="text-sm font-medium">{task.progress}%</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">TEAM MEMBERS</h4>
                    <div className="space-y-3">
                      {task.members.map((member, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                              <i className="fas fa-user text-purple-500 text-sm"></i>
                            </div>
                            <span className="font-medium text-gray-700">{member.name}</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                              <div className="bg-purple-400 h-2 rounded-full" style={{ width: `${member.totalProgress || 0}%` }} />
                            </div>
                            <span className="text-xs font-medium text-gray-500">{member.totalProgress || 0}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {renderReminder(task)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default Tasks;
