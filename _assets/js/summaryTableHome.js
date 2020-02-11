(function () {
  // Summary table
  const DEBUG = (location.origin === "http://0.0.0.0:4000") || false
  const reportsUrl = DEBUG ? "../static_data/mock_reports.json" : "https://act-export.frankbold.org/reports.json";
  const activeClass = "active";
  const maxValue = 100;
  const countriesPath = "company.country_incorporation";
  const sectorsPath = "company.sectors";
  const revenueRange0 = 3e8;
  const revenueRange1 = 1e9;
  const revenueRange2 = 3e9;
  const revenueRange3 = 2e10;
  const mainColor = getComputedStyle(document.documentElement).getPropertyValue(
    "--green"
  );
  const { country = null, sector = null, revenues = null } = JSON.parse(localStorage.getItem('filters'))
  const filters = {
    country,
    sector,
    revenues
  };

  // Store it in a global var, instead of passing through functions
  let GLOBAL_TREE = null;

  renderSummaryTable()

  const charts = document.querySelectorAll("[data-path]");

  getJSON(reportsUrl, data => {
    GLOBAL_TREE = getTree(data)
    
    // render charts
    renderCharts(charts, data);

    const summaryTable = document.querySelector("[data-summary-table]")
    const tableSelectors = summaryTable.querySelectorAll("[data-table-selector]");
    const rowTypes = summaryTable.querySelectorAll("[data-row-type]");

    fillCountriesFilter(data);
    fillSectorsFilter(data);
    fillRevenuesFilter(data);

    // Assign behaviour to filters
    summaryTable.querySelectorAll("[data-filter]").forEach(element => {
      return element.addEventListener("input", event => {
        onFilterSelected(event, () => {
            const charts = summaryTable.querySelectorAll("[data-path]");
            if (charts.length) {
              renderCharts(charts, data);
            }
        });
      });
    });

    tableSelectors.forEach((element, index) => {
      if (index === 0) {
        element.classList.add(activeClass);
      }
  
      element.addEventListener("click", event => {
        const { target } = event;
        const selectedRowType = target.dataset.tableSelector;
  
        tableSelectors.forEach(e => e.classList.remove(activeClass));
        target.classList.add(activeClass);
  
        rowTypes.forEach(element => {
          if (element.dataset.rowType === selectedRowType) {
            element.style.display = "";

            const charts = element.querySelectorAll("[data-path]");
            if (charts.length) {
              renderCharts(charts, data);
            }
          } else {
            element.style.display = "none";
          }
        });
      });
    });
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
      <ul class="database-tabcontent__table database-canvas__fit">
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
            <div><canvas data-path="outcomes_wrapper.outcomes" data-type="summary" data-parent="s_A" data-option="1"></canvas></div>
            <div><canvas data-path="outcomes_wrapper.outcomes" data-type="summary" data-parent="s_A" data-option="2"></canvas></div>
            <div><canvas data-path="outcomes_wrapper.outcomes" data-type="summary" data-parent="s_A" data-option="3"></canvas></div>
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
            <div><canvas data-path="outcomes_wrapper.outcomes" data-type="summary" data-parent="s_B" data-option="1"></canvas></div>
            <div><canvas data-path="outcomes_wrapper.outcomes" data-type="summary" data-parent="s_B" data-option="2"></canvas></div>
            <div><canvas data-path="outcomes_wrapper.outcomes" data-type="summary" data-parent="s_B" data-option="3"></canvas></div>
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
            <div><canvas data-path="outcomes_wrapper.outcomes" data-type="summary" data-parent="s_C" data-option="1"></canvas></div>
            <div><canvas data-path="outcomes_wrapper.outcomes" data-type="summary" data-parent="s_C" data-option="2"></canvas></div>
            <div><canvas data-path="outcomes_wrapper.outcomes" data-type="summary" data-parent="s_C" data-option="3"></canvas></div>
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
            <div><canvas data-path="outcomes_wrapper.outcomes" data-type="summary" data-parent="s_D" data-option="1"></canvas></div>
            <div><canvas data-path="outcomes_wrapper.outcomes" data-type="summary" data-parent="s_D" data-option="2"></canvas></div>
            <div><canvas data-path="outcomes_wrapper.outcomes" data-type="summary" data-parent="s_D" data-option="3"></canvas></div>
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
      Object.keys(GLOBAL_TREE[parent]).forEach(question => {
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
        total[question]++;
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

  function fillCountriesFilter(data) {
    let element = document.getElementById("filter-country");
    const option = document.createElement("option");
    option.text = "Select a country";
    option.value = "";
    element.appendChild(option);

    const storedFilters = localStorage.getItem('filters-home')
    if (storedFilters) {
      const { country } = JSON.parse(storedFilters)
      filters.country = country
    }

    getCountries(data).forEach(country => {
      const option = document.createElement("option");
      option.text = country;
      option.value = country;

      if (country === filters.country) {
        option.selected = true
      }

      element.appendChild(option);
    });
  }

  function fillSectorsFilter(data) {
    let element = document.getElementById("filter-sector");
    const option = document.createElement("option");
    option.text = "Select a sector";
    option.value = "";
    element.appendChild(option);

    const storedFilters = localStorage.getItem('filters-home')
    if (storedFilters) {
      const { sector } = JSON.parse(storedFilters)
      filters.sector = sector
    }

    getSectors(data).forEach(sector => {
      const option = document.createElement("option");
      option.text = sector;
      option.value = sector;

      if (sector === filters.sector) {
        option.selected = true
      }

      element.appendChild(option);
    });
  }

  function fillRevenuesFilter() {
    let element = document.getElementById("filter-revenues");
    const option = document.createElement("option");
    option.text = "Select a revenue range";
    option.value = "";
    element.appendChild(option);

    const storedFilters = localStorage.getItem('filters-home')
    if (storedFilters) {
      const { revenues } = JSON.parse(storedFilters)
      filters.revenues = revenues
    }

    getRevenuesFilters().forEach(range => {
      const option = document.createElement("option");
      option.text = range[0];
      option.value = range[1];

      if (range[1] === filters.revenues) {
        option.selected = true
      }

      element.appendChild(option);
    });
  }

  function getCountries(data) {
    return unique(data.map(d => resolve(d, countriesPath))).sort();
  }

  function getSectors(data) {
    return unique(flatten(data.map(d => resolve(d, sectorsPath)))).sort();
  }

  function unique(array) {
    return [...new Set(array)];
  }

  function flatten(arr) {
    return arr.reduce((flat, toFlatten) => {
      return flat.concat(
        Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten
      );
    }, []);
  }

  function getRevenuesFilters() {
    return [
      [
        `< ${parseMoney(revenueRange0, true, true)}`,
        [0, revenueRange0].join("-")
      ],
      [
        `${parseMoney(revenueRange0, true, false)} - ${parseMoney(
          revenueRange1,
          false,
          true
        )}`,
        [revenueRange0, revenueRange1].join("-")
      ],
      [
        `${parseMoney(revenueRange1, true, false)} - ${parseMoney(
          revenueRange2,
          false,
          true
        )}`,
        [revenueRange1, revenueRange2].join("-")
      ],
      [
        `${parseMoney(revenueRange2, true, false)} - ${parseMoney(
          revenueRange3,
          false,
          true
        )}`,
        [revenueRange2, revenueRange3].join("-")
      ],
      [
        `> ${parseMoney(revenueRange3, true, true)}`,
        [revenueRange3, Number.MAX_VALUE].join("-")
      ]
    ];
  }

  function parseMoney(value, addCurrency, addMillion) {
    if (value > 1000000) {
      value = value / 1000000;
      if (addMillion) {
        if (value > 1000) {
          value = (value / 1000).toLocaleString();
          value += "k";
        } else {
          value = value.toLocaleString();
        }
        value += " M";
      }
    }
    return addCurrency ? `${value} €` : value;
  }

  function getJSON(url, callback) {
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open("GET", url, true);
    xobj.onreadystatechange = function() {
      if (xobj.readyState == 4 && xobj.status == "200") {
        // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
        const jsonData = JSON.parse(xobj.responseText);
        callback(jsonData);
      }
    };
    xobj.send(null);
  }

  function onFilterSelected(event, callback) {
    let sel = event.target;
    let filterType = sel.dataset.filter;
    let selected = sel.options[sel.selectedIndex].value;

    if (selected === "" || filters[filterType] === selected) {
      filters[filterType] = null;
    } else {
      filters[filterType] = selected;
    }

    localStorage.setItem('filters-home', JSON.stringify(filters))

    callback();
    return true;
  }

  function getTree(data) {
    let tree = deepmerge.all(data);

    // section C keys are not sorted, we need to sort them
    // in the final tree
    let sectionC = {};
    Object.keys(tree["s_C"])
      .sort()
      .forEach(key => {
        sectionC[key] = tree["s_C"][key];
      });
    tree["s_C"] = sectionC;

    // section E keys are not sorted, we need to sort them
    // in the final tree
    let sectionEProducts = {};
    Object.keys(tree["s_E"]["s_E_products"])
      .sort()
      .forEach(key => {
        sectionEProducts[key] = tree["s_E"]["s_E_products"][key];
      });
    tree["s_E"]["s_E_products"] = sectionEProducts;
    return tree;
  }

})();