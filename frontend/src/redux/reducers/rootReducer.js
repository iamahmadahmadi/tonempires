import { combineReducers } from 'redux';
import itemReducer from './itemReducer';

const rootReducer = combineReducers({
    items: itemReducer,
    // Add other reducers here
});

export default rootReducer;
