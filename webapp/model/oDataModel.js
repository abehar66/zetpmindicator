sap.ui.define([
    'sap/ui/model/FilterOperator',
    'sap/ui/model/Filter',
    'sap/ui/model/odata/v2/ODataModel'
], 
    /**
     * provide app-view type models (as in the first "V" in MVVC)
     * 
     * @param {typeof sap.ui.model.json.JSONModel} JSONModel
     * @param {typeof sap.ui.Device} Device
     * 
     * @returns {Function} createDeviceModel() for providing runtime info for the device the UI5 app is running on
     */
    function (FilterOperator, Filter, ODataModel) {
        "use strict";
        const movEntity = '/MovimientosSet';
        const maestroEntity = '/MaestroSet';
        const orderEntity = '/OrderSet';
        const noticeEntity = '/NoticeSet';
        const WorkPerformedEntity = '/WorkPerformedSet';
        const IndicatorEntity = '/IndicatorsSet';

        return {
            init:function(caller){
                this.caller = caller;
                this.odataModel = caller.getOwnerComponent().getModel();

                try{
                    this.UserId = sap.ushell.Container.getService("UserInfo").getId();
                }catch(e){
                    this.UserId = 'ET2966';
                }
                
            },

            getListOrden:function(Idtaller,desde,hasta){                                     
                let Filters = [                     
                    new Filter({
                        path: 'Idtaller',
                        operator: FilterOperator.EQ,
                        value1: Idtaller
                    }),                     
                    new Filter({
                        path: 'Datecreated',
                        operator: FilterOperator.EQ,
                        value1: desde
                    }),
                    new Filter({
                        path: 'Dateended',
                        operator: FilterOperator.EQ,
                        value1: hasta
                    })                    
                ];                
                
                return new Promise(function (resolve, reject) {
                    this.odataModel.read(WorkPerformedEntity, {  
                        filters: Filters,  
                        success: oData => {
                            resolve(oData)
                        },
                        error: e => {
                            reject(e)
                        }
                    });
                }.bind(this))

            },          
            
            getIndicatorSet:function(indicator,idtaller,desde,hasta){ 

                let Filters = [        
                    new Filter({
                        path: 'IndicatorName',
                        operator: FilterOperator.EQ,
                        value1: indicator
                    }),                 
                    new Filter({
                        path: 'TallerId',
                        operator: FilterOperator.EQ,
                        value1: idtaller
                    }),                     
                    new Filter({
                        path: 'DateCreated',
                        operator: FilterOperator.EQ,
                        value1: desde
                    }),
                    new Filter({
                        path: 'DateEnded',
                        operator: FilterOperator.EQ,
                        value1: hasta
                    })                    
                ];                
                
                return new Promise(function (resolve, reject) {
                    this.odataModel.read(IndicatorEntity, {  
                        filters: Filters,  
                        success: oData => {
                            resolve(oData)
                        },
                        error: e => {
                            reject(e)
                        }
                    });
                }.bind(this))

            },   

            parseError: function (e) {
                let errorMessage = "";
                try {
                    errorMessage = JSON.parse(e.responseText).error.message.value;
                } catch (error) {
                    errorMessage = e.responseText;
                }
                return errorMessage;
            }, 
            
            getListMaestro:function(maestro){

                let Filters = [ 
                    new Filter({
                        path: 'Maestro',
                        operator: FilterOperator.EQ,
                        value1: maestro
                    }),
                    new Filter({
                        path: 'Usuario',
                        operator: FilterOperator.EQ,
                        value1: this.UserId
                    }),         
                ];
                
                return new Promise(function (resolve, reject) {

                    this.odataModel.read(maestroEntity, {  
                        filters: Filters,  
                        success: oData => {
                            resolve(oData)
                        },
                        error: e => {
                            reject(e)
                        }
                    });
                }.bind(this))

            },            
    };
});
