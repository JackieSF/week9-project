import axios from 'axios';
import {SET_CURRENT_USER} from './types';
import {addAlert} from './alert';
import setTokenHeader from '../utilities/setTokenHeader';

const setCurrentUser = profile => dispatch => dispatch({
    type: SET_CURRENT_USER,
    payload: profile
});

export const loadUser = () => async dispatch => {
    try {
        const res = await axios.get('/api/user');
        dispatch(setCurrentUser(res.data.currentUser));
    } catch(err) {
        dispatch(logout());
    }
}

export const register = formData => async dispatch => {
    const config = {
        headers: {
            'Content-Type': 'application/json'
        }
    };

    try {
        const res = await axios.post('/api/auth/signup', formData, config);

        const {currentUser, token} = res.data;

        localStorage.setItem('token', token);

        setTokenHeader(token);

        dispatch(setCurrentUser(currentUser));
    } catch(err) {
        const errors = err.response.data.errors;

        if(errors) {
            errors.forEach(error => dispatch(addAlert(error.msg)));
        }

        console.log(err.message);
    }
}

export const login = formData => async dispatch => {
    const config = {
        headers: {
            'Content-Type': 'application/json'
        }
    };

    try {
        const res = await axios.post('/api/auth/login', formData, config);

        const {currentUser, token} = res.data;

        localStorage.setItem('token', token);

        setTokenHeader(token);
        dispatch(setCurrentUser(currentUser));
    } catch(err) {
        const errors = err.response.data.errors;

        if(errors) {
            errors.forEach(error => dispatch(addAlert(error.msg)));
        }

        console.log(err.message);
    }
}

export const logout = () => dispatch => {

    localStorage.removeItem('token');

    setTokenHeader(false);

    dispatch(setCurrentUser({}));
}