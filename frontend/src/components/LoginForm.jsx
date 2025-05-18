import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import validateManyFields from '../validations';
import Input from './utils/Input';
import { useDispatch, useSelector } from 'react-redux';
import { postLoginData } from '../redux/actions/authActions';
import Loader from './utils/Loader';

const LoginForm = ({ redirectUrl }) => {
     const [formErrors, setFormErrors] = useState({});
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const navigate = useNavigate();

  const authState = useSelector(state => state.authReducer);
  const { loading, isLoggedIn } = authState;
  const dispatch = useDispatch();

  useEffect(() => {
    if (isLoggedIn) {
      navigate(redirectUrl || "/");
    }
  }, [authState, redirectUrl, isLoggedIn, navigate]);

    const handleChange = e => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    }

    const handleSubmit = e => {
        e.preventDefault();
        const errors = validateManyFields("login", formData);
        setFormErrors({});
        
        if (errors.length > 0) {
            setFormErrors(errors.reduce((total, ob) => ({ ...total, [ob.field]: ob.err }), {}));
            return;
        }
        dispatch(postLoginData(formData.email, formData.password));
    }

    const fieldError = field => (
        <p className={`mt-1 text-red-500 text-sm ${formErrors[field] ? "block" : "hidden"}`}>
            <i className='mr-2 fa-solid fa-circle-exclamation'></i>
            {formErrors[field]}
        </p>
    );

    return (
        <>
        <form onSubmit={handleSubmit} className='m-auto my-16 max-w-lg bg-white p-8 border-2 shadow-md rounded-md'>
    {loading ? (
        <Loader />
    ) : (
        <>
            <h2 className='text-center mb-6 text-3xl font-bold text-gray-800'>Welcome Back</h2>

            <div className="mb-6">
                <label htmlFor="email" className="block text-lg mb-2 font-semibold text-gray-700 after:content-['*'] after:ml-0.5 after:text-red-500">Email</label>
                <Input 
                    type="text" 
                    name="email" 
                    id="email" 
                    value={formData.email} 
                    placeholder="youremail@domain.com" 
                    onChange={handleChange} 
                    className={`w-full p-3 rounded-lg border ${formErrors.email ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:border-blue-500`} 
                />
                {fieldError("email")}
            </div>

            <div className="mb-6">
                <label htmlFor="password" className="block text-lg mb-2 font-semibold text-gray-700 after:content-['*'] after:ml-0.5 after:text-red-500">Password</label>
                <Input 
                    type="password" 
                    name="password" 
                    id="password" 
                    value={formData.password} 
                    placeholder="Your password.." 
                    onChange={handleChange} 
                    className={`w-full p-3 rounded-lg border ${formErrors.password ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:border-blue-500`} 
                />
                {fieldError("password")}
            </div>

            <button 
                type='submit' 
                className='w-full bg-blue-600 text-white py-3 rounded-lg text-lg font-semibold shadow-md hover:bg-blue-700 transition-all duration-300'
                disabled={loading}
            >
                {loading ? 'Logging in...' : 'Login'}
            </button>

            <div className='pt-6 text-center'>
                <Link to="/signup" className='text-blue-500 hover:text-blue-600 transition-all duration-200'>Don't have an account? Signup here</Link>
            </div>
        </>
    )}
</form>
</>
    );
}

export default LoginForm;