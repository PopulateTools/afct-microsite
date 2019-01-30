(function () {
  Chart.defaults.global.tooltips = {
    enabled: false
  }

  var elem = document.getElementById("hidden-chart-colors");
  var objColors = {}
  if (elem) {
    for (let span of elem.children) {
      objColors[span.className] = window.getComputedStyle(span, null).getPropertyValue("background-color");
    }  
  }

  getJSON("../static_data/datasets.json", (data) => {
    const jsonData = JSON.parse(data);

    const canvas = document.querySelectorAll("canvas")
    canvas.forEach((chart) => {
      const chartData = jsonData.find(set => set.id === chart.id)

      if (chartData) {
        // prepare data
        const columnNames = chartData.data.map(a => a[0])
        const data = chartData.data.map(a => parseFloat(a[1]))

        const isGroupLabel = (chart.dataset.labels === undefined)
        if (isGroupLabel) {
          const datasetLabel = chartData.id.match(/^[\d]-[\w]+/)[0]
          const labels = document.querySelector(`[group-label='${datasetLabel}']`)

          if (!labels.innerHTML) {
            let markup = ''
            columnNames.forEach(column => markup += `<div><span>${column}</span></div>`)
            labels.innerHTML = markup
          }
        }

        const barThickness = 30
        chart.height = columnNames.length * (barThickness + 12)

        const maxValue = Math.max.apply(Math, data) * 1.05
        const inverseData = data.map(e => maxValue - e)

        const defaultColor = objColors[Object.keys(objColors)[Object.keys(objColors).length - 1]]       

        // options
        var opts = {
          type: 'horizontalBar',
          data: {
            labels: columnNames,
            datasets: [{
              data: data,
              backgroundColor: objColors[`color-${chart.className.replace("_", "")}`] || defaultColor
            }, {
              data: inverseData,
              hiddenLabel: true,
            }]
          },
          plugins: [ChartDataLabels],
          options: {
            responsive: true,
            maintainAspectRatio: false,
            legend: {
              display: false,
            },
            scales: {
              xAxes: [{
                stacked: true,
                gridLines: {
                  drawBorder: false,
                  drawTicks: false,
                },
                ticks: {
                  display: false,
                  beginAtZero: true,
                  precision: 0,
                  // max: maxValue
                }
              }],
              yAxes: [{
                barThickness: barThickness,
                stacked: true,
                gridLines: {
                  display: false
                },
                ticks: {
                  display: false
                }
              }]
            },
            plugins: {
              datalabels: {
                color: '#fff',
                anchor: 'end',
                align: 'start',
                font: {
                  weight: 'bold'
                },
                formatter: (value, ctx) => {
                  if (ctx.dataset.hiddenLabel) {
                    return null
                  }

                  return value
                },
              }
            }
          }
        };

        if (!isGroupLabel) {
          opts = {
            ...opts,
            options: {
              ...opts.options,
              scales: {
                ...opts.options.scales,
                yAxes: [{
                  barThickness: barThickness,
                  stacked: true,
                  gridLines: {
                    display: false
                  },
                  ticks: {
                    display: true
                  }
                }]
              }
            }
          }
        }

        new Chart(chart, opts)
      }
    })
  })

  // Helpers
  function getJSON(url, callback) {
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', url, true);
    xobj.onreadystatechange = function () {
      if (xobj.readyState == 4 && xobj.status == "200") {
        // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
        callback(xobj.responseText);
      }
    };
    xobj.send(null);
  }

})();