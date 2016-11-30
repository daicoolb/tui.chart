tui.util.defineNamespace("fedoc.content", {});
fedoc.content["models_bounds_seriesCalculator.js.html"] = "      <div id=\"main\" class=\"main\">\n\n\n\n    \n    <section>\n        <article>\n            <pre class=\"prettyprint source linenums\"><code>/**\n * @fileoverview Calculator for series.\n * @author NHN Ent.\n *         FE Development Lab &lt;dl_javascript@nhnent.com>\n */\n\n'use strict';\n\nvar chartConst = require('../../const');\nvar predicate = require('../../helpers/predicate');\n\n/**\n * Calculator for series.\n * @module seriesCalculator\n */\nvar seriesCalculator = {\n    /**\n     * Calculate width.\n     * @param {{\n     *      chart: {width: number},\n     *      yAxis: {width: number},\n     *      legend: {width: number},\n     *      rightYAxis: ?{width: number}\n     * }} dimensionMap - dimension map\n     * @param {{align: ?string, visible: boolean}} legendOptions - legend options\n     * @returns {number} series width\n     */\n    calculateWidth: function(dimensionMap, legendOptions) {\n        var chartWidth = dimensionMap.chart.width;\n        var yAxisWidth = dimensionMap.yAxis.width;\n        var legendDimension = dimensionMap.legend;\n        var legendWidth, rightAreaWidth;\n\n        if (predicate.isVerticalLegend(legendOptions.align) &amp;&amp; legendOptions.visible) {\n            legendWidth = legendDimension ? legendDimension.width : 0;\n        } else {\n            legendWidth = 0;\n        }\n\n        rightAreaWidth = legendWidth + dimensionMap.rightYAxis.width;\n\n        return chartWidth - (chartConst.CHART_PADDING * 2) - yAxisWidth - rightAreaWidth;\n    },\n\n    /**\n     * Calculate height.\n     * @param {{\n     *      chart: {height: number},\n     *      title: {height: number},\n     *      legend: {height: number},\n     *      xAxis: {height: number}\n     * }} dimensionMap - dimension map\n     * @param {{align: ?string, visible: boolean}} legendOptions - legend options\n     * @returns {number} series height\n     */\n    calculateHeight: function(dimensionMap, legendOptions) {\n        var chartHeight = dimensionMap.chart.height;\n        var titleHeight = dimensionMap.title.height;\n        var legendHeight, bottomAreaWidth;\n\n        if (predicate.isHorizontalLegend(legendOptions.align) &amp;&amp; legendOptions.visible) {\n            legendHeight = dimensionMap.legend.height;\n        } else {\n            legendHeight = 0;\n        }\n\n        bottomAreaWidth = legendHeight + dimensionMap.xAxis.height;\n\n        return chartHeight - (chartConst.CHART_PADDING * 2) - titleHeight - bottomAreaWidth;\n    }\n};\n\nmodule.exports = seriesCalculator;\n</code></pre>\n        </article>\n    </section>\n\n\n\n</div>\n\n"