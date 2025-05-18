import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useFetch from '../hooks/useFetch'; // make sure this sends the data correctly
import validateManyFields from '../validations'; // ensure phone validation inside
import Input from './utils/Input';
import Loader from './utils/Loader';

const SignupForm = () => {
  const [formErrors, setFormErrors] = useState({});
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: ""  // phone included here
  });

  // Changed destructuring assuming useFetch returns an object
  const [ fetchData, {loading} ] = useFetch();

  const navigate = useNavigate();

  const handleChange = e => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = e => {
    e.preventDefault();

    const errors = validateManyFields("signup", formData);
    setFormErrors({});

    if (errors.length > 0) {
      setFormErrors(errors.reduce((total, ob) => ({ ...total, [ob.field]: ob.err }), {}));
      return;
    }

    console.log("Submitting form data:", formData);

   
      const config = { url: "/auth/signup", method: "post", data: formData };
      fetchData(config).then(()=>{
      navigate("/login");
    }); 
    }

  const fieldError = (field) => (
    <p className={`mt-1 text-red-500 text-sm ${formErrors[field] ? "block" : "hidden"}`}>
      <i className='mr-2 fa-solid fa-circle-exclamation'></i>
      {formErrors[field]}
    </p>
  );

  return (
    <form onSubmit={handleSubmit} className='m-auto my-16 max-w-lg bg-white p-10 shadow-lg rounded-xl border-t-4 border-blue-500'>
      {loading ? (
        <Loader />
      ) : (
        <>
          <h2 className='text-center mb-6 text-3xl font-bold text-gray-800'>Create Your Account</h2>

          <div className='mb-6'>
            <label htmlFor='name' className='block text-lg mb-2 font-semibold text-gray-700'>Name</label>
            <Input
              type='text'
              name='name'
              id='name'
              value={formData.name}
              placeholder='Your name'
              onChange={handleChange}
              className='w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500'
            />
            {fieldError('name')}
          </div>

          <div className='mb-6'>
            <label htmlFor='email' className='block text-lg mb-2 font-semibold text-gray-700'>Email</label>
            <Input
              type='text'
              name='email'
              id='email'
              value={formData.email}
              placeholder='youremail@domain.com'
              onChange={handleChange}
              className='w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500'
            />
            {fieldError('email')}
          </div>

          <div className='mb-6'>
            <label htmlFor='phone' className='block text-lg mb-2 font-semibold text-gray-700'>Phone Number</label>
            <Input
              type='tel'
              name='phone'
              id='phone'
              value={formData.phone}
              placeholder='Your phone number'
              onChange={handleChange}
              className='w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500'
            />
            {fieldError('phone')}
          </div>

          <div className='mb-6'>
            <label htmlFor='password' className='block text-lg mb-2 font-semibold text-gray-700'>Password</label>
            <Input
              type='password'
              name='password'
              id='password'
              value={formData.password}
              placeholder='Your password..'
              onChange={handleChange}
              className='w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500'
            />
            {fieldError('password')}
          </div>

          <button
            type='submit'
            className='w-full bg-blue-600 text-white py-3 rounded-lg text-lg font-semibold shadow-md hover:bg-blue-700 transition-all duration-300'
          >
            Sign Up
          </button>

          <div className='pt-6 text-center'>
            <Link to='/login' className='text-blue-500 hover:text-blue-600 transition-all duration-200'>
              Already have an account? Login here
            </Link>
          </div>
        </>
      )}
    </form>
  );
};

export default SignupForm;
