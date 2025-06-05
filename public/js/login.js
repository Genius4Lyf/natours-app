import axios from 'axios';

import { showAlert } from './alert.js';

export const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://127.0.0.1:3000/api/v1/users/login',
      data: {
        email,
        password,
      },
    });

    console.log(res);
    if (res.data.status === 'success') {
      showAlert('success', 'Logged in Successfuly');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: 'http://127.0.0.1:3000/api/v1/users/logout',
    });

    console.log(res);
    if (res.statusText === 'OK') {
      showAlert('success', 'Logged out Successfuly');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    } // Redirect to home page
  } catch (err) {
    showAlert('error', 'Error logging out! Try Again');
  }
};
