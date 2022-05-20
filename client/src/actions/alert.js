import {ADD_ALERT, REMOVE_ALERT} from './types';
import {v4} from 'uuid';

export const addAlert = msg => dispatch => {
    const id = v4();

    dispatch({
        type: ADD_ALERT,
        payload: {id, msg}
    });
}

export const removeAlert = () => dispatch => dispatch({type: REMOVE_ALERT});