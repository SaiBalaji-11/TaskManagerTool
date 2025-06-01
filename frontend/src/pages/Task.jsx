import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import Loader from '../components/utils/Loader';
import useFetch from '../hooks/useFetch';
import MainLayout from '../layouts/MainLayout';
import validateManyFields from '../validations';

const Task = () => {
  const authState = useSelector((state) => state.authReducer);
  const navigate = useNavigate();
  const [fetchData, { loading }] = useFetch();
  const { taskId } = useParams();

  const mode = taskId === undefined ? 'add' : 'update';
  const [task, setTask] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    endDate: '',
    hour: '12',
    minute: '00',
    meridian: 'AM',
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    document.title = mode === 'add' ? 'Add Task' : 'Update Task';
  }, [mode]);

  // Helper: convert 24-hour time to 12-hour with meridian
  const convert24To12 = (hhmm) => {
    if (!hhmm) return { hour: '12', minute: '00', meridian: 'AM' };
    let [hour24, minute] = hhmm.split(':');
    let hourNum = parseInt(hour24, 10);
    const meridian = hourNum >= 12 ? 'PM' : 'AM';
    hourNum = hourNum % 12 || 12; // convert 0 to 12 for 12 AM
    return {
      hour: hourNum.toString().padStart(2, '0'),
      minute: minute.padStart(2, '0'),
      meridian,
    };
  };

  // Helper: convert 12-hour + meridian to 24-hour hh:mm string
  const convert12To24 = (hour, minute, meridian) => {
    let hourNum = parseInt(hour, 10);
    if (meridian === 'PM' && hourNum !== 12) hourNum += 12;
    if (meridian === 'AM' && hourNum === 12) hourNum = 0;
    return `${hourNum.toString().padStart(2, '0')}:${minute.padStart(2, '0')}`;
  };

  useEffect(() => {
    if (mode === 'update') {
      const config = {
        url: `/tasks/${taskId}`,
        method: 'get',
        headers: { Authorization: authState.token },
      };
      fetchData(config, { showSuccessToast: false }).then((data) => {
        setTask(data.task);
        const endDateObj = new Date(data.task.endDate);
        const yyyyMMdd = endDateObj.toISOString().slice(0, 10);

        // Convert 24-hour time string to separate hour, minute, meridian
        const time24 = endDateObj.toTimeString().slice(0, 5); // "HH:MM"
        const { hour, minute, meridian } = convert24To12(time24);

        setFormData({
          title: data.task.title || '',
          endDate: yyyyMMdd,
          hour,
          minute,
          meridian,
        });
      });
    }
  }, [mode, authState, taskId, fetchData]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleReset = (e) => {
    e.preventDefault();
    if (task) {
      const endDateObj = new Date(task.endDate);
      const yyyyMMdd = endDateObj.toISOString().slice(0, 10);

      const time24 = endDateObj.toTimeString().slice(0, 5);
      const { hour, minute, meridian } = convert24To12(time24);

      setFormData({
        title: task.title || '',
        endDate: yyyyMMdd,
        hour,
        minute,
        meridian,
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Convert the separate hour, minute, meridian inputs to 24-hour format string
    const formattedTime = convert12To24(formData.hour, formData.minute, formData.meridian);

    // Validate the fields
    const errors = validateManyFields('task', {
      title: formData.title,
      endDate: formData.endDate,
      endTime: formattedTime,
    });

    setFormErrors({});

    if (errors.length > 0) {
      setFormErrors(errors.reduce((total, ob) => ({ ...total, [ob.field]: ob.err }), {}));
      return;
    }

    // Prepare data to send to server
    const dataToSend = {
      title: formData.title,
      endDate: formData.endDate,
      endTime: formattedTime,
    };

    const config = {
      url: mode === 'add' ? '/tasks' : `/tasks/${taskId}`,
      method: mode === 'add' ? 'post' : 'put',
      data: dataToSend,
      headers: { Authorization: authState.token },
    };

    fetchData(config).then(() => {
      navigate('/');
    });
  };

  const fieldError = (field) => (
    <p className={`mt-1 text-red-600 text-sm ${formErrors[field] ? 'block' : 'hidden'}`}>
      <i className="mr-2 fa-solid fa-circle-exclamation"></i>
      {formErrors[field]}
    </p>
  );

  useEffect(() => {
    if (!formData.endDate || !formData.hour || !formData.minute || !formData.meridian) return;

    const endTime24 = convert12To24(formData.hour, formData.minute, formData.meridian);
    const interval = setInterval(() => {
      const currentTime = new Date().getTime();
      const endTime = new Date(`${formData.endDate}T${endTime24}`).getTime();
      const oneHourBefore = endTime - 60 * 60 * 1000;

      if (currentTime >= oneHourBefore && currentTime < endTime) {
        alert('Reminder: Your task deadline is in 1 hour!');
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [formData.endDate, formData.hour, formData.minute, formData.meridian]);

  return (
    <MainLayout>
      <form
        className="max-w-lg mx-auto my-16 p-10 bg-white border rounded-lg shadow-lg
                   flex flex-col gap-6"
        onSubmit={handleSubmit}
      >
        {loading ? (
          <Loader />
        ) : (
          <>
            <h2 className="text-3xl font-semibold text-center text-gray-800 mb-6">
              {mode === 'add' ? 'Add New Task' : 'Edit Task'}
            </h2>

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
                placeholder="Enter task title"
                onChange={handleChange}
                className="px-4 py-3 border border-gray-300 rounded-md focus:outline-none
                           focus:ring-2 focus:ring-blue-400 transition"
              />
              {fieldError('title')}
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
              {fieldError('endDate')}
            </div>

            <div className="flex flex-col">
              <label
                htmlFor="endTime"
                className="mb-2 font-medium text-gray-700 hover:text-blue-600 transition-colors"
              >
                End Time
              </label>
              <div className="flex gap-2">
                <select
                  name="hour"
                  value={formData.hour}
                  onChange={handleChange}
                  className="px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                >
                  {[...Array(12)].map((_, i) => {
                    const hour = (i + 1).toString().padStart(2, '0');
                    return (
                      <option key={hour} value={hour}>
                        {hour}
                      </option>
                    );
                  })}
                </select>

                <select
                  name="minute"
                  value={formData.minute}
                  onChange={handleChange}
                  className="px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                >
                  {[...Array(60)].map((_, i) => {
                    const minute = i.toString().padStart(2, '0');
                    return (
                      <option key={minute} value={minute}>
                        {minute}
                      </option>
                    );
                  })}
                </select>

                <select
                  name="meridian"
                  value={formData.meridian}
                  onChange={handleChange}
                  className="px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
              {fieldError('endTime')}
            </div>

            <div className="flex justify-center gap-4 mt-6">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-3 rounded-md font-semibold
                           hover:bg-blue-700 transition"
              >
                {mode === 'add' ? 'Add Task' : 'Update Task'}
              </button>

              <button
                type="button"
                onClick={() => navigate('/')}
                className="bg-red-500 text-white px-6 py-3 rounded-md font-semibold
                           hover:bg-red-600 transition"
              >
                Cancel
              </button>

              {mode === 'update' && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="bg-green-500 text-white px-6 py-3 rounded-md font-semibold
                             hover:bg-green-600 transition"
                >
                  Reset
                </button>
              )}
            </div>
          </>
        )}
      </form>
    </MainLayout>
  );
};

export default Task;
