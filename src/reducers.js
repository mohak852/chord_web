import {combineReducers} from "redux";
import {
    REQUEST_SERVICES,
    RECEIVE_SERVICES,
    INVALIDATE_SERVICES,
    REQUEST_SERVICE_METADATA,
    RECEIVE_SERVICE_METADATA,
    INVALIDATE_SERVICE_METADATA,
    REQUEST_SERVICE_DATASETS,
    RECEIVE_SERVICE_DATASETS,
    INVALIDATE_SERVICE_DATASETS
} from "./actions";

const services = (
    state={
        isFetching: false,
        didInvalidate: false,
        items: []
    },
    action
) => {
    switch (action.type) {
        case REQUEST_SERVICES:
            return Object.assign({}, state, {
                isFetching: true,
                didInvalidate: false
            });
        case RECEIVE_SERVICES:
            return Object.assign({}, state, {
                isFetching: false,
                didInvalidate: false,
                items: action.services,
                lastUpdated: action.receivedAt
            });
        case INVALIDATE_SERVICES:
            return Object.assign({}, state, {
                didInvalidate: true
            });
        default:
            return state;
    }
};

const serviceMetadata = (
    state={
        isFetching: false,
        didInvalidate: false,
        metadata: {}
    },
    action
) => {
    switch (action.type) {
        case REQUEST_SERVICE_METADATA:
            return Object.assign({}, state, {
                isFetching: true,
                didInvalidate: false
            });
        case RECEIVE_SERVICE_METADATA:
            return Object.assign({}, state, {
                isFetching: false,
                didInvalidate: false,
                metadata: {...action.metadata},
                lastUpdated: action.receivedAt
            });
        case INVALIDATE_SERVICE_METADATA:
            return Object.assign({}, state, {
                didInvalidate: true
            });
        default:
            return state;
    }
};

const serviceDatasets = (
    state = {
        isFetching: false,
        didInvalidate: false,
        datasets: {}
    },
    action
) => {
    switch (action.type) {
        case REQUEST_SERVICE_DATASETS:
            return Object.assign({}, state, {
                isFetching: true,
                didInvalidate: false
            });
        case RECEIVE_SERVICE_DATASETS:
            return Object.assign({}, state, {
                isFetching: false,
                didInvalidate: false,
                datasets: {...state.datasets, [action.service]: action.datasets},
                lastUpdated: action.receivedAt
            });
        case INVALIDATE_SERVICE_DATASETS:
            return Object.assign({}, state, {
                didInvalidate: true
            });
        default:
            return state;
    }
};

const rootReducer = combineReducers({
    services,
    serviceMetadata,
    serviceDatasets
});

export default rootReducer;
