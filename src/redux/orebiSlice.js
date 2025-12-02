import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const initialState = {
  userInfo: [],
  products: [],
  items: [], // Add a new state for fetched items
  loading: false,
  error: null,
};

export const orebiSlice = createSlice({
  name: "orebi",
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const item = state.products.find(
        (item) => item._id === action.payload._id
      );
      if (item) {
        item.quantity += action.payload.quantity;
      } else {
        state.products.push(action.payload);
      }
    },
    increaseQuantity: (state, action) => {
      const item = state.products.find(
        (item) => item._id === action.payload._id
      );
      if (item) {
        item.quantity++;
      }
    },
    drecreaseQuantity: (state, action) => {
      const item = state.products.find(
        (item) => item._id === action.payload._id
      );
      if (item.quantity === 1) {
        item.quantity = 1;
      } else {
        item.quantity--;
      }
    },
    deleteItem: (state, action) => {
      state.products = state.products.filter(
        (item) => item._id !== action.payload
      );
    },
    resetCart: (state) => {
      state.products = [];
    },
    fetchItemsRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchItemsSuccess: (state, action) => {
      state.loading = false;
      state.items = action.payload;
    },
    fetchItemsFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

// Async thunk action for fetching items
export const fetchItems = () => async (dispatch) => {
  dispatch(fetchItemsRequest());
  try {
    const response = await axios.get("https://cnadb.liara.run/api/items");
    dispatch(fetchItemsSuccess(response.data));
  } catch (error) {
    dispatch(fetchItemsFailure(error.message || "Error fetching items"));
  }
};

export const {
  addToCart,
  increaseQuantity,
  drecreaseQuantity,
  deleteItem,
  resetCart,
  fetchItemsRequest,
  fetchItemsSuccess,
  fetchItemsFailure,
} = orebiSlice.actions;

export default orebiSlice.reducer;
