import React, {Component} from "react";
import {connect} from "react-redux";
import {withRouter} from "react-router-dom";
import PropTypes from "prop-types";

import {Typography} from "antd";
import "antd/es/typography/style/css";

import DiscoveryQueryBuilder from "../discovery/DiscoveryQueryBuilder";
import {
    addDataTypeFormIfPossible,
    extractQueriesFromDataTypeForms,
    removeDataTypeFormIfPossible,
    updateDataTypeFormIfPossible
} from "../../utils/search";
import fetch from "cross-fetch";
import {datasetPropTypesShape, serviceInfoPropTypesShape} from "../../propTypes";

class ExplorerDatasetSearch extends Component {
    constructor(props) {
        super(props);

        this.setDataTypeForms = this.setDataTypeForms.bind(this);
        this.handleSearch = this.handleSearch.bind(this);

        this.state = {
            dataTypeForms: [],
            fetchingSearch: false,  // TODO: redux
            searchPerformedByDataset: {},
            searchResultsByDataset: {},
        };
    }

    setDataTypeForms(dataTypeForms) {
        this.setState({dataTypeForms});
    }

    async handleSearch() {
        const dataTypeQueries = extractQueriesFromDataTypeForms(this.state.dataTypeForms);

        // TODO: What to do if phenopacket data type not present?
        // Must include phenopacket query so we can display phenopacket-styled results
        if (!dataTypeQueries.hasOwnProperty("phenopacket")) {
            dataTypeQueries["phenopacket"] = true;
        }

        console.log(dataTypeQueries);

        this.setState({fetchingSearch: true});

        try {
            const selectedDatasetID = this.props.match.params.dataset;
            if (!selectedDatasetID) return;

            // TODO: This should be done server side
            const r = await fetch(
                `${this.props.federationServiceInfo.url}/private/dataset-search/${selectedDatasetID}`,
                {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({
                        data_type_queries: dataTypeQueries,
                        join_query: null
                    })
                });

            const results = await r.json();

            this.setState({
                searchPerformedByDataset: {
                    ...this.state.searchPerformedByDataset,
                    [selectedDatasetID]: true
                }
            });

            if (results && results.results) {
                this.setState({
                    searchResultsByDataset: {
                        ...this.state.searchPerformedByDataset,
                        [selectedDatasetID]: results.results
                    }
                });
            }

            console.log(results);
        } catch (err) {
            console.error(err);
        }

        this.setState({fetchingSearch: false});
    }

    render() {
        if (!this.props.match.params.dataset) return null;  // TODO

        const selectedDataset = this.props.datasetsByID[this.props.match.params.dataset];

        if (!selectedDataset) return null;  // TODO

        return <>
            <Typography.Title level={4}>Explore Dataset {selectedDataset.title}</Typography.Title>
            <DiscoveryQueryBuilder isInternal={true}
                                   dataTypeForms={this.state.dataTypeForms}
                                   onSubmit={() => this.handleSearch()}
                                   searchLoading={this.state.fetchingSearch}
                                   addDataTypeQueryForm={dt => this.setDataTypeForms(
                                       addDataTypeFormIfPossible(this.state.dataTypeForms, dt))}
                                   updateDataTypeQueryForm={(dt, fs) => this.setDataTypeForms(
                                       updateDataTypeFormIfPossible(this.state.dataTypeForms, dt, fs))}
                                   removeDataTypeQueryForm={dt => this.setDataTypeForms(
                                       removeDataTypeFormIfPossible(this.state.dataTypeForms, dt))} />
            {this.state.searchPerformedByDataset[selectedDataset.identifier] ? <>
                <Typography.Title level={4}>Search Results</Typography.Title>
                TODO
            </> : null}
        </>;
    }
}

ExplorerDatasetSearch.propTypes = {
    federationServiceInfo: serviceInfoPropTypesShape,
    datasetsByID: PropTypes.objectOf(datasetPropTypesShape),
};

const mapStateToProps = state => ({
    federationServiceInfo: state.services.federationService,
    datasetsByID: Object.fromEntries(state.projects.items
        .flatMap(p => p.datasets.map(d => [d.identifier, {...d, project: p.identifier}]))),
});

export default withRouter(connect(mapStateToProps)(ExplorerDatasetSearch));
