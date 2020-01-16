import React, {Component} from "react";
import {connect} from "react-redux";

import DatasetFormModal from "./DatasetFormModal";
import Project from "./Project";

import {saveProjectIfPossible} from "../../../modules/metadata/actions";
import {beginProjectEditing, endProjectEditing} from "../../../modules/manager/actions";

class RoutedProject extends Component {
    constructor(props) {
        super(props);
        this.state = {
            datasetAdditionModal: false,
            datasetEditModal: false,
            selectedDataset: null
        };
    }

    componentDidMount() {
        this.showDatasetAdditionModal = this.showDatasetAdditionModal.bind(this);
        this.hideDatasetAdditionModal = this.hideDatasetAdditionModal.bind(this);
        this.hideDatasetEditModal = this.hideDatasetEditModal.bind(this);
        this.ingestIntoTable = this.ingestIntoTable.bind(this);
    }

    ingestIntoTable(p, t) {
        this.props.history.push("/data/manager/ingestion", {selectedTable: `${p.identifier}:${t.data_type}:${t.id}`});
    }

    handleProjectSave(project) {
        // TODO: Form validation for project
        this.props.saveProject(project);
    }

    showDatasetAdditionModal() {
        this.setState({datasetAdditionModal: true});
    }

    hideDatasetAdditionModal() {
        this.setState({datasetAdditionModal: false});
    }

    hideDatasetEditModal() {
        this.setState({datasetEditModal: false});
    }

    render() {
        const selectedProjectID = this.props.match.params.project;
        if (selectedProjectID) {
            const project = this.props.projectsByID[this.props.match.params.project];
            // TODO: 404 if project is undefined

            const tables = this.props.serviceTablesByServiceAndDataTypeID;

            /**
             * @typedef {Object} ProjectTable
             * @property {string} table_id
             * @property {string} service_id
             * @property {string} dataset
             * @property {string} data_type
             * @property {string} sample
             * @type {ProjectTable[]}
             */
            const projectTableRecords = this.props.projectTablesByProjectID[selectedProjectID] || [];

            const manageableDataTypes = this.props.services
                .filter(s =>
                    (s.metadata || {chordManageableTables: false}).chordManageableTables &&
                    (this.props.serviceDataTypesByServiceID[s.id] || {}).items)
                .flatMap(s => this.props.serviceDataTypesByServiceID[s.id].items.map(dt => dt.id));


            const tableList = projectTableRecords
                .filter(table =>  tables.hasOwnProperty(table.service_id))
                .map(table => (tables[table.service_id][table.data_type].tables || [])
                    .filter(tb => tb.id === table.table_id)
                    .map(tb => ({...tb, ...table})))
                .flat();

            // TODO: Inconsistent schemas
            const strayTables = [
                ...this.props.serviceTables.filter(t2 =>
                    !this.props.projectTables.map(t => t.table_id).includes(t2.id) &&
                    manageableDataTypes.includes(t2.data_type)).map(t => ({...t, table_id: t.id})),
                ...this.props.projectTables.filter(t => !this.props.servicesByID.hasOwnProperty(t.service_id))
            ];

            return (
                <>
                    <DatasetFormModal mode="add"
                                      visible={this.state.datasetAdditionModal}
                                      onCancel={this.hideDatasetAdditionModal}
                                      onOk={this.hideDatasetAdditionModal} />

                    <DatasetFormModal mode="edit"
                                      visible={this.state.datasetEditModal}
                                      initialValue={this.state.selectedDataset}
                                      onCancel={this.hideDatasetEditModal}
                                      onOk={this.hideDatasetEditModal} />

                    <Project value={project}
                             tables={tableList}
                             strayTables={strayTables}
                             loadingTables={this.props.loadingAuthDependentData}
                             editing={this.props.editingProject}
                             saving={this.props.savingProject}
                             individuals={this.props.individuals.filter(i =>
                                 i.phenopackets
                                     .filter(p => project.datasets.map(d => d.identifier).includes(p.dataset))
                                     .length > 0)}
                             loadingIndividuals={this.props.loadingIndividuals}
                             onDelete={() => this.props.toggleProjectDeletionModal()}
                             onEdit={() => this.props.beginProjectEditing()}
                             onCancelEdit={() => this.props.endProjectEditing()}
                             onSave={project => this.handleProjectSave(project)}
                             onAddDataset={() => this.showDatasetAdditionModal()}
                             onEditDataset={dataset => {
                                 this.setState({
                                     selectedDataset: dataset,
                                     datasetEditModal: true
                                 })
                             }}
                             onTableIngest={(p, t) => this.ingestIntoTable(p, t)} />
                 </>
            );
        }

        return null;
    }
}

const mapStateToProps = state => ({
    editingProject: state.manager.editingProject,
    savingProject: state.projects.isSaving,

    services: state.services.items,
    servicesByID: state.services.itemsByID,

    serviceDataTypesByServiceID: state.serviceDataTypes.dataTypesByServiceID,

    serviceTables: state.serviceTables.items,
    serviceTablesByServiceAndDataTypeID: state.serviceTables.itemsByServiceAndDataTypeID,

    projects: state.projects.items,
    projectsByID: state.projects.itemsByID,

    projectTables: state.projectTables.items,
    projectTablesByProjectID: state.projectTables.itemsByProjectID,

    loadingAuthDependentData: state.auth.isFetchingDependentData,

    phenopackets: state.phenopackets.items,
    individuals: state.individuals.items,

    loadingPhenopackets: state.phenopackets.isFetching,
    loadingIndividuals: state.individuals.isFetching,
});

const mapDispatchToProps = dispatch => ({
    beginProjectEditing: () => dispatch(beginProjectEditing()),
    endProjectEditing: () => dispatch(endProjectEditing()),
    saveProject: project => dispatch(saveProjectIfPossible(project)),
});

export default connect(mapStateToProps, mapDispatchToProps)(RoutedProject);