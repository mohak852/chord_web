import React, {Component} from "react";
import {connect} from "react-redux";
import {Link, Redirect, Route, Switch, withRouter} from "react-router-dom";

import {Icon, Layout, Menu, PageHeader} from "antd";
import "antd/es/icon/style/css";
import "antd/es/layout/style/css";
import "antd/es/menu/style/css";
import "antd/es/page-header/style/css";

import DiscoveryHomeContent from "./discovery/DiscoveryHomeContent";
import DiscoverySearchContent from "./discovery/DiscoverySearchContent";
import DiscoverySchemaContent from "./discovery/DiscoverySchemaContent";

import {selectDiscoveryServiceDataType, clearDiscoveryServiceDataType} from "../actions";


const searchURL = (sID, dID) => `/data/discovery/${sID}/data-types/${dID}/search`;
const schemaURL = (sID, dID) => `/data/discovery/${sID}/data-types/${dID}/schema`;


class DataDiscoveryContent extends Component {
    constructor(props) {
        super(props);
        this.renderContent = this.renderContent.bind(this);
    }

    componentDidMount() {
        document.title = "CHORD - Discover Data";
    }

    renderContent(Content) {
        const dataMenus = this.props.services.filter(s => s.metadata["chordDataService"]).map(s => {
            const menuItems = Object.keys(this.props.dataTypes).includes(s.id)
                ? this.props.dataTypes[s.id].map(d => (
                    <Menu.SubMenu key={`${s.id}_data_type_${d.id}_menu`} title={<span>{d.id}</span>}>
                        <Menu.Item key={searchURL(s.id, d.id)}>
                            <Link to={searchURL(s.id, d.id)}>
                                <Icon type="search" />
                                <span>Search</span>
                            </Link>
                        </Menu.Item>
                        <Menu.Item key={schemaURL(s.id, d.id)}>
                            <Link to={schemaURL(s.id, d.id)}>
                                <Icon type="build" />
                                <span>Data Schema</span>
                            </Link>
                        </Menu.Item>
                    </Menu.SubMenu>
                ))
                : (
                    <Menu.Item key={`${s.id}_loading_data_types`} disabled>
                        <span>
                            <Icon type="close" />
                            <span>No data types loaded</span>
                        </span>
                    </Menu.Item>
                );

            return (
                <Menu.SubMenu key={`${s.id}_menu`} title={<span>
                    <Icon type="database" />
                    <span>{s.name} data types</span>
                </span>}>{menuItems}</Menu.SubMenu>
            );
        });

        return route => {
            if (route.match.params["service"] && route.match.params["data_type"]) {
                // TODO: HANDLE WRONG IDs
                this.props.selectDataType(route.match.params["service"], route.match.params["data_type"]);
            } else if (this.props.selectedServiceID || this.props.selectedDataTypeID) {
                this.props.clearSelectedDataType();
            }

            return (
                <div>
                    <PageHeader title="Data Discovery" subTitle="Federated data exploration"
                                style={{borderBottom: "1px solid rgb(232, 232, 232)"}}/>
                    <Layout>
                        <Layout.Sider width="256" theme="light">
                            <Menu mode="inline"
                                  defaultOpenKeys={Object.keys(route.match.params).includes("service")
                                      ? [`${route.match.params["service"]}_menu`,
                                          `${route.match.params["service"]}_data_type_${route.match.params["data_type"]}_menu`]
                                      : []}
                                  selectedKeys={[route.location.pathname]} style={{height: "100%", padding: "16px 0"}}>
                                <Menu.Item key="/data/discovery/home" style={{paddingLeft: "0"}}>
                                    <Link to="/data/discovery/home">
                                        <Icon type="home"/>
                                        <span>Home</span>
                                    </Link>
                                </Menu.Item>
                                {dataMenus}
                            </Menu>
                        </Layout.Sider>
                        <Layout.Content style={{background: "white", padding: "24px 32px"}}>
                            <Content />
                        </Layout.Content>
                    </Layout>
                </div>
            );
        }
    }

    render() {
        return (
            <Switch>
                <Route exact path="/data/discovery/home"
                       component={this.renderContent(DiscoveryHomeContent)} />
                <Route path="/data/discovery/:service/data-types/:data_type/search"
                       component={this.renderContent(DiscoverySearchContent)} />
                <Route path="/data/discovery/:service/data-types/:data_type/schema"
                       component={this.renderContent(DiscoverySchemaContent)} />
                <Redirect from="/data/discovery" to="/data/discovery/home" />
            </Switch>
        );
    }
}

const mapStateToProps = state => ({
    services: state.services.items,
    dataTypes: state.serviceDataTypes.dataTypes,
    selectedServiceID: state.discovery.selectedServiceID,
    selectedDataTypeID: state.discovery.selectedDataTypeID
});

const mapDispatchToProps = dispatch => ({
    selectDataType: (serviceID, dataTypeID) => dispatch(selectDiscoveryServiceDataType(serviceID, dataTypeID)),
    clearSelectedDataType: () => dispatch(clearDiscoveryServiceDataType())
});

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(DataDiscoveryContent));
