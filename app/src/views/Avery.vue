<template>
  <v-container>
    <v-row justify="space-around">
      <v-col cols="12">
        <v-card elevation="4">
          <v-toolbar flat dense color="grey lighten-3">
            <v-toolbar-title class="text-h5">
              Photo Explorer | Avery Brook_Bridge_01171000
            </v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn color="default" text small :to="{ name: 'explorer' }" exact>
              <v-icon left>mdi-chevron-left</v-icon> <span v-if="!$vuetify.breakpoint.mobile">Back to Stations Map</span><span v-else>Back</span>
            </v-btn>
          </v-toolbar>

          <v-card-text class="body-1 black--text" style="position:relative;height:100%;width:100%">
            <v-row>
              <v-col cols="12" class="d-flex justify-end">
                <!-- <div style="align-self:center" class="mr-4 text-body-1">Prediction Type:</div> -->
                <div>
                  <v-btn-toggle v-model="chartType">
                    <v-btn value="RELATIVE">
                      <!-- <v-icon>mdi-format-align-left</v-icon> -->
                      Relative Flow
                    </v-btn>

                    <v-btn value="ABSOLUTE">
                      Absolute Flow
                    </v-btn>
                  </v-btn-toggle>
                </div>
              </v-col>
            </v-row>
            <v-row v-show="chartType === 'RELATIVE'">
              <v-col cols="12">
                <highcharts :options="charts.relativeTimeseries"></highcharts>
              </v-col>
            </v-row>
            <v-row v-show="chartType === 'ABSOLUTE'">
              <v-col cols="12">
                <highcharts :options="charts.absoluteTimeseries"></highcharts>
              </v-col>
            </v-row>
            <v-row justify="center">
              <!-- <v-col cols="5">
                <highcharts :options="charts.fdc"></highcharts>
              </v-col> -->
              <v-col cols="4">
                <v-sheet elevation="2" class="pa-4">
                  <div class="text-h6 mb-4" style="margin-left: 70px">Relative Flow</div>
                  <highcharts :options="charts.splotRelative"></highcharts>
                </v-sheet>
              </v-col>
              <v-col cols="4">
                <v-sheet elevation="2" class="pa-4">
                  <div class="text-h6 mb-4" style="margin-left: 70px">Absolute Flow</div>
                  <highcharts :options="charts.splotAbsolute"></highcharts>
                </v-sheet>
              </v-col>
              <v-col cols="3">
                <v-sheet elevation="2">
                  <v-simple-table>
                    <tbody>
                      <tr>
                        <td class="text-right">Model Version</td>
                        <td class="font-weight-bold">1.3.2</td>
                      </tr>
                      <tr>
                        <td class="text-right">Last Trained</td>
                        <td class="font-weight-bold">May 24, 2023</td>
                      </tr>
                      <tr>
                        <td class="text-right"># Annotations</td>
                        <td class="font-weight-bold">5,000</td>
                      </tr>
                      <tr>
                        <td class="text-right">Kendall Tau</td>
                        <td class="font-weight-bold">0.847</td>
                      </tr>
                      <tr>
                        <td class="text-right">R-squared</td>
                        <td class="font-weight-bold">0.758</td>
                      </tr>
                    </tbody>
                  </v-simple-table>
                </v-sheet>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import * as d3 from 'd3'
