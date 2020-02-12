import React, {Component} from "react";
import {connect} from "react-redux";
import {withRouter} from "react-router-dom";

import {Button, Divider, Drawer} from "antd";
import "antd/es/button/style/css";
import "antd/es/divider/style/css";
import "antd/es/drawer/style/css";

import {markNotificationAsRead, hideNotificationDrawer} from "../../modules/notifications/actions";

import NotificationList from "./NotificationList";


class NotificationDrawer extends Component {
    constructor(props) {
        super(props);
        this.seeAllNotifications = this.seeAllNotifications.bind(this);
    }

    seeAllNotifications() {
        this.props.hideNotificationDrawer();
        this.props.history.push("/notifications");
    }

    render() {
        return <Drawer title={"Notifications"}
                       visible={this.props.notificationDrawerVisible}
                       width="auto"
                       onClose={() => this.props.hideNotificationDrawer()}>
            <NotificationList small={true} notifications={this.props.notifications.filter(n => !n.read)} />
              <Divider />
              <Button type="link" style={{width: "100%"}} onClick={() => this.seeAllNotifications()}>
                  See Read Notifications</Button>
        </Drawer>;
    }
}

const mapStateToProps = state => ({
    notificationDrawerVisible: state.notifications.drawerVisible,
    notifications: state.notifications.items,
});

const mapDispatchToProps = dispatch => ({
    markNotificationAsRead: nID => dispatch(markNotificationAsRead(nID)),
    hideNotificationDrawer: () => dispatch(hideNotificationDrawer())
});

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(NotificationDrawer));