/**
 * Chart helpers. The calculator renders its charts with Highcharts, so we use the
 * stable `highcharts-<type>-series` classes and (where available) the Highcharts JS API,
 * never positional selectors.
 */
async function getHighchartsPoints(page, seriesType) {
  return page.evaluate((type) => {
    const H = window.Highcharts;
    if (!H || !H.charts) return null;
    const chart = H.charts.filter(Boolean).find((c) => c.series.some((s) => s.type === type));
    if (!chart) return null;
    return chart.series
      .filter((s) => s.type === type)
      .flatMap((s) => s.points.map((p) => ({ series: s.name, name: p.name || String(p.category), y: p.y })));
  }, seriesType);
}

module.exports = { getHighchartsPoints };