export default {
  name: 'Avery',
  data () {
    return {
      flows: [],
      preds: [],
      chartType: 'RELATIVE',
      charts: {
        relativeTimeseries: {
          chart: {
            zoomType: 'x',
            height: 300
          },
          credits: {
            enabled: false
          },
          plotOptions: {
            line: {
              states: {
                inactive: {
                  enabled: false
                },
                hover: {
                  lineWidth: 0,
                  lineWidthPlus: 0,
                  opacity: 1
                }
              }
            }
          },
          title: {
            text: null
          },
          xAxis: {
            type: 'datetime',
            dateTimeLabelFormats: {
              millisecond: '%H:%M:%S.%L',
              second: '%H:%M:%S',
              minute: '%H:%M',
              hour: '%H:%M',
              day: '%b %d, %Y',
              week: '%b %d, %Y',
              month: '%b %Y',
              year: '%Y'
            }
          },
          yAxis: {
            title: {
              text: 'Relative Flow (%)'
            },
            min: 0,
            max: 100
          },
          tooltip: {
            valueDecimals: 2,
            xDateFormat: '%b %d, %Y %l:%M %p'
          },
          legend: {
            layout: 'vertical',
            backgroundColor: '#FFFFFF',
            align: 'right',
            verticalAlign: 'middle',
            itemMarginBottom: 20,
            // floating: true,
            x: 0,
            y: 0
          },
          series: []
        },
        absoluteTimeseries: {
          chart: {
            zoomType: 'x',
            height: 300
          },
          credits: {
            enabled: false
          },
          plotOptions: {
            line: {
              states: {
                inactive: {
                  enabled: false
                },
                hover: {
                  lineWidth: 0,
                  lineWidthPlus: 0,
                  opacity: 1
                }
              }
            }
          },
          title: {
            text: null
          },
          xAxis: {
            type: 'datetime',
            dateTimeLabelFormats: {
              millisecond: '%H:%M:%S.%L',
              second: '%H:%M:%S',
              minute: '%H:%M',
              hour: '%H:%M',
              day: '%b %d, %Y',
              week: '%b %d, %Y',
              month: '%b %Y',
              year: '%Y'
            }
          },
          yAxis: {
            title: {
              text: 'Absolute Flow (cfs)'
            },
            type: 'logarithmic'
          },
          tooltip: {
            valueDecimals: 2,
            xDateFormat: '%b %d, %Y %l:%M %p'
          },
          legend: {
            layout: 'vertical',
            backgroundColor: '#FFFFFF',
            align: 'right',
            verticalAlign: 'middle',
            itemMarginBottom: 20,
            // floating: true,
            x: 0,
            y: 0
          },
          series: []
        },
        fdc: {
          chart: {
            zoomType: 'xy'
          },
          credits: {
            enabled: false
          },
          plotOptions: {
            line: {
              states: {
                inactive: {
                  enabled: false
                }
              }
            }
          },
          title: {
            align: 'left',
            x: 70,
            text: 'Flow Duration Curve'
          },
          yAxis: {
            title: {
              text: 'Flow (cfs)'
            },
            type: 'logarithmic'
          },
          xAxis: {
            title: {
              text: 'Exceedence Probability (%)'
            },
            min: 0,
            max: 100
          },
          tooltip: {
            formatter: function () {
              return 'Exceedance Prob. = <b>' + this.x.toFixed(1) + ' %</b>' + '<br>Flow = <b>' + this.y.toFixed(1) + ' cfs</b>'
            }
          },
          series: [],
          legend: {
            enabled: false
          }
        },
        splotRelative: {
          chart: {
            zoomType: 'xy',
            width: 475,
            height: 450
          },
          credits: {
            enabled: false
          },
          title: {
            text: null
          },
          yAxis: {
            title: {
              text: 'Predicted Relative Flow (%)'
            },
            min: 0,
            max: 100
          },
          xAxis: {
            title: {
              text: 'Observed Relative Flow (%)'
            },
            min: 0,
            max: 100
          },
          tooltip: {
            formatter: function () {
              return 'Observed = <b>' + this.x.toFixed(1) + ' %</b>' + '<br>Predicted = <b>' + this.y.toFixed(1) + ' %</b>'
            }
          },
          series: [],
          legend: {
            enabled: false
          }
        },
        splotAbsolute: {
          chart: {
            zoomType: 'xy',
            width: 475,
            height: 450
          },
          credits: {
            enabled: false
          },
          title: {
            text: null
          },
          yAxis: {
            title: {
              text: 'Predicted Flow (cfs)'
            },
            type: 'logarithmic',
            min: 0.1,
            max: 1000
          },
          xAxis: {
            title: {
              text: 'Observed Flow (cfs)'
            },
            type: 'logarithmic',
            min: 0.1,
            max: 1000
          },
          tooltip: {
            formatter: function () {
              return 'Observed = <b>' + this.x.toFixed(1) + ' cfs</b>' + '<br>Predicted = <b>' + this.y.toFixed(1) + ' cfs</b>'
            }
          },
          series: [],
          legend: {
            enabled: false
          }
        }
      }
    }
  },
  watch: {
    chartType () {
      this.render()
    }
  },
  async mounted () {
    this.flows = await d3.csv('data/avery/flows.csv', (d) => {
      return {
        timestamp: new Date(d.timestamp),
        value: Number(d.value)
      }
    })

    this.preds = await d3.csv('data/avery/predictions_ranking_margin_0.1_randompairs_5000_AVERYBB_augment_normalize_939.csv', (d) => {
      return {
        timestamp: new Date(d.timestamp),
        obs_flow_cfs: Number(d.flow_cfs),
        obs_rank: Number(d.ranked_discharge) * 100,
        pred_rank: Number(d.ranked_pred) * 100,
        score: Number(d.scores),
        split: d.split
      }
    })

    const scale = d3.scaleQuantile()
      .domain(this.preds.map(d => d.obs_flow_cfs))
      .range(d3.range(0, 1.001, 0.001))

    this.flows.forEach(d => {
      d.rank = scale(d.value) * 100
    })

    const predScale = d3.scaleLinear()
      .domain(scale.range())
      .range([scale.quantiles()[0], ...scale.quantiles()])

    this.preds.forEach((d, i) => {
      d.pred_flow_cfs = predScale(d.pred_rank / 100)
    })

    this.render()
  },
  methods: {
    render () {
      this.charts.relativeTimeseries.series = [
        {
          name: 'Observed',
          data: this.flows.map(d => [d.timestamp.valueOf(), d.rank]),
          type: 'line',
          color: '#666',
          lineWidth: 1,
          marker: {
            enabled: false
          },
          tooltip: {
            valueSuffix: '%',
            valueDecimals: 1
          }
        },
        {
          name: 'Predicted',
          data: this.preds.map(d => [d.timestamp.valueOf(), d.pred_rank]),
          type: 'line',
          color: 'orangered',
          lineWidth: 0,
          marker: {
            enabled: true,
            radius: 1,
            symbol: 'circle',
            fillColor: 'orangered'
          },
          tooltip: {
            valueSuffix: '%',
            valueDecimals: 1
          }
        }
      ]
      this.charts.absoluteTimeseries.series = [
        {
          name: 'Observed',
          data: this.flows.map(d => [d.timestamp.valueOf(), d.value]),
          type: 'line',
          color: '#666',
          lineWidth: 1,
          marker: {
            enabled: false
          },
          tooltip: {
            valueSuffix: ' cfs',
            valueDecimals: 1
          }
        },
        {
          name: 'Predicted',
          data: this.preds.map(d => [d.timestamp.valueOf(), d.pred_flow_cfs]),
          type: 'line',
          color: 'orangered',
          lineWidth: 0,
          marker: {
            enabled: true,
            radius: 1,
            symbol: 'circle',
            fillColor: 'orangered'
          },
          tooltip: {
            valueSuffix: ' cfs',
            valueDecimals: 1
          }
        }
      ]
      this.charts.fdc.series = [
        {
          name: 'Observed',
          data: this.preds.map(d => [100 - d.obs_rank, d.obs_flow_cfs]).sort((a, b) => a[0] - b[0]),
          type: 'line',
          color: '#666',
          lineWidth: 2,
          marker: {
            enabled: false
          }
        },
        {
          data: [[0, 0], [100, 100]],
          type: 'line',
          color: 'black',
          lineWidth: 2,
          marker: {
            enabled: false
          }
        }
      ]
      this.charts.splotRelative.series = [
        {
          data: this.preds.map(d => [d.obs_rank, d.pred_rank]),
          type: 'scatter',
          color: '#666',
          lineWidth: 0,
          marker: {
            enabled: true,
            radius: 1
          }
        },
        {
          data: [[0, 0], [100, 100]],
          type: 'line',
          color: 'black',
          lineWidth: 2,
          marker: {
            enabled: false
          }
        }
      ]
      this.charts.splotAbsolute.series = [
        {
          data: this.preds.map(d => [d.obs_flow_cfs, d.pred_flow_cfs]),
          type: 'scatter',
          color: '#666',
          lineWidth: 0,
          marker: {
            enabled: true,
            radius: 1
          }
        },
        {
          data: [[0.1, 0.1], [1000, 1000]],
          type: 'line',
          color: 'black',
          lineWidth: 2,
          marker: {
            enabled: false
          }
        }
      ]
    }
  }
}
</script>
