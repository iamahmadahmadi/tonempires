import axios from 'axios';

// Define the action to fetch items
export const fetchItems = () => async (dispatch) => {
    dispatch({ type: 'FETCH_ITEMS_REQUEST' }); // Optional: Set a loading state

    try {
        const response = await axios.get('https://cnadb.liara.run/api/items');
        dispatch({ type: 'FETCH_ITEMS_SUCCESS', payload: response.data }); // Dispatch data to the store
    } catch (error) {
        dispatch({
            type: 'FETCH_ITEMS_FAILURE',
            payload: error.message || 'Error fetching items',
        }); // Dispatch error
    }
};
