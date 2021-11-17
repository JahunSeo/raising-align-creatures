// 액션 생성 함수들
import * as types from "./ActionTypes";

export const showModal = (onoff) => ({
  type: types.SHOW_MODAL1,
  showModal1: onoff,
});

export const showModal2 = (onoff) => ({
  type: types.SHOW_MODAL2,
  showModal2: onoff,
});

export const checkUser = (res) => ({
  type: types.CHECK_USER,
  payload: res,
});

export const logout = () => ({
  type: types.LOGOUT,
});

export const setRoom = ({ roomId, aliens }) => ({
  type: types.CURRENT_ROOM,
  payload : {roomId, aliens}
});
