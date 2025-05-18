import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../redux/actions/authActions';



const Navbar = () => {
    const authState = useSelector(state => state.authReducer);
    const dispatch = useDispatch();
    const [isNavbarOpen, setIsNavbarOpen] = useState(false);

    const toggleNavbar = () => {
        setIsNavbarOpen(!isNavbarOpen);
    };



const handleLogoutClick = () => {
  dispatch(logout());
};

    return (
        <header className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-4 flex justify-between items-center shadow-md">
            <Link to="/" className="text-2xl font-bold tracking-wide ml-4">Task Manager</Link>

            {/* Desktop links */}
            <div className="hidden md:flex gap-4">
                {authState.isLoggedIn ? (
                    <>
                        <Link to="/tasks/add" className="px-4 py-2 hover:bg-blue-400/20 rounded-full transition-all">
                            <i className="fa-solid fa-plus mr-2"></i>
                            Add Task
                        </Link>
                        <Link to="/teamtask" className="px-4 py-2 hover:bg-blue-400/20 rounded-full transition-all">
                            <i className="fa-solid fa-people-group mr-2"></i>
                            Team Tasks
                        </Link>
                        <button 
                            onClick={handleLogoutClick} 
                            className="px-4 py-2 hover:bg-red-400/20 rounded-full transition-all"
                        >
                            <i className="fa-solid fa-right-from-bracket mr-2"></i>
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/login" className="px-4 py-2 hover:bg-blue-400/20 rounded-full transition-all">
                            <i className="fa-solid fa-right-to-bracket mr-2"></i>
                            Login
                        </Link>
                        <Link to="/signup" className="px-4 py-2 bg-white text-blue-600 font-semibold rounded-full shadow-sm hover:bg-blue-50 transition-all">
                            Sign Up
                        </Link>
                    </>
                )}
            </div>

            {/* Mobile menu button */}
            <button 
                className="md:hidden p-2 rounded-md hover:bg-blue-400/20 focus:outline-none"
                onClick={toggleNavbar}
                aria-label="Toggle menu"
            >
                <i className={`fa-solid ${isNavbarOpen ? 'fa-xmark' : 'fa-bars'} text-xl`}></i>
            </button>

            {/* Mobile menu */}
            {isNavbarOpen && (
                <div className="md:hidden absolute top-16 left-0 right-0 bg-white text-gray-800 shadow-lg rounded-b-lg py-4 flex flex-col gap-3 items-center z-50">
                    {authState.isLoggedIn ? (
                        <>
                            <Link 
                                to="/tasks/add" 
                                className="w-4/5 text-center px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-all"
                                onClick={() => setIsNavbarOpen(false)}
                            >
                                <i className="fa-solid fa-plus mr-2"></i>
                                Add Task
                            </Link>
                            <Link 
                                to="/teamtask" 
                                className="w-4/5 text-center px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-all"
                                onClick={() => setIsNavbarOpen(false)}
                            >
                                <i className="fa-solid fa-people-group mr-2"></i>
                                Team Tasks
                            </Link>
                            <button 
                                onClick={handleLogoutClick} 
                                className="w-4/5 text-center px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all"
                            >
                                <i className="fa-solid fa-right-from-bracket mr-2"></i>
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link 
                                to="/login" 
                                className="w-4/5 text-center px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-all"
                                onClick={() => setIsNavbarOpen(false)}
                            >
                                <i className="fa-solid fa-right-to-bracket mr-2"></i>
                                Login
                            </Link>
                            <Link 
                                to="/signup" 
                                className="w-4/5 text-center px-4 py-2 bg-white text-blue-600 border border-blue-500 rounded-full hover:bg-blue-50 transition-all"
                                onClick={() => setIsNavbarOpen(false)}
                            >
                                Sign Up
                            </Link>
                        </>
                    )}
                </div>
            )}
        </header>
    );
};

export default Navbar;
