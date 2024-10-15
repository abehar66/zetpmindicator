sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "../model/formatter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    '../model/oDataModel',
], function (BaseController, JSONModel, formatter, Filter, FilterOperator,oDataModel) {
    "use strict";

    return BaseController.extend("zetpmindicator.controller.Worklist", {

        formatter: formatter,

        /* =========================================================== */
        /* lifecycle methods                                           */
        /* =========================================================== */

        /**
         * Called when the worklist controller is instantiated.
         * @public
         */
        onInit : function () {
            var oViewModel;

            // keeps the search state
            this._aTableSearchState = [];

            // Model used to manipulate control states
            oViewModel = new JSONModel({
                worklistTableIRMTitle : this.getResourceBundle().getText("worklistTableIRMTitle"),
                worklistTableIRGTitle : this.getResourceBundle().getText("worklistTableIRGTitle"),
                worklistTableIFPTitle : this.getResourceBundle().getText("worklistTableIFPTitle"),
                shareSendEmailSubject: this.getResourceBundle().getText("shareSendEmailWorklistSubject"),
                shareSendEmailMessage: this.getResourceBundle().getText("shareSendEmailWorklistMessage", [location.href]),
                tableNoDataText : this.getResourceBundle().getText("tableNoDataText")
            });
            this.setModel(oViewModel, "worklistView");

            this.reportModel = new JSONModel(
                {
                    'IndicatorSet': [],
                    'IRMHSet': [],
                    'IRMSet': [],
                    'IRGSet': [],
                    'IFPSet': [],
                    'Parameters' : {
                                    'Desde': new Date(),
                                    'Hasta': new Date(),
                                   },
                    'Taller': []               
                });

            this.setModel(this.reportModel, "ReportModel");
            oDataModel.init(this);
            this.loadTaller();

        },

        /* =========================================================== */
        /* event handlers                                              */
        /* =========================================================== */

        /**
         * Triggered by the table's 'updateFinished' event: after new table
         * data is available, this handler method updates the table counter.
         * This should only happen if the update was successful, which is
         * why this handler is attached to 'updateFinished' and not to the
         * table's list binding's 'dataReceived' method.
         * @param {sap.ui.base.Event} oEvent the update finished event
         * @public
         */
        onUpdateFinished : function (oEvent) {
            // update the worklist's object counter after the table update
            var sTitle,
                oTable = oEvent.getSource(),
                iTotalItems = oEvent.getParameter("total");
            // only update the counter if the length is final and
            // the table is not empty
            if (iTotalItems && oTable.getBinding("items").isLengthFinal()) {
                sTitle = this.getResourceBundle().getText("worklistTableTitleCount", [iTotalItems]);
            } else {
                sTitle = this.getResourceBundle().getText("worklistTableTitle");
            }
            this.getModel("worklistView").setProperty("/worklistTableTitle", sTitle);
        },

        /**
         * Event handler when a table item gets pressed
         * @param {sap.ui.base.Event} oEvent the table selectionChange event
         * @public
         */
        onPress : function (oEvent) {
            // The source is the list item that got pressed
            this._showObject(oEvent.getSource());
        },

        /**
         * Event handler for navigating back.
         * Navigate back in the browser history
         * @public
         */
        onNavBack : function() {
            // eslint-disable-next-line fiori-custom/sap-no-history-manipulation, fiori-custom/sap-browser-api-warning
            history.go(-1);
        },


        onSearch : function (oEvent) {
            if (oEvent.getParameters().refreshButtonPressed) {
                // Search field's 'refresh' button has been pressed.
                // This is visible if you select any main list item.
                // In this case no new search is triggered, we only
                // refresh the list binding.
                this.onRefresh();
            } else {
                var aTableSearchState = [];
                var sQuery = oEvent.getParameter("query");

                if (sQuery && sQuery.length > 0) {
                    aTableSearchState = [new Filter("IRM", FilterOperator.Contains, sQuery)];
                }
                this._applySearch(aTableSearchState);
            }

        },

        /**
         * Event handler for refresh event. Keeps filter, sort
         * and group settings and refreshes the list binding.
         * @public
         */
        onRefresh : function () {
            var oTable = this.byId("table");
            oTable.getBinding("items").refresh();
        },

        /* =========================================================== */
        /* internal methods                                            */
        /* =========================================================== */

        /**
         * Shows the selected item on the object page
         * @param {sap.m.ObjectListItem} oItem selected Item
         * @private
         */
        _showObject : function (oItem) {
            this.getRouter().navTo("object", {
                objectId: oItem.getBindingContext().getPath().substring("/IndicatorsSet".length)
            });
        },

        /**
         * Internal helper method to apply both filter and search state together on the list binding
         * @param {sap.ui.model.Filter[]} aTableSearchState An array of filters for the search
         * @private
         */
        _applySearch: function(aTableSearchState) {
            var oTable = this.byId("table"),
                oViewModel = this.getModel("worklistView");
            oTable.getBinding("items").filter(aTableSearchState, "Application");
            // changes the noDataText of the list in case there are no filter results
            if (aTableSearchState.length !== 0) {
                oViewModel.setProperty("/tableNoDataText", this.getResourceBundle().getText("worklistNoDataWithSearchText"));
            }
        },

        loadTaller: function () {
            oDataModel.getListMaestro('TALLER')
                .then(oData => {
                    if (oData.results.length === 1) {
                        this.getView().byId('IdTaller').setSelectedKey(oData.results[0].Key);
                        this.getView().byId('IdTaller').setValue(oData.results[0].Value);                        
                        this.reportModel.setProperty('/Taller', oData.results);                                                
                    }
                    else {
                        this.reportModel.setProperty('/Taller', oData.results);                        
                    }
                })
                .catch(e => {

                })
        },

        onDisplay: function (evt) {            
            const desde = this.reportModel.getProperty('/Parameters/Desde');
            const hasta = this.reportModel.getProperty('/Parameters/Hasta');
            const taller = this.getView().byId('IdTaller').getSelectedKey();
            
            var dateFormat = sap.ui.core.format.DateFormat.getInstance({ UTC: true, pattern: "yyyyMMdd" });
            var ini = dateFormat.format(desde);
            var fin = dateFormat.format(hasta);            

            this.getIRMSet(taller,ini,fin);
            this.getIRGSet(taller,ini,fin);
            this.getIFPSet(taller,ini,fin);            
        },

        getIRMSet: function(taller,desde,hasta){
            const tableIRM = this.byId("IRMView1--tableIRM");

            tableIRM.setBusy(true);
            oDataModel.getIndicatorSet('IRM',taller,desde,hasta)
                .then(oData => {
                    let tableHeader = [];
                    let tablePosition = [];

                    oData.results.forEach(e => {

                    });

                    this.reportModel.setProperty('/IRMSet', tableHeader );

                    tableIRM.getBinding("items").getModel().setProperty("/IRMSet", oData.results);                    
                    tableIRM.setBusy(false);
                })
                .catch(e => {
                    tableIRM.setBusy(false);
                })        
        },    

        getIRGSet: function(taller,desde,hasta){
            const tableIRG = this.byId("IRGView1--tableIRG");

            tableIRG.setBusy(true);
            oDataModel.getIndicatorSet('IRG',taller,desde,hasta)
                .then(oData => {
                    this.reportModel.setProperty('/IRGSet', oData.results);
                    tableIRG.getBinding("items").getModel().setProperty("/IRGSet", oData.results);                    
                    tableIRG.setBusy(false);
                })
                .catch(e => {
                    tableIRG.setBusy(false);
                })
        },    

        getIFPSet: function(taller,desde,hasta){
            const tableIFP = this.byId("IFPView1--tableIFP");

            tableIFP.setBusy(true);
            oDataModel.getIndicatorSet('IFP',taller,ini,fin)
                .then(oData => {
                    this.reportModel.setProperty('/IFPSet', oData.results);
                    tableIRM.getBinding("items").getModel().setProperty("/IFPSet", oData.results);                    
                    tableIFP.setBusy(false);
                })
                .catch(e => {
                    tableIFP.setBusy(false);
                })
        },    

    });
});
