import PropTypes from "prop-types";
import {FORM_MODE_ADD, FORM_MODE_EDIT} from "./constants";

export const propTypesFormMode = PropTypes.oneOf([FORM_MODE_ADD, FORM_MODE_EDIT]);

export const nodeInfoDataPropTypesShape = PropTypes.shape({
    CHORD_URL: PropTypes.string,
    OIDC_DISCOVERY_URI: PropTypes.string,
});

export const serviceInfoPropTypesShape = PropTypes.shape({
    id: PropTypes.string.required,
    name: PropTypes.string.required,
    type: PropTypes.shape({
        group: PropTypes.string.required,
        artifact: PropTypes.string.required,
        version: PropTypes.string.required,
    }).required,
    description: PropTypes.string,
    organization: PropTypes.shape({
        name: PropTypes.string.required,
        url: PropTypes.string.required,
    }),
    contactUrl: PropTypes.string,
    documentationUrl: PropTypes.string,
    createdAt: PropTypes.string,
    updatedAt: PropTypes.string,
    environment: PropTypes.string,
    version: PropTypes.string.required,
});

export const chordServicePropTypesMixin = {
    type: PropTypes.shape({
        organization: PropTypes.string,
        artifact: PropTypes.string,
        language: PropTypes.string,
    }),
    repository: PropTypes.string,
    data_service: PropTypes.bool,
    manageable_tables: PropTypes.bool,
    wsgi: PropTypes.bool,
};

// Gives components which include this in their state to props connection access to the drop box and loading status.
export const dropBoxTreeStateToPropsMixin = state => ({
    tree: state.dropBox.tree,
    treeLoading: state.dropBox.isFetching
});

// Any components which include dropBoxTreeStateToPropsMixin should include this as well in their prop types.
export const dropBoxTreeStateToPropsMixinPropTypes = {
    tree: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string,
        path: PropTypes.string
    })),  // TODO: This is going to change
    treeLoading: PropTypes.bool
};

export const linkedFieldSetPropTypesShape = PropTypes.shape({
    name: PropTypes.string,
    fields: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.string)),  // TODO: Properties pattern?
});

// Prop types object shape for a single dataset object.
export const datasetPropTypesShape = PropTypes.shape({
    identifier: PropTypes.string,
    title: PropTypes.string,
    description: PropTypes.string,
    contact_info: PropTypes.string,
    data_use: PropTypes.object,  // TODO: Shape
    linked_field_sets: PropTypes.arrayOf(linkedFieldSetPropTypesShape),
    created: PropTypes.string,
    updated: PropTypes.string,

    // May not be present if nested (project ID)
    project: PropTypes.string,
});

// Prop types object shape for a single project object.
export const projectPropTypesShape = PropTypes.shape({
    identifier: PropTypes.string,
    title: PropTypes.string,
    description: PropTypes.string,
    datasets: PropTypes.arrayOf(datasetPropTypesShape),
    created: PropTypes.string,
    updated: PropTypes.string
});

// Prop types object shape for a single notification object.
export const notificationPropTypesShape = PropTypes.shape({
    id: PropTypes.string.required,
    title: PropTypes.string.required,
    description: PropTypes.string,
    notification_type: PropTypes.string,
    action_target: PropTypes.string,
    read: PropTypes.bool,
    timestamp: PropTypes.string,  // TODO: de-serialize?
});

// Prop types object shape for a run object.
// TODO: Missing stuff
export const runPropTypesShape = PropTypes.shape({
    run_id: PropTypes.string,
    state: PropTypes.string,

    // withDetails=true
    details: PropTypes.shape({
        run_id: PropTypes.string,
        state: PropTypes.string,
        request: PropTypes.shape({
            workflow_params: PropTypes.object,
            workflow_type: PropTypes.string,
            workflow_type_version: PropTypes.string,
            workflow_engine_parameters: PropTypes.object,
            workflow_url: PropTypes.string,
            tags: PropTypes.object,
        }),
        run_log: PropTypes.shape({
            name: PropTypes.string,
            cmd: PropTypes.string,
            start_time: PropTypes.string,  // TODO: De-serialize?
            end_time: PropTypes.string,  // TODO: De-serialize?
            stdout: PropTypes.string,
            stderr: PropTypes.string,
            exit_code: PropTypes.number,
        })
    })
});

// Prop types object shape for a single table summary object.
export const summaryPropTypesShape = PropTypes.shape({
    count: PropTypes.number,
    data_type_specific: PropTypes.object,  // TODO: Shape changes...
});

// Prop types object shape for a single user object.
export const userPropTypesShape = PropTypes.shape({
    // TODO: More
    chord_user_role: PropTypes.string.isRequired,
    email_verified: PropTypes.bool,
    preferred_username: PropTypes.string,
    sub: PropTypes.string.isRequired,
});

// Gives components which include this in their state to props connection access to workflows and loading status.
export const workflowsStateToPropsMixin = state => ({
    workflows: Object.entries(state.serviceWorkflows.workflowsByServiceID)
        .filter(([_, s]) => !s.isFetching)
        .flatMap(([serviceID, s]) => Object.entries(s.workflows.ingestion).map(([k, v]) => ({
            ...v,
            id: k,
            serviceID
        }))),
    workflowsLoading: state.services.isFetchingAll || state.serviceWorkflows.isFetchingAll
});

// Prop types object shape for a single workflow object.
export const workflowPropTypesShape = PropTypes.shape({
    id: PropTypes.string,
    serviceID: PropTypes.string,

    // "Real" properties
    name: PropTypes.string,
    description: PropTypes.string,
    data_type: PropTypes.string,
    inputs: PropTypes.arrayOf(PropTypes.shape({
        type: PropTypes.string,
        id: PropTypes.string,
        extensions: PropTypes.arrayOf(PropTypes.string)  // File type only
    })),
    outputs: PropTypes.arrayOf(PropTypes.shape({
        type: PropTypes.string,
        value: PropTypes.string
    }))
});

// Any components which include workflowStateToPropsMixin should include this as well in their prop types.
export const workflowsStateToPropsMixinPropTypes = {
    workflows: PropTypes.arrayOf(workflowPropTypesShape),
    workflowsLoading: PropTypes.bool
};
