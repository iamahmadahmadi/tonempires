import axios from 'axios';
import { getApiUrl } from '../../services/api';

// Define the action to fetch items
export const fetchItems = () => async (dispatch) => {
    dispatch({ type: 'FETCH_ITEMS_REQUEST' }); // Optional: Set a loading state

    try {
        const response = await axios.get(getApiUrl('/api/items'));
        dispatch({ type: 'FETCH_ITEMS_SUCCESS', payload: response.data }); // Dispatch data to the store
    } catch (error) {
        dispatch({
            type: 'FETCH_ITEMS_FAILURE',
            payload: error.message || 'Error fetching items',
        }); // Dispatch error
    }
};
