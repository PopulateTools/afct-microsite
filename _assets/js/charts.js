(function () {
  Chart.defaults.global.tooltips = {
    enabled: false
  }

  Chart.defaults.global.defaultFontFamily = 'Avenir Next';
  Chart.defaults.global.defaultFontSize = 13;

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
          const datasetLabel = chartData.id.match(/^[\d]-[\w]*-[\d]+/)[0]
          const labels = document.querySelector(`[group-label='${datasetLabel}']`)

          if (!labels.innerHTML) {
            let markup = ''
            const especiaisDoCaralho = ["Policy on workers' rights", "Policy on community rights", "Policy on environmental issues"]            
            columnNames.forEach(column => markup += 
              (especiaisDoCaralho.includes(column))
              ? `<div><strong>${column}</strong></div>`
              : `<div><span>${column}</span></div>`)
            labels.innerHTML = markup
          }
        }

        const barThickness = 30
        chart.height = columnNames.length * (barThickness + 12)

        columnNames.forEach((column, i) => {
          if (column.length > 20) {
            columnNames[i] = wrap(column, 20)
          }
        })

        const maxValue = 100
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
                  max: maxValue
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
                anchor: 'end',
                color: (context) => context.dataset.data[context.dataIndex] < 12 ? '#3B5360' : '#fff',
                align: (context) => context.dataset.data[context.dataIndex] < 12 ? 'end' : 'start',
                font: {
                  weight: 'bold'
                },
                clip: true,
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
                  },
                  afterFit: function (scaleInstance) {
                    scaleInstance.width = 200;
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

  const wrap = (str, limit) => {
    const words = str.split(" ");
    let aux = []
    let concat = []

    for (let i = 0; i < words.length; i++) {
      concat.push(words[i])
      let join = concat.join(' ')
      if (join.length > limit) {
        aux.push(join)
        concat = []
      }
    }

    if (concat.length) {
      aux.push(concat.join(' ').trim())
    }

    return aux
  }
})();