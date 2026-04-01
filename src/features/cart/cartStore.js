// initialCartState: 초기 상태 정의
const initialCartState = {
  memberId: null,
  itemCount: 0,
  items: [],
  loading: false,
  error: null,
  initialized: false,
};

// cartState: 실제 현재 상태
let cartState = initialCartState;

// listeners: 구독자 목록
const listeners = new Set();

// emitChange: 상태 변경 알림
const emitChange = () => {
  listeners.forEach((listener) => listener());
};

// getCartState: 현재 상태 읽기
const getCartState = () => cartState;

// subscribeCartStore: 구독 등록
const subscribeCartStore = (listener) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

// setCartState: 상태 변경
// 객체/함수 업데이트 방식 지원
const setCartState = (updater) => {
  cartState =
    typeof updater === "function"
      ? updater(cartState)
      : { ...cartState, ...updater };

  emitChange();
};

// clearCartState: 초기화
const clearCartState = () => {
  cartState = { ...initialCartState };
  emitChange();
};

export {
  clearCartState,
  getCartState,
  setCartState,
  subscribeCartStore
};
