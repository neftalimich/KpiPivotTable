define([
    "qlik",
    "jquery",
    "./initial-properties",
    "./properties",
    "text!./style.css",
    "text!./template.html",
    "text!./pivottable/pivot.css",
    "./pivottable/pivot"
], function (qlik, $, initProps, props, cssContent, template, cssPivot) {
    'use strict';
    $("<style>").html(cssContent).appendTo("head");
    $("<style>").html(cssPivot).appendTo("head");
    $('<link rel="stylesheet" type="text/css" href="/extensions/KpiPivotTable/css/font-awesome.css">').html("").appendTo("head");
    return {
        template: template,
        initialProperties: initProps,
        definition: props,
        support: {
            snapshot: true,
            export: true,
            exportData: true
        },
        paint: function () {
            //setup scope.table
            var self = this;
            if (!self.$scope.table) {
                self.$scope.table = qlik.table(self);
                console.log("start");
                self.$scope.count = 1;
                self.$scope.LoadAllDataPages(self.$scope.table);
                //console.log("KpiPivotTable - Table", self.$scope.table);
            } else {
                if (self.$scope.loadingPages == false) {
                    console.log("start");
                    self.$scope.count = 1;
                    self.$scope.LoadAllDataPages(self.$scope.table);
                }
            }

            return qlik.Promise.resolve();
        },
        controller: ['$scope', '$filter', function ($scope, $filter) {
            //console.log("qsAngularTemplate - layout", $scope.layout);
            $scope.showTable = false;

            // ------------------------------- Watchers
            $scope.count = 1;
            $scope.loadingPages = false;
            $scope.$watchCollection("layout.qHyperCube.qDimensionInfo", function (newValue) {
                $scope.ConfigPivotDimensions();
            });
            $scope.$watchCollection("layout.qHyperCube.qMeasureInfo", function (newValue) {
                $scope.ConfigPivotDimensions();
                $scope.SetPivotMeasures();
            });    
            $scope.$watchCollection("layout.qHyperCube.qDataPages", function (newValue) {
                if ($scope.loadingPages == false) {
                    if (localStorage.getItem("dimConfig" + $scope.layout.qInfo.qId + $scope.layout.qInfo.qId)) {
                        $scope.dimConfig = JSON.parse(localStorage.getItem("dimConfig" + $scope.layout.qInfo.qId));
                        //console.log("dimConfig - Saved", $scope.dimConfig);
                    }
                    $scope.FormatData();
                    $scope.PivotTable();
                }
            });
            // -------------------------------

            // ------------------------------- Load Pages
            $scope.LoadAllDataPages = function (table) {
                if (table) {
                    $scope.showTable = false;
                    $scope.loadingPages = true;
                    //console.log(table.rowCount, table.rows.length);
                    if ($scope.count < 50) {
                        if (table.rowCount > table.rows.length) {
                            table.getMoreData()
                                .then(val => {
                                    //console.log($scope.count);
                                    $scope.count += 1;
                                    $scope.LoadAllDataPages(table);
                                })
                                .catch(err => {
                                    if (err) {
                                        console.log("error", err);
                                    } else {
                                        console.log("Reloading");
                                    }
                                    $scope.table = null;
                                });

                        } else {
                            $scope.ProcessDataPages();
                        }
                    } else {
                        $scope.ProcessDataPages();
                    }
                }
            };
            $scope.ProcessDataPages = function () {
                if (localStorage.getItem("dimConfig" + $scope.layout.qInfo.qId)) {
                    $scope.dimConfig = JSON.parse(localStorage.getItem("dimConfig" + $scope.layout.qInfo.qId));
                    //console.log("dimConfig - Saved", $scope.dimConfig);
                }

                $scope.FormatData();
                $scope.PivotTable();

                $scope.showTable = true;
                $scope.loadingPages = false;
                console.log("end", $scope.count);
            };

            $scope.GetMoreDataPages = function () {
                $scope.count = 1;
                $scope.LoadAllDataPages($scope.table);
            };
            // -------------------------------

            // ------------------------------- User Config
            $scope.UserConfig = function () {
                $scope.SetPivotDimensions();
                $scope.PivotTable();
            };
            // ------------------------------- Enable Dim/Mea
            $scope.DimEnabled = function (dim) {
                dim.enabled = !dim.enabled;
                $scope.SetPivotDimensions();
                $scope.FormatData();
                $scope.PivotTable();
            };
            $scope.Meaenabled = function (mea) {
                mea.enabled = !mea.enabled;
                localStorage.setItem("meaConfig", JSON.stringify($scope.meaConfig));
                $scope.FormatData();
                $scope.PivotTable();
            };            
            // ------------------------------- Order Dim
            $scope.dimUp = function (dim, dimNext) {
                dim.pos += 1;
                dimNext.pos -= 1;
                $scope.UserConfig();
            };
            $scope.dimDown = function (dim, dimPrev) {
                dim.pos -= 1;
                dimPrev.pos += 1;
                $scope.UserConfig();
            };
            // ------------------------------- 

            // ------------------------------- Set Dimensions
            $scope.dimConfig = [];
            $scope.ConfigPivotDimensions = function () {
                $scope.rowsAux = [];
                $scope.colsAux = [];

                let reloadDimConfig = true;
                if (localStorage.getItem("dimConfig" + $scope.layout.qInfo.qId)) {
                    $scope.dimConfig = JSON.parse(localStorage.getItem("dimConfig" + $scope.layout.qInfo.qId));
                    if ($scope.dimConfig.length == $scope.layout.qHyperCube.qDimensionInfo.length) {
                        reloadDimConfig = false;
                    } else {
                        $scope.dimConfig = [];
                    }
                }

                angular.forEach($scope.layout.qHyperCube.qDimensionInfo, function (value, key) {
                    if (reloadDimConfig) {
                        $scope.dimConfig.push({
                            pos: key,
                            qFallbackTitle: value.qFallbackTitle,
                            type: value.type,
                            enabled: true,
                            idx: key
                        });
                    } else {
                        $scope.dimConfig[key].type = value.type;
                        $scope.dimConfig[key].qFallbackTitle = value.qFallbackTitle;
                    }
                    if ($scope.dimConfig[key].enabled) {
                        if (value.type == "row") {
                            $scope.rowsAux.push(value.qFallbackTitle);
                        } else if (value.type == "col") {
                            $scope.colsAux.push(value.qFallbackTitle);
                        }
                    }
                });
                $scope.colsAux.push("Measures");
                localStorage.setItem("dimConfig" + $scope.layout.qInfo.qId, JSON.stringify($scope.dimConfig));
            };
            $scope.SetPivotDimensions = function () {
                $scope.rowsAux = [];
                $scope.colsAux = [];
                $scope.dimConfig = JSON.parse(JSON.stringify($filter('orderBy')($scope.dimConfig, 'pos', false)));
                angular.forEach($scope.dimConfig, function (value, key) {
                    if (value.enabled) {
                        if (value.type == "row") {
                            $scope.rowsAux.push(value.qFallbackTitle);
                        } else if (value.type == "col") {
                            $scope.colsAux.push(value.qFallbackTitle);
                        }
                    }
                });
                localStorage.setItem("dimConfig" + $scope.layout.qInfo.qId, JSON.stringify($scope.dimConfig));
                $scope.colsAux.push("Measures");
                //console.log($scope.rowsAux, $scope.colsAux);
            };
            // ------------------------------- Set Measures
            $scope.meaConfig = [];
            $scope.SetPivotMeasures = function () {
                let reloadMeaConfig = true;
                if (localStorage.getItem("meaConfig")) {
                    $scope.meaConfig = JSON.parse(localStorage.getItem("meaConfig"));
                    if ($scope.meaConfig.length == $scope.layout.qHyperCube.qMeasureInfo.length) {
                        reloadMeaConfig = false;
                    } else {
                        $scope.meaConfig = [];
                    }
                }
               
                angular.forEach($scope.layout.qHyperCube.qMeasureInfo, function (value, key) {
                    if (reloadMeaConfig) {
                        $scope.meaConfig.push({
                            pos: key,
                            qFallbackTitle: value.qFallbackTitle,
                            enabled: true,
                            idx: key
                        });
                    } else {
                        $scope.meaConfig[key].qFallbackTitle = value.qFallbackTitle;
                    }
                });
                
            };
            // -------------------------------

            // ------------------------------- PivotTable
            $scope.FormatData = function () {
                $scope.dataFormated = [];
                let headerRow = [];

                angular.forEach($scope.dimConfig, function (value, key) {
                    if (value.enabled) {
                        headerRow.push(value.qFallbackTitle);
                    }
                });
                headerRow.push("Measures");
                headerRow.push("Value");
                $scope.dataFormated.push(headerRow);

                let dimLength = $scope.layout.qHyperCube.qDimensionInfo.length;
                let meaLength = $scope.layout.qHyperCube.qMeasureInfo.length;

                //console.log("qMatrix", $scope.layout.qHyperCube.qDataPages[0].qMatrix);

                angular.forEach($scope.layout.qHyperCube.qDataPages, function (page, key) {
                    angular.forEach(page.qMatrix, function (row, key) {
                        for (let i = 0; i < meaLength; i++) {
                            if ($scope.meaConfig.length == 0 || $scope.meaConfig[i].enabled) {
                                let rowAux = [];
                                for (let j = 0; j < dimLength; j++) {
                                    if ($scope.dimConfig[j].enabled) {
                                        rowAux.push(row[$scope.dimConfig[j].idx].qText);
                                    }
                                }
                                rowAux.push($scope.layout.qHyperCube.qMeasureInfo[i].qFallbackTitle);
                                rowAux.push(row[dimLength + i].qNum);
                                $scope.dataFormated.push(rowAux);
                            }
                        }
                    });
                });
                //console.log($scope.rowsAux, $scope.colsAux);
                //console.log("dataFormated", $scope.dataFormated);
            };
            // -------------------------------
            $scope.PivotTable = function () {
                var heatmap = $.pivotUtilities.renderers["Heatmap"];
                var sum = $.pivotUtilities.aggregators["Sum"];

                if (!$scope.layout.props.showTableUI) {
                    $("#output").pivot(
                        $scope.dataFormated, {
                            rows: $scope.rowsAux,
                            cols: $scope.colsAux,
                            aggregator: sum(["Value"]),
                            sorters: {
                                Month: $.pivotUtilities.sortAs([
                                    "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
                                    "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
                                ])
                            }
                        });
                } else {
                    $("#output2").pivotUI(
                        $scope.dataFormated, {
                            rows: $scope.rowsAux,
                            cols: $scope.colsAux,
                            vals: ["Value"],
                            aggregatorName: "Sum",
                            sorters: {
                                Month: $.pivotUtilities.sortAs([
                                    "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
                                    "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
                                ])
                            },
                            rendererName: "Heatmap"
                        });
                }
            };
            // -------------------------------
        }]
    };
});