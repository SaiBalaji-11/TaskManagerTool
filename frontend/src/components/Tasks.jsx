import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import useFetch from '../hooks/useFetch';
import Loader from './utils/Loader';
import Tooltip from './utils/Tooltip';
import moment from 'moment';

const Tasks = () => {
  const authState = useSelector((state) => state.authReducer);
  const [personalTasks, setPersonalTasks] = useState([]);
  const [teamTasks, setTeamTasks] = useState([]);
  const [fetchData, { loading }] = useFetch();

  const fetchTasks = useCallback(() => {
    const config = { url: "/tasks", method: "get", headers: { Authorization: authState.token } };
    fetchData(config, { showSuccessToast: false }).then(data => {
      setPersonalTasks(data.personalTasks || []);
      setTeamTasks(data.teamTasks || []);
    });
  }, [authState.token, fetchData]);

  useEffect(() => {
    if (!authState.isLoggedIn) return;
    fetchTasks();
  }, [authState.isLoggedIn, fetchTasks]);

  const handleDelete = async (id) => {
    try {
      const config = {
        url: `/tasks/${id}`,
        method: "delete",
        headers: { Authorization: authState.token }
      };
      const response = await fetchData(config);
      if (response.status) {
        fetchTasks();
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

const getReminderDetails = (endDate, endTime) => {
  const now = moment();
  let end = moment(endDate);
  
  // Combine date and time if time is provided
  if (endTime) {
    const [hours, minutes] = endTime.split(':');
    end.set({ hour: hours, minute: minutes });
  }

  if (!end.isValid()) return null;

  const diffMinutes = end.diff(now, 'minutes');
  const diffHours = Math.floor(diffMinutes / 60);
  const remainingMinutes = diffMinutes % 60;

  // Deadline has passed
  if (diffMinutes <= 0) {
    const formattedTime = endTime ? end.format("h:mm A") : "";
    return {
      message: `⚠️ Deadline exceeded on ${end.format("MMM D")}${formattedTime ? ` at ${formattedTime}` : ""}`,
      color: "text-gray-500 italic",
      bg: "bg-gray-100"
    };
  }

  // If deadline is today
  if (now.isSame(end, 'day')) {
    if (diffHours >= 1) {
      return {
        message: `⏳ ${diffHours} hour${diffHours !== 1 ? 's' : ''} remaining until deadline`,
        color: "text-red-800 font-semibold",
        bg: "bg-red-100"
      };
    }
    return {
      message: `⏳ ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} remaining until deadline`,
      color: "text-red-900 font-bold",
      bg: "bg-red-200"
    };
  }

  // For future dates
  const diffDays = end.diff(now, 'days');
  return {
    message: `🔔 Scheduled for ${end.format("MMM D")}${endTime ? ` at ${end.format("h:mm A")}` : ""}`,
    color: "text-blue-800",
    bg: "bg-blue-50"
  };
};

const renderReminder = (task) => {
  const reminder = getReminderDetails(task.endDate, task.endTime);
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
  <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row justify-between items-start sm:items-center mb-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Tasks</h1>
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
        <Link
          to="/tasks/add"
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 whitespace-nowrap"
        >
          <i className="fas fa-plus mr-2"></i> Add Personal Task
        </Link>
        <Link
          to="/teamtask"
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 whitespace-nowrap"
        >
          <i className="fas fa-users mr-2"></i> Add Team Task
        </Link>
      </div>
    </div>

      {/* Personal Tasks Section */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <i className="fas fa-user-circle text-indigo-500 mr-3"></i>
            Personal Tasks
            <span className="ml-2 bg-indigo-100 text-indigo-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              {personalTasks.length}
            </span>
          </h2>
        </div>

        {loading ? (
          <Loader />
        ) : personalTasks.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <i className="fas fa-tasks text-4xl text-gray-300 mb-4"></i>
            <h3 className="text-lg font-medium text-gray-500 mb-2">No personal tasks yet</h3>
            <p className="text-gray-400 mb-4">Get started by creating your first task</p>
            <Link
              to="/tasks/add"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <i className="fas fa-plus mr-2"></i> Create Task
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {personalTasks.map((task) => (
              <div
                key={task._id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 border-l-4 border-indigo-500"
              >
                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-gray-800 truncate">{task.title}</h3>
                    <div className="flex space-x-2">
                      <Tooltip text="Edit task">
                        <Link
                          to={`/tasks/${task._id}`}
                          className="text-indigo-500 hover:text-indigo-700 transition-colors"
                        >
                          <i className="fas fa-pen"></i>
                        </Link>
                      </Tooltip>
                      <Tooltip text="Delete task">
                        <button
                          onClick={() => handleDelete(task._id)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{task.description}</p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-500">
                      <i className="far fa-calendar-alt mr-2 w-4"></i>
                      <span>{moment(task.endDate).format("MMM D, YYYY")}</span>
                    </div>
                    <div className="flex items-center text-gray-500">
                      <i className="far fa-clock mr-2 w-4"></i>
                      <span>{task.endTime}</span>
                    </div>
                  </div>

                  {/* Reminder Section */}
                  {renderReminder(task)}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Team Tasks Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <i className="fas fa-users text-purple-500 mr-3"></i>
            Team Tasks
            <span className="ml-2 bg-purple-100 text-purple-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              {teamTasks.length}
            </span>
          </h2>
        </div>

        {loading ? (
          <Loader />
        ) : teamTasks.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <i className="fas fa-users text-4xl text-gray-300 mb-4"></i>
            <h3 className="text-lg font-medium text-gray-500 mb-2">No team tasks yet</h3>
            <p className="text-gray-400 mb-4">Collaborate with your team by creating a shared task</p>
            <Link
              to="/teamtask"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700"
            >
              <i className="fas fa-plus mr-2"></i> Create Team Task
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {teamTasks.map((task) => (
              <div
                key={task._id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 border-l-4 border-purple-500"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800">{task.title}</h3>
                      <p className="text-sm text-purple-600 font-medium">ID: {task.taskId}</p>
                    </div>
                    <button
                      onClick={() => handleDelete(task._id)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                  
                  <p className="text-gray-600 mb-5">{task.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-500 mb-1">DATES</div>
                      <div className="flex items-center">
                        <i className="far fa-calendar-alt text-gray-400 mr-2"></i>
                        <span className="text-sm font-medium">
                          {moment(task.startDate).format("MMM D")} - {moment(task.endDate).format("MMM D, YYYY")}
                        </span>
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
                          <div 
                            className="bg-purple-600 h-2.5 rounded-full" 
                            style={{ width: `${task.progress}%` }}
                          ></div>
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
                              <div 
                                className="bg-purple-400 h-2 rounded-full" 
                                style={{ width: `${member.totalProgress}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-medium text-gray-500">{member.totalProgress}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {renderReminder(task)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Tasks;