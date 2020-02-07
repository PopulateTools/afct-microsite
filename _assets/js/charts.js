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

  // Summary table
  const DEBUG = (location.origin === "http://0.0.0.0:4000") || false
  const reportsUrl = DEBUG ? "../static_data/mock_reports.json" : "https://act-export.frankbold.org/reports.json";
  const activeClass = "active";
  const maxValue = 100;
  const mainColor = getComputedStyle(document.documentElement).getPropertyValue(
    "--green"
  );
  const filters = {
    country: null,
    sector: null,
    revenues: null
  };

  renderSummaryTable()

  const charts = document.querySelectorAll("[data-path]");

  getJSON(reportsUrl, data => {
    // render charts
    renderCharts(charts, JSON.parse(data));
  });

  function renderSummaryTable() {
    const summaryTable = document.querySelector("[data-summary-table]")

    let template = "";
    template += getFiltersHTML()
    template += getTabLinksHTML()
    template += getTabContentHTML()

    summaryTable.innerHTML = template

    const rowTypes = summaryTable.querySelectorAll("[data-row-type]");
    rowTypes.forEach(element => {
      if (element.dataset.rowType !== "policies") {
        element.style.display = "none";
      }
    });
  
    const tableSelectors = summaryTable.querySelectorAll("[data-table-selector]");
    tableSelectors.forEach((element, index) => {
      if (index === 0) {
        element.classList.add(activeClass);
      }
  
      return element.addEventListener("click", event => {
        const { target } = event;
        const selectedRowType = target.dataset.tableSelector;
  
        tableSelectors.forEach(e => e.classList.remove(activeClass));
        target.classList.add(activeClass);
  
        rowTypes.forEach(element => {
          if (element.dataset.rowType === selectedRowType) {
            element.style.display = "";
  
            const charts = element.querySelectorAll("[data-path]");
            if (charts.length) {
              renderCharts(charts, data, dictionary);
            }
          } else {
            element.style.display = "none";
          }
        });
      });
    });
  }

  function getFiltersHTML() {
    return `
      <div class="database-layout__flex">
        <h4 class="database-heading__h4">Summary - Compliance</h4>
        ${getFiltersBlock()}
      </div>
    `;
  }

  function getFiltersBlock() {
    return `
      <div class="database-layout__col-3 gutter-xl">
        <div>
          <select data-filter="sector" id="filter-sector">
          </select>
        </div>
        <div>
          <select data-filter="revenues" id="filter-revenues">
          </select>
        </div>
        <div>
          <select data-filter="country" id="filter-country">
          </select>
        </div>
      </div>
    `
  }

  function getTabLinksHTML() {
    const tabs = [
      {
        selector: "policies",
        label: "Policies & Procedures"
      },
      {
        selector: "risks",
        label: "Risks management"
      },
      {
        selector: "outcomes",
        label: "Outcomes"
      }
    ];

    const template = t =>
      `<div><button class="database-tablinks" data-table-selector="${t.selector}">${t.label}</button></div>`;

    return `
      <div class="database-tabs database-layout__col-3 gutter-l">
        ${tabs.map(t => template(t)).join("")}
      </div>
    `;
  }

  function getTabContentHTML() {
    return `
      <ul class="database-tabcontent__table">
        <li class="database-tabcontent__row">
          <div class="database-tabcontent__captions-light"> 
            <p>% Percentage of total</p>
          </div>
          <div class="database-tabcontent__captions database-layout__col-3 gutter-xl" data-row-type="policies">
            <div>No information provided</div>
            <div>Policy is described or referenced</div>
            <div>Policy description specifies key issues and objectives</div>
          </div>
          <div class="database-tabcontent__captions database-layout__col-3 gutter-xl" data-row-type="risks">
            <div>No risks identification</div>
            <div>Vague risks identification</div>
            <div>Description of specific risk</div>
          </div>
          <div class="database-tabcontent__captions database-layout__col-3 gutter-xl" data-row-type="outcomes">
            <div>No description</div>
            <div>Description provided</div>
            <div>Outcomes in terms of meeting policy targets</div>
          </div>
        </li>
        <li class="database-tabcontent__row">
          <div class="database-tabcontent__heading"> 
            <p><span>A</span> Enviroment</p>
          </div>
          <div>
            <div></div>
            <div></div>
            <div></div>
          </div>
        </li>
        <li class="database-tabcontent__row">
          <div class="database-tabcontent__label">
            <p><span>A.1</span> Climate change</p>
            <p><span>A.2</span> Use of natural resources</p>
            <p><span>A.3</span> Polluting discharges</p>
            <p><span>A.4</span> Waste</p>
            <p><span>A.5</span> Biodiversity and ecosystem conservation</p>
          </div>
          <div class="database-layout__col-3 gutter-xl" data-row-type="policies">
            <div><canvas data-path="policies.policy" data-type="summary" data-parent="s_A" data-option="1"></canvas></div>
            <div><canvas data-path="policies.policy" data-type="summary" data-parent="s_A" data-option="2"></canvas></div>
            <div><canvas data-path="policies.policy" data-type="summary" data-parent="s_A" data-option="3"></canvas></div>
          </div>
          <div class="database-layout__col-3 gutter-xl" data-row-type="risks">
            <div><canvas data-path="risks.risk" data-type="summary" data-parent="s_A" data-option="1"></canvas></div>
            <div><canvas data-path="risks.risk" data-type="summary" data-parent="s_A" data-option="2"></canvas></div>
            <div><canvas data-path="risks.risk" data-type="summary" data-parent="s_A" data-option="3"></canvas></div>
          </div>
          <div class="database-layout__col-3 gutter-xl" data-row-type="outcomes">
            <div><canvas data-path="outcomes.outcomes" data-type="summary" data-parent="s_A" data-option="1"></canvas></div>
            <div><canvas data-path="outcomes.outcomes" data-type="summary" data-parent="s_A" data-option="2"></canvas></div>
            <div><canvas data-path="outcomes.outcomes" data-type="summary" data-parent="s_A" data-option="3"></canvas></div>
          </div>
        </li>
        <li class="database-tabcontent__row">
          <div class="database-tabcontent__heading"> 
            <p><span>B</span> Employee and social matters</p>
          </div>
          <div>
            <div></div>
            <div></div>
            <div></div>
          </div>
        </li>
        <li class="database-tabcontent__row">
          <div class="database-tabcontent__label">
            <p><span>B.1</span> Employee and workforce matters</p>
            <p>&nbsp;</p>
          </div>
          <div class="database-layout__col-3 gutter-xl" data-row-type="policies">
            <div><canvas data-path="policies.policy" data-type="summary" data-parent="s_B" data-option="1"></canvas></div>
            <div><canvas data-path="policies.policy" data-type="summary" data-parent="s_B" data-option="2"></canvas></div>
            <div><canvas data-path="policies.policy" data-type="summary" data-parent="s_B" data-option="3"></canvas></div>
          </div>
          <div class="database-layout__col-3 gutter-xl" data-row-type="risks">
            <div><canvas data-path="risks.risk" data-type="summary" data-parent="s_B" data-option="1"></canvas></div>
            <div><canvas data-path="risks.risk" data-type="summary" data-parent="s_B" data-option="2"></canvas></div>
            <div><canvas data-path="risks.risk" data-type="summary" data-parent="s_B" data-option="3"></canvas></div>
          </div>
          <div class="database-layout__col-3 gutter-xl" data-row-type="outcomes">
            <div><canvas data-path="outcomes.outcomes" data-type="summary" data-parent="s_B" data-option="1"></canvas></div>
            <div><canvas data-path="outcomes.outcomes" data-type="summary" data-parent="s_B" data-option="2"></canvas></div>
            <div><canvas data-path="outcomes.outcomes" data-type="summary" data-parent="s_B" data-option="3"></canvas></div>
          </div>
        </li>
        <li class="database-tabcontent__row">
          <div class="database-tabcontent__heading"> 
            <p><span>C</span> Human Rights</p>
          </div>
          <div>
            <div></div>
            <div></div>
            <div></div>
          </div>
        </li>
        <li class="database-tabcontent__row">
          <div class="database-tabcontent__label">
            <p><span>C.1</span> General Human Rights Reporting Criteria</p>
            <p><span>C.2</span> Supply Chains Management</p>
            <p><span>C.3</span> Impacts on indigenous and/or local communities rights</p>
            <p><span>C.4</span> Hight risk areas for Civil & Political rights</p>
            <p><span>C.5</span> Conflict resources (minerals, timber, etc.)</p>
            <p><span>C.6</span> Data protection / Digital rights</p>
          </div>
          <div class="database-layout__col-3 gutter-xl" data-row-type="policies">
            <div><canvas data-path="policies.policy" data-type="summary" data-parent="s_C" data-option="1"></canvas></div>
            <div><canvas data-path="policies.policy" data-type="summary" data-parent="s_C" data-option="2"></canvas></div>
            <div><canvas data-path="policies.policy" data-type="summary" data-parent="s_C" data-option="3"></canvas></div>
          </div>
          <div class="database-layout__col-3 gutter-xl" data-row-type="risks">
            <div><canvas data-path="risks.risk" data-type="summary" data-parent="s_C" data-option="1"></canvas></div>
            <div><canvas data-path="risks.risk" data-type="summary" data-parent="s_C" data-option="2"></canvas></div>
            <div><canvas data-path="risks.risk" data-type="summary" data-parent="s_C" data-option="3"></canvas></div>
          </div>
          <div class="database-layout__col-3 gutter-xl" data-row-type="outcomes">
            <div><canvas data-path="outcomes.outcomes" data-type="summary" data-parent="s_C" data-option="1"></canvas></div>
            <div><canvas data-path="outcomes.outcomes" data-type="summary" data-parent="s_C" data-option="2"></canvas></div>
            <div><canvas data-path="outcomes.outcomes" data-type="summary" data-parent="s_C" data-option="3"></canvas></div>
          </div>
        </li>
        <li class="database-tabcontent__row">
          <div class="database-tabcontent__heading"> 
            <p><span>D</span> Anti-corruption & Whistleblowing</p>
          </div>
          <div>
            <div></div>
            <div></div>
            <div></div>
          </div>
        </li>
        <li class="database-tabcontent__row">
          <div class="database-tabcontent__label">
            <p><span>D.1</span> Anti-corruption</p>
            <p><span>D.2</span> Whistleblowing channel</p>
          </div>
          <div class="database-layout__col-3 gutter-xl" data-row-type="policies">
            <div><canvas data-path="policies.policy" data-type="summary" data-parent="s_D" data-option="1"></canvas></div>
            <div><canvas data-path="policies.policy" data-type="summary" data-parent="s_D" data-option="2"></canvas></div>
            <div><canvas data-path="policies.policy" data-type="summary" data-parent="s_D" data-option="3"></canvas></div>
          </div>
          <div class="database-layout__col-3 gutter-xl" data-row-type="risks">
            <div><canvas data-path="risks.risk" data-type="summary" data-parent="s_D" data-option="1"></canvas></div>
            <div><canvas data-path="risks.risk" data-type="summary" data-parent="s_D" data-option="2"></canvas></div>
            <div><canvas data-path="risks.risk" data-type="summary" data-parent="s_D" data-option="3"></canvas></div>
          </div>
          <div class="database-layout__col-3 gutter-xl" data-row-type="outcomes">
            <div><canvas data-path="outcomes.outcomes" data-type="summary" data-parent="s_D" data-option="1"></canvas></div>
            <div><canvas data-path="outcomes.outcomes" data-type="summary" data-parent="s_D" data-option="2"></canvas></div>
            <div><canvas data-path="outcomes.outcomes" data-type="summary" data-parent="s_D" data-option="3"></canvas></div>
          </div>
        </li>
      </ul>
    `;
  }

  function renderCharts(charts, data) {
    charts.forEach(element => onChartLoad(element, data));
  }

  function onChartLoad(element, data, dictionary, options) {
    // Get summarized data for chart and render it
    // if (element.dataset.type === "summary") {
      return loadSummaryChart(
        element,
        summaryChartData(
          data,
          element.dataset.path,
          element.dataset.parent,
          element.dataset.option
        ),
        options
      );
    // } else {
    //   return loadHorizontalChart(
    //     element,
    //     summarizeDataFromPath(
    //       filterData(data),
    //       element.dataset.path,
    //       element.dataset.dictionary,
    //       dictionary
    //     ),
    //     options
    //   );
    // }
  }

  function summaryChartData(data, path, parent, option, dictionary) {
    let result = {};
    let total = {};

    filterData(data).forEach(company => {
      Object.keys(company[parent]).forEach(question => {
        let value = resolve(company[parent][question], path);
        // This is a dirty hack, but necessary
        // Sometimes the path of a question has the suffix 2 or 3
        // Example: policies.policy, policies.policy2 and policies.policy3
        if (value === undefined || value === null) {
          value = resolve(company[parent][question], path + "2");
        }
        if (value === undefined || value === null) {
          value = resolve(company[parent][question], path + "3");
        }
        if (result[question] === undefined) {
          result[question] = 0;
        }
        if (total[question] === undefined) {
          total[question] = 0;
        }
        if (String(value) === String(option)) {
          result[question]++;
        }
        // Only count the total if the value is present
        if (value !== undefined && value !== null) {
          total[question]++;
        }
      });
    });

    return {
      data: calculatePercentage(result, total, dictionary)
    };
  }

  function loadSummaryChart(idOrElement, chartData, options = {}) {
    let chart;
    if (isString(idOrElement)) {
      chart = document.getElementById(idOrElement);
    } else {
      chart = idOrElement;
    }

    const columnNames = chartData.data.map(a => a[0].slice(3));
    const data = chartData.data.map(a => parseFloat(a[1]));
    const inverseData = data.map(e => maxValue - e + 0.1);

    let barThickness = options.barThickness || 30;
    chart.height = columnNames.length * (barThickness + 6);

    let opts = {
      type: "horizontalBar",
      data: {
        labels: columnNames,
        datasets: [
          {
            data: data,
            backgroundColor: mainColor,
            barThickness: barThickness,
            maxBarThickness: barThickness
          },
          {
            data: inverseData,
            hiddenLabel: true,
            barThickness: barThickness,
            maxBarThickness: barThickness
          }
        ]
      },
      plugins: [ChartDataLabels],
      options: {
        responsive: false,
        maintainAspectRatio: false,
        legend: {
          display: false
        },
        layout: {
          padding: {
            left: -10,
            right: 0,
            top: 0,
            bottom: 0
          }
        },
        scales: {
          xAxes: [
            {
              stacked: true,
              gridLines: {
                drawBorder: false,
                drawTicks: false
              },
              ticks: {
                display: false,
                beginAtZero: false,
                precision: 0,
                max: maxValue
              }
            }
          ],
          yAxes: [
            {
              stacked: true,
              gridLines: {
                display: false
              },
              ticks: {
                display: false
              }
            }
          ]
        },
        plugins: {
          datalabels: {
            anchor: "end",
            offset: context =>
              context.dataset.data[context.dataIndex] < 40 ? 0 : 10,
            color: context =>
              context.dataset.data[context.dataIndex] < 40 ? "#3B5360" : "#fff",
            align: context =>
              context.dataset.data[context.dataIndex] < 40 ? "end" : "start",
            font: {
              weight: "bold"
            },
            clip: true,
            formatter: (value, ctx) => {
              if (ctx.dataset.hiddenLabel) {
                return null;
              } else {
                return value;
              }
            }
          }
        }
      }
    };

    new Chart(chart, opts);
  }

  function filterData(data) {
    let filteredCompanies = [];
    data.forEach(company => {
      if (filters !== undefined) {
        if (
          filters.country !== null &&
          company.company.country_incorporation !== filters.country
        ) {
          return;
        }
        if (
          filters.sector !== null &&
          company.company.sectors !== undefined &&
          company.company.sectors.indexOf(filters.sector) === -1
        ) {
          return;
        }
        if (
          filters.revenues !== null &&
          company.company.revenues !== undefined
        ) {
          let revenues = parseFloat(company.company.revenues.replace(/,/g, ""));
          let range = filters.revenues.split("-").map(d => parseFloat(d));
          if (!(revenues >= range[0] && revenues <= range[1])) {
            return;
          }
        }
        filteredCompanies.push(company);
      } else {
        filteredCompanies.push(company);
      }
    });
    return filteredCompanies;
  }

  function resolve(obj, path) {
    const properties = Array.isArray(path) ? path : path.split(".");

    return properties.reduce((prev, curr) => {
      return prev && prev[curr];
    }, obj);
  }

  function calculatePercentage(
    data,
    total,
    dictionaryKey,
    dictionary,
    options = {}
  ) {
    let result = Object.keys(data).map(key => {
      let keyTxt = key;
      if (
        dictionaryKey !== undefined &&
        dictionary[dictionaryKey] !== undefined &&
        dictionary[dictionaryKey][key] !== undefined
      ) {
        keyTxt = String(dictionary[dictionaryKey][key]);
      }
      if (keyTxt === null || keyTxt === "null") {
        keyTxt = "no value";
      }
      return [
        keyTxt,
        percentage(data[key], isObject(total) ? total[key] : total)
      ];
    });
    if (options.sort) {
      result = result.sort((b, a) => a[1] - b[1]);
    }

    return result;
  }

  function percentage(value, total) {
    if (value === undefined || value === null) {
      return 0;
    }
    return ((value / total) * 100).toFixed(1);
  }

  function isObject(value) {
    return value && typeof value === "object" && value.constructor === Object;
  }

  function isString(x) {
    return Object.prototype.toString.call(x) === "[object String]";
  }

})();