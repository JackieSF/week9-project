import {combineReducers} from 'redux';
import auth from './auth';
import alert from './alert';
import newsFeed from './Feed';
import tweet from './tweet';
import likes from './likes';
import retweets from './retweets';
import explore from './explore';
import profile from './profile';
import followings from './followings';

const rootReducer = combineReducers({
    auth,
    alert,
    Feed,
    popup,
    tweet,
    likes,
    retweets,
    explore,
    profile,
    followings
});

export default rootReducer;