import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import Tasks from '../components/Tasks';
import MainLayout from '../layouts/MainLayout';

const Home = () => {
  const authState = useSelector(state => state.authReducer);
  const { isLoggedIn } = authState;

  useEffect(() => {
    document.title = authState.isLoggedIn ? `${authState.user.name}'s Task Dashboard` : "TaskFlow - Productivity Simplified";
  }, [authState]);

  return (
    <MainLayout>
      {!isLoggedIn ? (
        <div className="bg-gradient-to-br from-indigo-900 to-blue-800 text-white min-h-screen flex flex-col items-center justify-center p-4">
          <div className="text-center max-w-4xl space-y-6">
            <div className="mb-6">
              <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
                Organize. Prioritize. <span className="text-blue-300">Achieve.</span>
              </h1>
              <p className="text-xl md:text-2xl text-blue-100">
                TaskFlow helps you focus on what matters most
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 max-w-2xl mx-auto">
              <p className="text-lg italic text-blue-100 mb-4">
                "Productivity is never an accident. It's always the result of commitment to excellence, intelligent planning, and focused effort."
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Link 
                  to="/signup" 
                  className="bg-blue-500 hover:bg-blue-600 text-white py-3 px-8 rounded-lg text-lg font-medium transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  Get Started - It's Free
                </Link>
                <Link 
                  to="/login" 
                  className="border-2 border-blue-400 text-blue-100 hover:bg-white/10 py-3 px-8 rounded-lg text-lg font-medium transition-all"
                >
                  Already have an account?
                </Link>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10 text-left">
              <div className="bg-white/5 p-5 rounded-xl">
                <h3 className="text-xl font-semibold mb-2">📝 Smart Task Management</h3>
                <p className="text-blue-100">Create, organize, and track tasks with ease.</p>
              </div>
              <div className="bg-white/5 p-5 rounded-xl">
                <h3 className="text-xl font-semibold mb-2">⏱️ Time Optimization</h3>
                <p className="text-blue-100">Focus on priorities with our smart scheduling.</p>
              </div>
              <div className="bg-white/5 p-5 rounded-xl">
                <h3 className="text-xl font-semibold mb-2">📈 Progress Tracking</h3>
                <p className="text-blue-100">Visualize your productivity and accomplishments.</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-8 px-4 sm:px-8 max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">
              Your Task Dashboard
            </h1>
            <span className="text-blue-600 font-medium">
              Welcome back, {authState.user.name}!
            </span>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <Tasks />
          </div>
        </div>
      )}
    </MainLayout>
  );
}

export default Home;