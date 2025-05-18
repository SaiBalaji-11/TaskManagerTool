import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import Tasks from '../components/Tasks';
import MainLayout from '../layouts/MainLayout';

const Home = () => {
  const authState = useSelector(state => state.authReducer);
  const { isLoggedIn } = authState;

  useEffect(() => {
    document.title = authState.isLoggedIn ? `${authState.user.name}'s tasks` : "Task Manager";
  }, [authState]);

  return (
    <MainLayout>
      {!isLoggedIn ? (
        <div className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 text-white min-h-screen flex flex-col items-center justify-center p-8">
          <div className="text-center max-w-4xl space-y-8">
            <h1 className="text-5xl font-bold leading-tight">Welcome to Task Manager App</h1>
            <p className="text-2xl">Manage your tasks easily and efficiently.</p>
            <p className="italic text-xl text-yellow-100">"A task well begun is half done."</p>
            <div className="pt-8">
              <Link 
                to="/signup" 
                className="inline-block bg-white text-blue-500 hover:bg-blue-100 py-3 px-16 rounded-lg text-xl font-semibold transition-all shadow-md animate__animated animate__fadeIn"
              >
                Join now to manage your tasks
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-8 px-4 sm:px-8">
          <h1 className="text-3xl mb-8 font-semibold text-center text-gray-800">Welcome, {authState.user.name}!</h1>
          <Tasks />
        </div>
      )}
    </MainLayout>
  );
}

export default Home;