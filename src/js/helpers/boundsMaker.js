/**
 * @fileoverview Bounds maker.
 * @author NHN Ent.
 *         FE Development Team <dl_javascript@nhnent.com>
 */

'use strict';

var chartConst = require('../const'),
    calculator = require('./calculator'),
    predicate = require('./predicate'),
    renderUtil = require('./renderUtil');

var concat = Array.prototype.concat;

/**
 * Bounds maker.
 * @module boundsMaker
 */
var boundsMaker = {
    /**
     * Get max label of value axis.
     * @memberOf module:boundsMaker
     * @param {string} chartType chart type
     * @returns {number|string} max label
     * @private
     */
    _getValueAxisMaxLabel: function(chartType) {
        var values = predicate.isComboChart(chartType) ? this.dataProcessor.getFullGroupValues() : this.dataProcessor.getGroupValues(chartType),
            formatFunctions = this.dataProcessor.getFormatFunctions(),
            flattenValues = concat.apply([], values),
            min = tui.util.min(flattenValues),
            max = tui.util.max(flattenValues),
            limit = calculator.calculateLimit(min, max),
            minLabel = calculator.normalizeAxisNumber(limit.min),
            maxLabel = calculator.normalizeAxisNumber(limit.max),
            fns = formatFunctions && formatFunctions.slice() || [];
        maxLabel = (minLabel + '').length > (maxLabel + '').length ? minLabel : maxLabel;
        fns.unshift(maxLabel);
        maxLabel = tui.util.reduce(fns, function(stored, fn) {
            return fn(stored);
        });
        return maxLabel;
    },

    /**
     * Get height of x axis area.
     * @memberOf module:boundsMaker
     * @param {object} options x axis options,
     * @param {array.<string>} labels axis labels
     * @param {object} theme axis theme
     * @returns {number} height
     * @private
     */
    _getXAxisHeight: function(options, labels, theme) {
        var title = options && options.title,
            titleAreaHeight = renderUtil.getRenderedLabelHeight(title, theme.title) + chartConst.TITLE_PADDING,
            height = renderUtil.getRenderedLabelsMaxHeight(labels, theme.label) + titleAreaHeight;
        return height;
    },

    /**
     * Get width about y axis.
     * @param {object} options y axis options
     * @param {array.<string>} labels labels
     * @param {object} theme yAxis theme
     * @param {number} index options index
     * @returns {number} y axis width
     * @private
     */
    _getYAxisWidth: function(options, labels, theme, index) {
        var title = '',
            titleAreaWidth, width;

        if (options) {
            options = [].concat(options);
            title = options[index || 0].title;
        }

        titleAreaWidth = renderUtil.getRenderedLabelHeight(title, theme.title) + chartConst.TITLE_PADDING;
        width = renderUtil.getRenderedLabelsMaxWidth(labels, theme.label) + titleAreaWidth + chartConst.AXIS_LABEL_PADDING;

        return width;
    },

    /**
     * Get width about right y axis.
     * @memberOf module:boundsMaker
     * @param {object} params parameters
     *      @param {array.<string>} params.chartTypes y axis chart types
     *      @param {object} params.theme y axis theme
     *      @param {object} params.options y axis options
     * @returns {number} y right axis width
     * @private
     */
    _getRightYAxisWidth: function(params) {
        var chartTypes = params.chartTypes || [],
            len = chartTypes.length,
            width = 0,
            index, chartType, theme, label;

        if (len > 1) {
            index = len - 1;
            chartType = chartTypes[index];
            theme = params.theme[chartType] || params.theme;
            label = this._getValueAxisMaxLabel(chartType);
            width = this._getYAxisWidth(params.options, [label], theme, index);
        }
        return width;
    },

    /**
     * Make axes dimension.
     * @memberOf module:boundsMaker
     * @param {object} params parameters
     *      @param {object} params.theme chart theme
     *      @param {boolean} params.isVertical whether vertical or not
     *      @param {object} params.options chart options
     *      *      @param {object} params.axesLabelInfo axes label info
     * @returns {{
     *      yAxis: {width: number},
     *      rightYAxis: {width: number},
     *      xAxis: {height: number}
     * }} axes dimension
     * @private
     */
    _makeAxesDimension: function(params) {
        var yAxisWidth = 0,
            xAxisHeight = 0,
            rightYAxisWidth = 0,
            axesLabelInfo, chartType;

        // axis 영역이 필요 있는 경우에만 처리
        if (params.hasAxes) {
            axesLabelInfo = params.axesLabelInfo;
            chartType = params.optionChartTypes && params.optionChartTypes[0] || '';
            yAxisWidth = this._getYAxisWidth(params.options.yAxis, axesLabelInfo.yAxis, params.theme.yAxis[chartType] || params.theme.yAxis);
            xAxisHeight = this._getXAxisHeight(params.options.xAxis, axesLabelInfo.xAxis, params.theme.xAxis);
            rightYAxisWidth = this._getRightYAxisWidth({
                chartTypes: params.optionChartTypes,
                theme: params.theme.yAxis,
                options: params.options.yAxis
            });
        }

        return {
            yAxis: {
                width: yAxisWidth
            },
            rightYAxis: {
                width: rightYAxisWidth
            },
            xAxis: {
                height: xAxisHeight
            }
        };
    },

    /**
     * Whether skipped legend sizing or not.
     * @param {string} chartType chart type
     * @param {?object} options legend options
     * @returns {boolean} result boolean
     * @private
     */
    _isSkippedLegendSizing: function(chartType, options) {
        return (predicate.isPieChart(chartType) && predicate.isPieLegendAlign(options.align)) || options.hidden;
    },

    /**
     * Make legend dimension.
     * @memberOf module:boundsMaker
     * @param {object} labelTheme label theme
     * @param {string} chartType chart type
     * @param {object} legendOptions series option
     * @returns {{width: number}} legend dimension
     * @private
     */
    _makeLegendDimension: function(labelTheme, chartType, legendOptions) {
        var legendWidth = 0,
            legendLabels, maxLabelWidth;

        legendOptions = legendOptions || {};

        if (!this._isSkippedLegendSizing(chartType, legendOptions)) {
            legendLabels = tui.util.map(this.dataProcessor.getFullLegendData(), function(item) {
                return item.label;
            });
            maxLabelWidth = renderUtil.getRenderedLabelsMaxWidth(legendLabels, labelTheme);
            legendWidth = maxLabelWidth + chartConst.LEGEND_CHECKBOX_WIDTH + chartConst.LEGEND_RECT_WIDTH +
                chartConst.LEGEND_LABEL_LEFT_PADDING + (chartConst.LEGEND_AREA_PADDING * 2);
        }

        return {
            width: legendWidth
        };
    },

    /**
     * Make series dimension.
     * @memberOf module:boundsMaker
     * @param {object} params parameters
     *      @param {{width: number, height: number}} params.chartDimension chart dimension
     *      @param {{
     *          yAxis: {width: number, height:number},
     *          xAxis: {width: number, height:number},
     *          rightYAxis: {width: number, height:number}
     *      }} params.axesDimension axes dimension
     *      @param {number} params.legendWidth legend width
     *      @param {number} params.titleHeight title height
     * @returns {{width: number, height: number}} series dimension
     * @private
     */
    _makeSeriesDimension: function(params) {
        var axesDimension = params.axesDimension,
            rightAreaWidth = params.legendWidth + axesDimension.rightYAxis.width,
            width = params.chartDimension.width - (chartConst.CHART_PADDING * 2) - axesDimension.yAxis.width - rightAreaWidth,
            height = params.chartDimension.height - (chartConst.CHART_PADDING * 2) - params.titleHeight - axesDimension.xAxis.height;

        return {
            width: width,
            height: height
        };
    },

    /**
     * Make chart dimension.
     * @param {{width: number, height: number}} chartOptions chart options
     * @returns {{width: (number), height: (number)}} chart dimension
     * @private
     */
    _makeChartDimension: function(chartOptions) {
        return {
            width: chartOptions.width || chartConst.CHART_DEFAULT_WIDTH,
            height: chartOptions.height || chartConst.CHART_DEFAULT_HEIGHT
        };
    },

    /**
     * Make title dimension
     * @param {{title: string}} option title option
     * @param {{fontFamily: string, fontSize: number}} theme title theme
     * @returns {{height: number}} title dimension
     * @private
     */
    _makeTitleDimension: function(option, theme) {
        return {
            height: renderUtil.getRenderedLabelHeight(option, theme) + chartConst.TITLE_PADDING
        };
    },

    /**
     * Make plot dimention
     * @param {{width: number, height: number}} seriesDimension series dimension
     * @returns {{width: number, height: number}} plot dimension
     * @private
     */
    _makePlotDimension: function(seriesDimension) {
        return {
            width: seriesDimension.width + chartConst.HIDDEN_WIDTH,
            height: seriesDimension.height + chartConst.HIDDEN_WIDTH
        };
    },

    /**
     * Make components dimensions.
     * @memberOf module:boundsMaker
     * @param {object} params parameters
     *      @param {object} params.theme chart theme
     *      @param {boolean} params.isVertical whether vertical or not
     *      @param {object} params.options chart options
     *      @param {object} params.axesLabelInfo axes label info
     * @returns {Object} components dimensions
     * @private
     */
    _makeComponentsDimensions: function(params) {
        var chartOptions = params.options.chart || {},
            chartDimension = this._makeChartDimension(chartOptions),
            titleDimension = this._makeTitleDimension(chartOptions.title, params.theme.title),
            axesDimension = this._makeAxesDimension(params),
            legendDimension = this._makeLegendDimension(params.theme.legend.label, params.options.chartType, params.options.legend),
            seriesDimension = this._makeSeriesDimension({
                chartDimension: chartDimension,
                axesDimension: axesDimension,
                legendWidth: legendDimension.width,
                titleHeight: titleDimension.height
            });

        return tui.util.extend({
            chart: chartDimension,
            title: titleDimension,
            series: seriesDimension,
            plot: this._makePlotDimension(seriesDimension),
            legend: legendDimension
        }, axesDimension);
    },

    /**
     * Make basic bound.
     * @param {{width: number, height: number}} dimension series dimension.
     * @param {number} top top
     * @param {number} left left
     * @returns {{dimension: {width: number, height: number}, position: {top: number, left: number}}} series bound.
     * @private
     */
    _makeBasicBound: function(dimension, top, left) {
        return {
            dimension: dimension,
            position: {
                top: top,
                left: left
            }
        };
    },

    /**
     * Make yAxis bound.
     * @param {{yAxis: {width: number}, plot: {height: number}}} dimensions dimensions
     * @param {number} top top
     * @returns {{dimension: {width: number, height: (number)}, position: {top: number, left: number}}} yAxis bound
     * @private
     */
    _makeYAxisBound: function(dimensions, top) {
        return {
            dimension: {
                width: dimensions.yAxis.width,
                height: dimensions.plot.height
            },
            position: {
                top: top,
                left: this.chartLeftPadding
            }
        };
    },

    /**
     * Make xAxis bound.
     * @param {{xAxis: {height: number}, plot: {width: number}}} dimensions dimensions
     * @param {number} top top
     * @param {number} left left
     * @param {{degree: number}} rotationInfo rotation info
     * @returns {{dimension: {width: number, height: (number)}, position: {top: number, left: number}}} xAxis bound
     * @private
     */
    _makeXAxisBound: function(dimensions, top, left, rotationInfo) {
        var bound = {
            dimension: {
                width: dimensions.plot.width,
                height: dimensions.xAxis.height
            },
            position: {
                top: top + dimensions.series.height,
                left: left - chartConst.HIDDEN_WIDTH
            }
        };

        if (rotationInfo) {
            bound.degree = rotationInfo.degree;
        }

        return bound;
    },

    /**
     * Make right y axis bound.
     * @param {{rightYAxis: {width: number}, plot: {height: number}, legend: {width: number}}} dimensions dimensions
     * @param {number} top top
     * @returns {{dimension: {width: number, height: (number)}, position: {top: number, left: number}}} rightYAxis bound
     * @private
     */
    _makeRightYAxisBound: function(dimensions, top) {
        return {
            dimension: {
                width: dimensions.rightYAxis.width,
                height: dimensions.plot.height
            },
            position: {
                top: top,
                right: dimensions.legend.width + chartConst.HIDDEN_WIDTH + chartConst.CHART_PADDING
            }
        };
    },

    /**
     * Make axes bounds.
     * @memberOf module:boundsMaker
     * @param {object} params parameters
     *      @param {boolean} params.hasAxes whether has axed or not
     *      @param {array.<string>} params.optionChartTypes y axis chart types
     *      @param {{width: number, height: number}} params.dimension chart dimension
     *      @param {number} params.top top position
     *      @param {number} params.right right position
     *      @param {{degree: number}} params.rotationInfo rotation info
     * @returns {object} axes bounds
     * @private
     */
    _makeAxesBounds: function(params) {
        var bounds;

        // pie차트와 같이 axis 영역이 필요 없는 경우에는 빈 값을 반환 함
        if (!params.hasAxes) {
            return {};
        }

        bounds = {
            plot: this._makeBasicBound(params.dimensions.plot, params.top, params.left - chartConst.HIDDEN_WIDTH),
            yAxis: this._makeYAxisBound(params.dimensions, params.top),
            xAxis: this._makeXAxisBound(params.dimensions, params.top, params.left, params.rotationInfo)
        };

        // 우측 y axis 영역 bounds 정보 추가
        bounds.rightYAxis = this._makeRightYAxisBound(params.dimensions, params.top);
        return bounds;
    },

    /**
     * Make chart bound.
     * @param {{width: number, height: number}} dimension chart dimension.
     * @returns {{dimension: {width: number, height: number}}} chart bound
     * @private
     */
    _makeChartBound: function(dimension) {
        return {
            dimension: dimension
        };
    },

    /**
     * Make legend bound.
     * @param {{title: {height: number}, series: {width: number}, rightYAxis: {width: number}}} dimensions dimensions
     * @param {number} yAxisWidth yAxis width
     * @returns {{position: {top: number, left: number}}} legend bound
     * @private
     */
    _makeLegendBound: function(dimensions) {
        return {
            position: {
                top: dimensions.title.height,
                left: dimensions.yAxis.width + dimensions.series.width + dimensions.rightYAxis.width + this.chartLeftPadding
            }
        };
    },

    /**
     * Make axes label info.
     * @param {object} params parameters
     *      @param {boolean} params.hasAxes whether has axes or not
     *      @param {array} params.optionChartTypes chart types
     *      @param {boolean} isVertical whether vertical or not
     * @returns {{xAxis: array, yAxis: array}} label info
     * @private
     */
    _makeAxesLabelInfo: function(params) {
        var chartType, maxValueLabel, labels, yLabels, xLabels;

        if (!params.hasAxes) {
            return null;
        }

        chartType = params.optionChartTypes && params.optionChartTypes[0] || '';
        // value 중 가장 큰 값을 추출하여 value label로 지정 (lable 너비 체크 시 사용)
        maxValueLabel = this._getValueAxisMaxLabel(chartType);
        labels = this.dataProcessor.getCategories();

        // 세로옵션에 따라서 x축과 y축에 적용할 레이블 정보 지정
        if (params.isVertical) {
            yLabels = [maxValueLabel];
            xLabels = labels;
        } else {
            yLabels = labels;
            xLabels = [maxValueLabel];
        }

        return {
            xAxis: xLabels,
            yAxis: yLabels
        };
    },

    /**
     * Find rotation degree.
     * @param {number} limitWidth limit width
     * @param {number} labelWidth label width
     * @param {number} labelHeight label height
     * @param {number} index candidates index
     * @returns {number} rotation degree
     * @private
     */
    _findRotationDegree: function(limitWidth, labelWidth, labelHeight) {
        var foundDegree,
            halfWidth = labelWidth / 2,
            halfHeight = labelHeight / 2;

        tui.util.forEachArray(chartConst.DEGREE_CANDIDATES, function(degree) {
            var compareWidth = (calculator.calculateAdjacent(degree, halfWidth) + calculator.calculateAdjacent(chartConst.ANGLE_90 - degree, halfHeight)) * 2;
            foundDegree = degree;
            if (compareWidth <= limitWidth + chartConst.XAXIS_LABEL_COMPARE_MARGIN) {
                return false;
            }
        });

        return foundDegree;
    },

    /**
     * Make rotation info about horizontal label.
     * @param {number} limitWidth limit width
     * @param {array.<string>} labels axis labels
     * @param {object} theme axis label theme
     * @returns {?object} rotation info
     * @private
     */
    _makeHorizontalLabelRotationInfo: function(limitWidth, labels, theme) {
        var maxLabelWidth = renderUtil.getRenderedLabelsMaxWidth(labels, theme),
            degree, labelHeight;

        if (maxLabelWidth <= limitWidth) {
            return null;
        }

        labelHeight = renderUtil.getRenderedLabelsMaxHeight(labels, theme);
        degree = this._findRotationDegree(limitWidth, maxLabelWidth, labelHeight);

        return {
            maxLabelWidth: maxLabelWidth,
            labelHeight: labelHeight,
            degree: degree
        };
    },

    /**
     * Calculate overflow position left.
     * @param {number} yAxisWidth yAxis width
     * @param {{degree: number, labelHeight: number}} rotationInfo rotation info
     * @param {string} firstLabel firstLabel
     * @param {obejct} theme label theme
     * @returns {number} overflow position left
     * @private
     */
    _calculateOverflowLeft: function(yAxisWidth, rotationInfo, firstLabel, theme) {
        var degree = rotationInfo.degree,
            labelHeight = rotationInfo.labelHeight,
            firstLabelWidth = renderUtil.getRenderedLabelWidth(firstLabel, theme),
            newLabelWidth = (calculator.calculateAdjacent(degree, firstLabelWidth / 2) + calculator.calculateAdjacent(chartConst.ANGLE_90 - degree, labelHeight / 2)) * 2,
            diffLeft = newLabelWidth - yAxisWidth;
        return diffLeft;
    },

    /**
     * Calculate rotated height of xAxis.
     * @param {{degree: number, maxLabelWidth: number, labelHeight: number}} rotationInfo rotation info
     * @returns {number} xAxis height
     * @private
     */
    _calculateXAxisRotatedHeight: function(rotationInfo) {
        var degree = rotationInfo.degree,
            maxLabelWidth = rotationInfo.maxLabelWidth,
            labelHeight = rotationInfo.labelHeight,
            axisHeight = (calculator.calculateOpposite(degree, maxLabelWidth / 2) + calculator.calculateOpposite(chartConst.ANGLE_90 - degree, labelHeight / 2)) * 2;
        return axisHeight;
    },

    /**
     * Calculate height difference between origin category and rotation category.
     * @param {{degree: number, maxLabelWidth: number, labelHeight: number}} rotationInfo rotation info
     * @returns {number} height difference
     * @private
     */
    _calculateDiffWithRotatedHeight: function(rotationInfo) {
        var rotatedHeight = this._calculateXAxisRotatedHeight(rotationInfo);
        return rotatedHeight - rotationInfo.labelHeight;
    },

    /**
     * Update degree of rotationInfo.
     * @param {number} seriesWidth series width
     * @param {{degree: number, maxLabelWidth: number, labelHeight: number}} rotationInfo rotation info
     * @param {number} labelLength labelLength
     * @param {number} overflowLeft overflow left
     * @private
     */
    _updateDegree: function(seriesWidth, rotationInfo, labelLength, overflowLeft) {
        var limitWidth, newDegree;
        if (overflowLeft > 0) {
            limitWidth = seriesWidth / labelLength + chartConst.XAXIS_LABEL_GUTTER;
            newDegree = this._findRotationDegree(limitWidth, rotationInfo.maxLabelWidth, rotationInfo.labelHeight);
            rotationInfo.degree = newDegree;
        }
    },

    /**
     * Update width of dimensions.
     * @param {{plot: {width: number}, series: {width: number}, xAxis: {width: number}}} dimensions dimensions
     * @param {number} overflowLeft overflow left
     * @private
     */
    _updateDimensionsWidth: function(dimensions, overflowLeft) {
        if (overflowLeft > 0) {
            this.chartLeftPadding += overflowLeft;
            dimensions.plot.width -= overflowLeft;
            dimensions.series.width -= overflowLeft;
            dimensions.xAxis.width -= overflowLeft;
        }
    },

    /**
     * Update height of dimensions.
     * @param {{plot: {height: number}, series: {height: number}, xAxis: {height: number}}} dimensions dimensions
     * @param {number} diffHeight diff height
     * @private
     */
    _updateDimensionsHeight: function(dimensions, diffHeight) {
        dimensions.plot.height -= diffHeight;
        dimensions.series.height -= diffHeight;
        dimensions.xAxis.height += diffHeight;
    },

    /**
     * Calculate height difference between origin category and multiline category.
     * @param {array.<string>} labels labels
     * @param {{fontSize: number, fontFamily: string}} theme axis label theme
     * @param {number} limitWidth limit width
     * @returns {number} calculated height
     * @private
     */
    _calculateDiffWithMultilineHeight: function(labels, theme, limitWidth) {
        var multilineLabels = this.dataProcessor.getMultilineCategories(limitWidth, theme),
            normalHeight = renderUtil.getRenderedLabelsMaxHeight(labels, theme),
            multilineHeight = renderUtil.getRenderedLabelsMaxHeight(multilineLabels, tui.util.extend({
                cssText: 'line-height:1.2;width:' + limitWidth + 'px'
            }, theme));

        return multilineHeight - normalHeight;
    },

    /**
     * Update dimensions and degree.
     * @param {{plot: {width: number, height: number}, series: {width: number, height: number}, xAxis: {width: number, height: number}}} dimensions dimensions
     * @param {{degree: number, maxLabelWidth: number, labelHeight: number}} rotationInfo rotation info
     * @param {array} labels labels
     * @param {object} theme theme
     * @param {number} limitWidth limit width
     * @private
     */
    _updateDimensionsAndDegree: function(dimensions, rotationInfo, labels, theme, limitWidth) {
        var overflowLeft, diffHeight;
        if (rotationInfo) {
            overflowLeft = this._calculateOverflowLeft(dimensions.yAxis.width, rotationInfo, labels[0], theme);
            this._updateDimensionsWidth(dimensions, overflowLeft);
            this._updateDegree(dimensions.series.width, rotationInfo, labels.length, overflowLeft);
            diffHeight = this._calculateDiffWithRotatedHeight(rotationInfo);
        } else {
            diffHeight = this._calculateDiffWithMultilineHeight(labels, theme, limitWidth);
        }
        this._updateDimensionsHeight(dimensions, diffHeight);
    },

    _makeLimitXAxisLabelWidth: function(seriesWidth, labelCount) {
        return seriesWidth / (labelCount - 1);
    },

    /**
     * Make bounds about chart components.
     * @memberOf module:boundsMaker
     * @param {object} dataProcessor data processor
     * @param {object} params parameters
     *      @param {object} params.theme chart theme
     *      @param {boolean} params.isVertical whether vertical or not
     *      @param {object} params.options chart options
     *      @param {boolean} params.hasAxes whether has axes area or not
     *      @param {array} params.optionChartTypes y axis option chart types
     * @returns {{
     *   plot: {
     *     dimension: {width: number, height: number},
     *     position: {top: number, right: number}
     *   },
     *   yAxis: {
     *     dimension: {width: (number), height: number},
     *     position: {top: number}
     *   },
     *   xAxis: {
     *     dimension: {width: number, height: (number)},
     *     position: {right: number}
     *   },
     *   series: {
     *     dimension: {width: number, height: number},
     *     position: {top: number, right: number}
     *   },
     *   legend: {
     *     position: {top: number}
     *   },
     *   tooltip: {
     *     dimension: {width: number, height: number},
     *     position: {top: number, left: number}
     *   }
     * }} bounds
     */
    make: function(dataProcessor, params) {
        var axesLabelInfo, dimensions, xAxisOptions, limitWidth,
            rotationInfo, top, left, seriesBound, axesBounds, bounds;

        this.dataProcessor = dataProcessor;

        axesLabelInfo = this._makeAxesLabelInfo(params);
        dimensions = this._makeComponentsDimensions(tui.util.extend({
            axesLabelInfo: axesLabelInfo
        }, params));
        xAxisOptions = params.options.xAxis || {};

        this.chartLeftPadding = chartConst.CHART_PADDING;
        if (params.hasAxes) {
            limitWidth = this._makeLimitXAxisLabelWidth(dimensions.series.width, axesLabelInfo.xAxis.length);
            if (xAxisOptions.rotation !== false) {
                rotationInfo = this._makeHorizontalLabelRotationInfo(limitWidth, axesLabelInfo.xAxis, params.theme.xAxis.label);
            }
            this._updateDimensionsAndDegree(dimensions, rotationInfo, axesLabelInfo.xAxis, params.theme.xAxis.label, limitWidth);
        }

        top = dimensions.title.height + chartConst.CHART_PADDING;
        left = dimensions.yAxis.width + this.chartLeftPadding;
        seriesBound = this._makeBasicBound(dimensions.series, top, left);

        axesBounds = this._makeAxesBounds({
            hasAxes: params.hasAxes,
            rotationInfo: rotationInfo,
            optionChartTypes: params.optionChartTypes,
            dimensions: dimensions,
            top: top,
            left: left
        });

        bounds = tui.util.extend({
            chart: this._makeChartBound(dimensions.chart),
            series: seriesBound,
            legend: this._makeLegendBound(dimensions),
            tooltip: this._makeBasicBound(dimensions.series, top, left - chartConst.SERIES_EXPAND_SIZE),
            customEvent: seriesBound
        }, axesBounds);

        return bounds;
    }
};

module.exports = boundsMaker;