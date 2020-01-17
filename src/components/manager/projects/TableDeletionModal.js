import React, {Component} from "react";
import {connect} from "react-redux";
import PropTypes from "prop-types";

import {Button, Modal, Typography} from "antd";

import "antd/es/button/style/css";
import "antd/es/modal/style/css";
import "antd/es/typography/style/css";


class TableDeletionModal extends Component {
    render() {
        return (
            <Modal visible={this.props.visible}
                   title={`Are you sure you want to delete the "${(this.props.table || {}).name || ""}" table?`}
                   footer={[
                       <Button key="cancel" onClick={() => (this.props.onCancel || (() => {}))()}>Cancel</Button>,
                       <Button key="confirm"
                               icon="delete"
                               type="danger"
                               onClick={() => (this.props.onSubmit || (() => {}))()}
                               loading={this.props.isDeletingTable}>
                           Delete
                       </Button>
                   ]}
                   onCancel={this.onCancel}>
                <Typography.Paragraph>
                    Deleting this table means all data contained in the table will be deleted permanently, and
                    the will no longer be available for discovery within the CHORD federation.
                    {/* TODO: Real terms and conditions */}
                </Typography.Paragraph>
            </Modal>
        )
    }
}

TableDeletionModal.propTypes = {
    visible: PropTypes.bool,
    table: PropTypes.object,

    isDeletingTable: PropTypes.bool,

    onSubmit: PropTypes.func,
    onCancel: PropTypes.func
};

const mapStateToProps = state => ({
    isDeletingTable: state.serviceTables.isDeleting || state.projectTables.isDeleting
});

export default connect(mapStateToProps)(TableDeletionModal);
