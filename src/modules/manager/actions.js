import fetch from "cross-fetch";
import {message} from "antd";

import {beginAddingServiceDataset, endAddingServiceDataset, terminateAddingServiceDataset} from "../services/actions";

import {
    basicAction,
    createNetworkActionTypes,
    createFlowActionTypes,
    networkAction,

    beginFlow,
    endFlow,
    terminateFlow
} from "../../utils";

export const FETCH_PROJECTS = createNetworkActionTypes("FETCH_PROJECTS");

export const FETCHING_PROJECT_DATASETS = createFlowActionTypes("FETCHING_PROJECT_DATASETS");
export const FETCH_PROJECT_DATASETS = createNetworkActionTypes("FETCH_PROJECT_DATASETS");

export const CREATE_PROJECT = createNetworkActionTypes("CREATE_PROJECT");
export const DELETE_PROJECT = createNetworkActionTypes("DELETE_PROJECT");

export const SELECT_PROJECT = "SELECT_PROJECT";

export const PROJECT_DATASET_ADDITION = createFlowActionTypes("CREATE_DATASET_ADDITION");

export const TOGGLE_PROJECT_CREATION_MODAL = "TOGGLE_PROJECT_CREATION_MODAL";
export const TOGGLE_PROJECT_DELETION_MODAL = "TOGGLE_PROJECT_DELETION_MODAL";
export const TOGGLE_PROJECT_DATASET_ADDITION_MODAL = "TOGGLE_PROJECT_DATASET_ADDITION_MODAL";

export const PROJECT_EDITING = createFlowActionTypes("PROJECT_EDITING");
export const SAVE_PROJECT = createNetworkActionTypes("SAVE_PROJECT");

export const FETCH_DROP_BOX_TREE = createNetworkActionTypes("FETCH_DROP_BOX_TREE");

export const FETCH_RUNS = createNetworkActionTypes("FETCH_RUNS");
export const FETCH_RUN_DETAILS = createNetworkActionTypes("FETCH_RUN_DETAILS");

export const INGESTION_RUN_SUBMISSION = createFlowActionTypes("INGESTION_RUN_SUBMISSION");


const endProjectDatasetAddition = (projectID, dataset) => ({type: PROJECT_DATASET_ADDITION.END, projectID, dataset});


const selectProject = projectID => ({type: SELECT_PROJECT, projectID});

export const selectProjectIfItExists = projectID => async (dispatch, getState) => {
    if (!getState().projects.itemsByID.hasOwnProperty(projectID)) return;
    await dispatch(selectProject(projectID));
};


export const toggleProjectCreationModal = basicAction(TOGGLE_PROJECT_CREATION_MODAL);
export const toggleProjectDeletionModal = basicAction(TOGGLE_PROJECT_DELETION_MODAL);
export const toggleProjectDatasetAdditionModal = basicAction(TOGGLE_PROJECT_DATASET_ADDITION_MODAL);

export const beginProjectEditing = basicAction(PROJECT_EDITING.BEGIN);
export const endProjectEditing = basicAction(PROJECT_EDITING.END);

export const fetchProjects = networkAction(() => ({
    types: FETCH_PROJECTS,
    url: "/api/project/projects",
    err: "Error fetching projects"
}));

export const fetchProjectDatasets = networkAction(project => ({
    types: FETCH_PROJECT_DATASETS,
    params: {projectID: project.id},
    url: `/api/project/projects/${project.id}/datasets`,
    err: `Error fetching datasets for project '${project.id}'`  // TODO: Use project name
}));

// TODO: if needed fetching + invalidation
export const fetchProjectsWithDatasets = () => async (dispatch, getState) => {
    if (getState().projects.isFetching || getState().projects.isCreating || getState().projects.isDeleting) return;

    await dispatch(fetchProjects());
    await dispatch(beginFlow(FETCHING_PROJECT_DATASETS));
    await Promise.all(getState().projects.items.map(project => dispatch(fetchProjectDatasets(project))));
    await dispatch(endFlow(FETCHING_PROJECT_DATASETS));
};


const createProject = networkAction(project => ({
    types: CREATE_PROJECT,
    url: "/api/project/projects",
    req: {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(project)
    },
    err: "Error creating project",
    afterAction: data => async dispatch => await dispatch(selectProject(data.id))
}));

export const createProjectIfPossible = project => async (dispatch, getState) => {
    // TODO: Need object response from POST (is this done??)
    if (getState().projects.isCreating) return;
    await dispatch(createProject(project));
};

export const deleteProject = networkAction(projectID => ({
    types: DELETE_PROJECT,
    params: {projectID},
    url: `/api/project/projects/${projectID}`,
    req: {method: "DELETE"},
    err: `Error deleting project '${projectID}'`  // TODO: More user-friendly error
}));  // TODO: Fix project selection afterwards

export const deleteProjectIfPossible = projectID => async (dispatch, getState) => {
    if (getState().projects.isDeleting) return;
    await dispatch(deleteProject(projectID));

    // TODO: Do we need to delete project datasets as well? What to do here??
};

const saveProject = networkAction(project => ({
    types: SAVE_PROJECT,
    params: {projectID: project.id},
    url: `/api/project/projects/${project.id}`,
    req: {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(project)
    },
    err: `Error saving project '${project.id}'`,  // TODO: More user-friendly error
    afterAction: () => async dispatch => dispatch(endProjectEditing())
}));

