import axios from 'axios';
import {GET_FEED} from './types';

export const getFeed = () => async dispatch => {
    try {
        const res = await axios.get('/api/feed');

        dispatch({
            type: GET_FEED,
            payload: res.data.tweetList
        });
    } catch(err) {
        console.log(err.message);
    }
}