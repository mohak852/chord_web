import {
    createNetworkActionTypes,
    createFlowActionTypes,
    networkAction,

    beginFlow,
    endFlow,
    terminateFlow
} from "../../utils/actions";

import {createURLSearchParams} from "../../utils/requests";
import {withBasePath} from "../../utils/url";


/**
 * @typedef {Object} CHORDService
 * @property {string} type.organization
 * @property {string} type.artifact
 * @property {boolean} data_service
 * @property {?boolean} manageable_tables
 */


export const LOADING_ALL_SERVICE_DATA = createFlowActionTypes("LOADING_ALL_SERVICE_DATA");

export const FETCH_CHORD_SERVICES = createNetworkActionTypes("FETCH_CHORD_SERVICES");
export const FETCH_SERVICES = createNetworkActionTypes("FETCH_SERVICES");

export const FETCH_SERVICE_DATA_TYPES = createNetworkActionTypes("FETCH_SERVICE_DATA_TYPES");
export const LOADING_SERVICE_DATA_TYPES = createFlowActionTypes("LOADING_SERVICE_DATA_TYPES");

export const FETCH_SERVICE_TABLES = createNetworkActionTypes("FETCH_SERVICE_TABLES");
export const LOADING_SERVICE_TABLES = createFlowActionTypes("LOADING_SERVICE_TABLES");

export const ADDING_SERVICE_TABLE = createFlowActionTypes("ADDING_SERVICE_TABLE");
export const DELETING_SERVICE_TABLE = createFlowActionTypes("DELETING_SERVICE_TABLE");

export const FETCH_SERVICE_WORKFLOWS = createNetworkActionTypes("FETCH_SERVICE_WORKFLOWS");
export const LOADING_SERVICE_WORKFLOWS = createFlowActionTypes("LOADING_SERVICE_WORKFLOWS");


export const endAddingServiceTable = (serviceInfo, dataTypeID, table) => ({
    type: ADDING_SERVICE_TABLE.END,
    serviceInfo,
    dataTypeID,
    table
});


export const endDeletingServiceTable = (serviceInfo, dataTypeID, tableID) => ({
    type: DELETING_SERVICE_TABLE.END,
    serviceInfo,
    dataTypeID,
    tableID
});


export const fetchCHORDServices = networkAction(() => ({
    types: FETCH_CHORD_SERVICES,
    url: withBasePath("api/service-registry/chord-services"),
    err: "Error fetching CHORD services"
}));

export const fetchServices = networkAction(() => ({
    types: FETCH_SERVICES,
    url: withBasePath("api/service-registry/services"),
    err: "Error fetching services"
}));

export const fetchDataServiceDataTypes = networkAction((chordService, serviceInfo) => ({
    types: FETCH_SERVICE_DATA_TYPES,
    params: {chordService, serviceInfo},
    url: `${serviceInfo.url}/data-types`,
    err: `Error fetching data types from service '${serviceInfo.name}'`
}));

export const fetchDataServiceDataTypeTables = networkAction((chordService, serviceInfo, dataType) => ({
    types: FETCH_SERVICE_TABLES,
    params: {chordService, serviceInfo, dataTypeID: dataType.id},
    url: `${serviceInfo.url}/tables?${createURLSearchParams({"data-type": dataType.id}).toString()}`,
    err: `Error fetching tables from service '${serviceInfo.name}' (data type ${dataType.id})`
}));

export const fetchDataServiceWorkflows = networkAction((chordService, serviceInfo) => ({
    types: FETCH_SERVICE_WORKFLOWS,
    params: {chordService, serviceInfo},
    url: `${serviceInfo.url}/workflows`
}));


export const fetchServicesWithMetadataAndDataTypesAndTables = () => async (dispatch, getState) => {
    await dispatch(beginFlow(LOADING_ALL_SERVICE_DATA));

    // Fetch Services
    await Promise.all([dispatch(fetchCHORDServices()), dispatch(fetchServices())]);
    if (!getState().services.items) {
        // Something went wrong, terminate early
        await dispatch(terminateFlow(LOADING_ALL_SERVICE_DATA));
        return;
    }

    // Fetch other data (need metadata first):

    // - Skip services that don't provide data (i.e. no data types/workflows/etc.)

    const dataServicesInfo = getState().services.items.map(s => ({
        ...s,
        chordService: getState().chordServices.itemsByArtifact[s.type.split(":")[1]] || null
    })).filter(s => (s.chordService || {data_service: false}).data_service);

    // - Fetch Data Service Data Types and Workflows
    await Promise.all([
        (async () => {
            await dispatch(beginFlow(LOADING_SERVICE_DATA_TYPES));
            await Promise.all(dataServicesInfo.map(s => dispatch(fetchDataServiceDataTypes(s.chordService, s))));
            await dispatch(endFlow(LOADING_SERVICE_DATA_TYPES));
        })(),
        (async () => {
            await dispatch(beginFlow(LOADING_SERVICE_WORKFLOWS));
            await Promise.all(dataServicesInfo.map(s => dispatch(fetchDataServiceWorkflows(s.chordService, s))));
            await dispatch(endFlow(LOADING_SERVICE_WORKFLOWS));
        })()
    ]);

    // Fetch Data Service Local Tables
    // - skip services that don't provide data or don't have data types
    await dispatch(beginFlow(LOADING_SERVICE_TABLES));
    await Promise.all(dataServicesInfo.flatMap(s =>
        ((getState().serviceDataTypes.dataTypesByServiceID[s.id] || {items: []}).items || [])
            .map(dt => dispatch(fetchDataServiceDataTypeTables(s.chordService, s, dt)))));
    await dispatch(endFlow(LOADING_SERVICE_TABLES));

    await dispatch(endFlow(LOADING_ALL_SERVICE_DATA));
};

export const fetchServicesWithMetadataAndDataTypesAndTablesIfNeeded = () => async (dispatch, getState) => {
    const state = getState();
    if ((state.chordServices.items.length === 0 || state.services.items.length === 0 ||
            Object.keys(state.serviceDataTypes.dataTypesByServiceID).length === 0) &&
            !state.services.isFetchingAll) {
        await dispatch(fetchServicesWithMetadataAndDataTypesAndTables());
    }
};
