const initialCartState = {
  memberId: null,
  itemCount: 0,
  items: [],
  loading: false,
  error: null,
  initialized: false,
};

let cartState = initialCartState;
const listeners = new Set();

const emitChange = () => {
  listeners.forEach((listener) => listener());
};

const getCartState = () => cartState;

const subscribeCartStore = (listener) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

const setCartState = (updater) => {
  cartState =
    typeof updater === "function"
      ? updater(cartState)
      : { ...cartState, ...updater };

  emitChange();
};

const clearCartState = () => {
  cartState = { ...initialCartState };
  emitChange();
};

export { clearCartState, getCartState, setCartState, subscribeCartStore };
