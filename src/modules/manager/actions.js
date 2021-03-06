import {
    basicAction,
    createNetworkActionTypes,
    createFlowActionTypes,
    networkAction
} from "../../utils/actions";


export const TOGGLE_PROJECT_CREATION_MODAL = "TOGGLE_PROJECT_CREATION_MODAL";

export const PROJECT_EDITING = createFlowActionTypes("PROJECT_EDITING");

export const FETCH_DROP_BOX_TREE = createNetworkActionTypes("FETCH_DROP_BOX_TREE");


export const toggleProjectCreationModal = basicAction(TOGGLE_PROJECT_CREATION_MODAL);

export const beginProjectEditing = basicAction(PROJECT_EDITING.BEGIN);
export const endProjectEditing = basicAction(PROJECT_EDITING.END);


// TODO: If needed
export const fetchDropBoxTree = networkAction(() => (dispatch, getState) => ({
    types: FETCH_DROP_BOX_TREE,
    url: `${getState().services.dropBoxService.url}/tree`,
    err: "Error fetching drop box tree"  // TODO: More user-friendly error
}));
