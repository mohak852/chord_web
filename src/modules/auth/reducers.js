import {FETCH_USER} from "./actions";

export const auth = (
    state = {
        user: null,
        isFetching: false
    },
    action
) => {
    switch (action.type) {
        case FETCH_USER.REQUEST:
            return {...state, isFetching: true};
        case FETCH_USER.RECEIVE:
            return {...state, isFetching: false, user: action.data};
        case FETCH_USER.ERROR:
            // TODO: Handle different errors differently?
            return {...state, isFetching: false, user: null};
        default:
            return state;
    }
};
