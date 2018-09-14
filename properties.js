define([], function () {
    "use strict";

    return {
        type: "items",
        component: "accordion",
        items: {
            dimensions: {
                uses: "dimensions",
                min: 1,
                items: {
                    type: {
                        type: "string",
                        component: "dropdown",
                        label: "Dimension Type",
                        ref: "qDef.type",
                        options: [
                            {
                                value: "row",
                                label: "Row"
                            },
                            {
                                value: "col",
                                label: "Column"
                            }
                        ],
                        defaultValue: "row"
                    }
                }
            },
            measures: {
                uses: "measures",
                min: 1
            },
            sorting: {
                uses: "sorting"
            },
            settings: {
                uses: "settings",
                items: {
                    initFetch: {
                        type: "items",
                        label: "Intial Fetch",
                        items: {
                            initFetchCols: {
                                ref: "qHyperCubeDef.qInitialDataFetch.0.qWidth",
                                label: "Cube 1 - Initial fetch cols",
                                type: "number",
                                defaultValue: 15
                            },
                            initFetchRows: {
                                ref: "qHyperCubeDef.qInitialDataFetch.0.qHeight",
                                label: "Cube 1 - Initial fetch rows",
                                type: "number",
                                defaultValue: 50
                            }
                        }
                    },
                    General: {
                        type: "items",
                        label: "Table Configuration",
                        items: {
                            showTotals: {
                                type: "boolean",
                                component: "switch",
                                ref: "props.showTableUI",
                                label: "Show Table UI (Beta)",
                                options: [{
                                    value: true,
                                    label: "Yes"
                                }, {
                                    value: false,
                                    label: "No"
                                }],
                                defaultValue: false
                            },
                            labelTotals: {
                                type: "string",
                                ref: "props.labelTotals",
                                label: "Label Totals",
                                defaultValue: "Totals"
                            },
                            columnOrder: {
                                type: "string",
                                ref: "props.columnOrder",
                                label: "Column Order",
                                defaultValue: "0,1,2"
                            }
                        }
                    }
                }
            }
        }
    };
});