export const saveProjectIfPossible = project => async (dispatch, getState) => {
    if (getState().projects.isDeleting) return;
    if (getState().projects.isSaving) return;
    await dispatch(saveProject(project));
};


export const addProjectDataset = (projectID, serviceID, dataTypeID, datasetName) => async (dispatch, getState) => {
    if (getState().projectDatasets.isAdding) return;

    await dispatch(beginFlow(PROJECT_DATASET_ADDITION));
    await dispatch(beginAddingServiceDataset());

    const terminate = async () => {
        await dispatch(terminateAddingServiceDataset());
        await dispatch(terminateFlow(PROJECT_DATASET_ADDITION));
    };

    try {
        const formData = new FormData();
        formData.append("name", datasetName.trim());

        const serviceResponse = await fetch(
            `/api/${getState().services.itemsByID[serviceID].name}/datasets?data-type=${dataTypeID}`,
            {method: "POST", body: formData});

        if (serviceResponse.ok) {
            const serviceDataset = await serviceResponse.json();

            const projectResponse = await fetch(`/api/project/projects/${projectID}/datasets`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    dataset_id: serviceDataset.id,
                    service_id: serviceID,
                    data_type_id: dataTypeID
                })
            });

            if (projectResponse.ok) {
                // TODO: GUI success message
                const projectDataset = await projectResponse.json();
                await dispatch(endAddingServiceDataset(serviceID, dataTypeID, serviceDataset));
                await dispatch(endProjectDatasetAddition(projectID, projectDataset));
            } else {
                // TODO: Delete previously-created dataset
                // TODO: GUI error message
                console.error(projectResponse);
                await terminate();
            }
        } else {
            // TODO: GUI error message
            console.error(serviceResponse);
            await terminate();
        }
    } catch (e) {
        // TODO: Delete previously-created dataset if needed, or add another try-catch level
        // TODO: GUI error message
        console.error(e);
        await terminate();
    }
};


// TODO: If needed
export const fetchDropBoxTree = networkAction(() => ({
    types: FETCH_DROP_BOX_TREE,
    url: "/api/drop_box/tree",
    err: "Error fetching drop box tree"  // TODO: More user-friendly error
}));


// TODO: If needed
export const fetchRuns = networkAction(() => ({
    types: FETCH_RUNS,
    url: "/api/wes/runs",
    err: "Error fetching WES runs"
}));

export const fetchRunDetails = networkAction(runID => ({
    types: FETCH_RUN_DETAILS,
    params: {runID},
    url: `/api/wes/runs/${runID}`,
    err: `Error fetching run details for run ${runID}`
}));


const RUN_DONE_STATES = ["COMPLETE", "EXECUTOR_ERROR", "SYSTEM_ERROR", "CANCELED"];

export const fetchRunDetailsIfNeeded = runID => async (dispatch, getState) => {
    const state = getState();

    const needsUpdate = !state.runs.itemDetails.hasOwnProperty(runID)
        || (!state.runs.itemDetails[runID].isFetching && (!state.runs.itemDetails[runID].details
            || !RUN_DONE_STATES.includes(state.runs.itemDetails[runID].details.state)));

    if (needsUpdate) await dispatch(fetchRunDetails(runID));
};


export const submitIngestionWorkflowRun = (serviceID, datasetID, workflow, inputs, redirect, history) =>
    async (dispatch, getState) => {
        await dispatch(beginFlow(INGESTION_RUN_SUBMISSION));

        const serviceName = getState().services.itemsByID[serviceID].name;
        let namespacedInputs = Object.fromEntries(Object.entries(inputs).map(([k, v]) => [`${workflow.id}.${k}`, v]));

        // TODO: Need to handle files properly for file inputs

        try {
            const formData = new FormData();

            formData.append("workflow_params", JSON.stringify(namespacedInputs));
            formData.append("workflow_type", "WDL");  // TODO: Should eventually not be hard-coded
            formData.append("workflow_type_version", "1.0");  // TODO: "
            formData.append("workflow_engine_parameters", JSON.stringify({}));  // TODO: Currently unused
            formData.append("workflow_url",
                `${window.location.origin}/api/${serviceName}/workflows/${workflow.id}.wdl`);
            formData.append("tags", JSON.stringify({
                workflow_id: workflow.id,
                workflow_metadata: workflow,
                ingestion_url: `${window.location.origin}/api/${serviceName}/ingest`,
                dataset_id: datasetID  // TODO
            }));

            const response = await fetch("/api/wes/runs", {
                method: "POST",
                body: formData
            });

            if (response.ok) {
                const runID = (await response.json())["run_id"];
                message.success(`Ingestion with run ID "${runID}" submitted!`);

                await dispatch(fetchRuns());  // TODO: Maybe just load delta?
                // TODO: Navigate to workflow runs and scroll to the correct entry

                if (redirect) history.push(redirect);
            } else {
                // TODO: GUI error message
                console.error(response);
            }
        } catch (e) {
            // TODO: GUI error message
            console.error(e);
            // TODO: Emit event
        }

        // TODO: Separate event for success/failure?
        await dispatch(endFlow(INGESTION_RUN_SUBMISSION));
    };
