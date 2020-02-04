(function() {
  const DEBUG = location.href === "http://0.0.0.0:4000/database";
  
  window.addEventListener("DOMContentLoaded", () => {
    const dictionaryUrl = DEBUG ? "../static_data/mock_dictionary.json" : "https://act-export.frankbold.org/dictionary.json";
    const reportsUrl = DEBUG ? "../static_data/mock_reports.json" : "https://act-export.frankbold.org/reports.json";

    getJSON(dictionaryUrl, dictionary => {
      getJSON(reportsUrl, data => {
        // Update sector names using the dictionary keys
        data.forEach(d => {
          d.company.sectors = d.company.sectors.map(d => dictionary[d]);
        });

        // The list of sections is the first level of the JSON
        let tree = null;
        if (DEBUG) {
          tree = {}; //getTree(data);
        } else {
          tree = getTree(data);
        }

        // Load sidebar
        const sidebar = document.querySelector(".js-database-sidebar");
        sidebar.innerHTML = loadTOC(tree, dictionary);

        const lis = sidebar.querySelectorAll("li");
        const activeClass = "active";

        // Event delegation to the parent (avoid multiple listeners)
        sidebar.addEventListener("click", event => {
          const { target } = event;

          lis.forEach(li => li.classList.remove(activeClass));
          target.parentElement.classList.add(activeClass);

          const { hash } = target;
          if (hash) {
            renderSection(hash.slice(1), data, tree, dictionary);
          }
        });

        const { hash } = window.location;

        // Search the anchor-hash who matches with the location-hash
        const i = hash
          ? [...lis].findIndex(d => [...d.children].find(d => d.hash === hash))
          : 0; // If there's no hash, set default one

        lis.item(i).classList.add(activeClass);

        const section = hash ? hash.slice(1) : "general";
        renderSection(section, data, tree, dictionary);
      });
    });
  });

  const mainColor = getComputedStyle(document.documentElement).getPropertyValue(
    "--green"
  );
  const maxValue = 100;
  const revenueRange0 = 3e8;
  const revenueRange1 = 1e9;
  const revenueRange2 = 3e9;
  const revenueRange3 = 2e10;
  const countriesPath = "company.country_incorporation";
  const sectorsPath = "company.sectors";
  const filters = {
    country: null,
    sector: null,
    revenues: null
  };

  // Private functions
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

  function loadTOC(tree, dictionary) {
    let result = "";

    const template = (section, text) => `
<li>
  <a href="#${section}">${text}</a>
</li>
`;

    result += template("general", "General Results");

    Object.keys(tree).forEach(section => {
      let text =
        dictionary[section] !== undefined ? dictionary[section].text : section;

      if (section !== "company") {
        result += template(section, text);
      }
    });

    return `
<ul>
  ${result}
</ul>`;
  }

  function isObject(value) {
    return value && typeof value === "object" && value.constructor === Object;
  }

  function renderSection(section, data, tree, dictionary) {
    // Detect if it's a subsection and extract the parent section
    const regex = /s_[A-Z][0-9]$/g;
    if (section.match(regex)) {
      section = section.slice(0, -1);
    }
    // Section E identifieres are a bit different
    if (section.indexOf("s_E") !== -1) {
      section = "s_E";
    }

    if (section === "general") {
      const content = document.getElementById("sections");
      content.innerHTML = renderGeneralSection();

      loadHorizontalChart(
        "chart-summary_companies_per_revenue_range",
        revenueSummary(data)
      );
      loadHorizontalChart(
        "chart-summary_companies_per_employees",
        employeesSummary(data)
      );

      // TODO: mirar si el display:none puede sustituirse por clase animada
      const activeClass = "active";
      const rowTypes = content.querySelectorAll("[data-row-type]");
      rowTypes.forEach(element => {
        if (element.dataset.rowType !== "policies") {
          element.style.display = "none";
        }
      });

      const tableSelectors = content.querySelectorAll("[data-table-selector]");
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

      fillCountriesFilter(data);
      fillSectorsFilter(data);
      fillRevenuesFilter(data);

      // Assign behaviour to filters
      content.querySelectorAll("[data-filter]").forEach(element => {
        return element.addEventListener("input", event => {
          onFilterSelected(event, () => {
            rowTypes.forEach(r => {
              const charts = r.querySelectorAll("[data-path]");
              if (charts.length) {
                renderCharts(charts, data, dictionary);
              }
            });
          });
        });
      });
    } else {
      //   let renderedTemplate = "";
      //   let text = dictionary[section] !== undefined ? dictionary[section].text : section;
      //   renderedTemplate += `
      // <section id="${section}">
      //   <h2>${text.toUpperCase()}</h2>
      // </section>
      // `;
      //   Object.keys(tree[section]).forEach((subSection) => {
      //     const sectionText = dictionary[subSection] ? dictionary[subSection].text : sentenceCase(subSection);
      //     if(isObject(tree[section][subSection])){
      //       renderedTemplate += `
      // <section id="${section}-${subSection}">
      //   <h3>${sectionText}</h3>
      // </section>
      // `;
      //     }
      //     renderedTemplate += renderSubsection(tree, section, subSection, data, 1, `${section}`, dictionary);
      //   });
      //   document.getElementById("sections").innerHTML = renderedTemplate;
    }

    // render charts
    const charts = document.querySelectorAll("[data-path]");
    renderCharts(charts, data, dictionary);

    // // Assign behaviour to drilldown buttons
    // document.querySelectorAll("[data-drilldown]").forEach((element) => {
    //   return element.addEventListener('click', (event) => {
    //     onDrillDownButtonClick(event, data, dictionary);
    //   });
    // });
  }

  function renderCharts(charts, data, dictionary) {
    charts.forEach(element => onChartLoad(element, data, dictionary));
  }

  function renderGeneralSection() {
    return `
      <section id="general_results-companies-per" class="database-section">
        ${getCompaniesPerHTML()}
      </section>

      <section class="database-section">
        ${getFiltersHTML()}
        ${getTabLinksHTML()}
        ${getTabContentHTML()}
      </section>
    `;
  }

  function getCompaniesPerHTML() {
    return `
      <h4 class="database-section__h4">Summary - Companies per</h4>
      <div class="database-section__col-3 gutter-l">
        <div>
          <span class="database-section__span-underline">Country</span>
          <div>
            <canvas data-path="company.country_incorporation"></canvas>
          </div>
        </div>
        <div>
          <span class="database-section__span-underline">Sector</span>
          <div>
            <canvas data-path="company.sectors"></canvas>
          </div>
        </div>
        <div>
          <span class="database-section__span-underline">Revenue range</span>
          <div>
            <canvas id="chart-summary_companies_per_revenue_range"></canvas>
          </div>
          <span class="database-section__span-underline">Employees</span>
          <div>
            <canvas id="chart-summary_companies_per_employees"></canvas>
          </div>
        </div>
      </div>
    `;
  }

  function getFiltersHTML() {
    return `
      <div class="database-section__flex">
        <h4 class="database-section__h4">Summary - Compliance</h4>
      
        <div class="database-section__col-3 gutter-xl">
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
      </div>
    `;
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
      <div class="database-tabs database-section__col-3 gutter-l">
        ${tabs.map(t => template(t)).join("")}
      </div>
    `;
  }

  function getTabContentHTML() {
    return `
      <div class="database-tabcontent">
        <ul>
          <li class="database-tabcontent__row">
            <div class="database-tabcontent__captions-light"> 
              <p>% Percentage of total</p>
            </div>
            <div class="database-tabcontent__captions database-section__col-3 gutter-xl" data-row-type="policies">
              <div>No information provided</div>
              <div>Policy is described or referenced</div>
              <div>Policy description specifies key issues and objectives</div>
            </div>
            <div class="database-tabcontent__captions database-section__col-3 gutter-xl" data-row-type="risks">
              <div>No risks identification</div>
              <div>Vague risks identification</div>
              <div>Description of specific risk</div>
            </div>
            <div class="database-tabcontent__captions database-section__col-3 gutter-xl" data-row-type="outcomes">
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
            <div class="database-section__col-3 gutter-xl" data-row-type="policies">
              <div><canvas data-path="policies.policy" data-type="summary" data-parent="s_A" data-option="1"></canvas></div>
              <div><canvas data-path="policies.policy" data-type="summary" data-parent="s_A" data-option="2"></canvas></div>
              <div><canvas data-path="policies.policy" data-type="summary" data-parent="s_A" data-option="3"></canvas></div>
            </div>
            <div class="database-section__col-3 gutter-xl" data-row-type="risks">
              <div><canvas data-path="risks.risk" data-type="summary" data-parent="s_A" data-option="1"></canvas></div>
              <div><canvas data-path="risks.risk" data-type="summary" data-parent="s_A" data-option="2"></canvas></div>
              <div><canvas data-path="risks.risk" data-type="summary" data-parent="s_A" data-option="3"></canvas></div>
            </div>
            <div class="database-section__col-3 gutter-xl" data-row-type="outcomes">
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
            <div class="database-section__col-3 gutter-xl" data-row-type="policies">
              <div><canvas data-path="policies.policy" data-type="summary" data-parent="s_B" data-option="1"></canvas></div>
              <div><canvas data-path="policies.policy" data-type="summary" data-parent="s_B" data-option="2"></canvas></div>
              <div><canvas data-path="policies.policy" data-type="summary" data-parent="s_B" data-option="3"></canvas></div>
            </div>
            <div class="database-section__col-3 gutter-xl" data-row-type="risks">
              <div><canvas data-path="risks.risk" data-type="summary" data-parent="s_B" data-option="1"></canvas></div>
              <div><canvas data-path="risks.risk" data-type="summary" data-parent="s_B" data-option="2"></canvas></div>
              <div><canvas data-path="risks.risk" data-type="summary" data-parent="s_B" data-option="3"></canvas></div>
            </div>
            <div class="database-section__col-3 gutter-xl" data-row-type="outcomes">
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
            <div class="database-section__col-3 gutter-xl" data-row-type="policies">
              <div><canvas data-path="policies.policy" data-type="summary" data-parent="s_C" data-option="1"></canvas></div>
              <div><canvas data-path="policies.policy" data-type="summary" data-parent="s_C" data-option="2"></canvas></div>
              <div><canvas data-path="policies.policy" data-type="summary" data-parent="s_C" data-option="3"></canvas></div>
            </div>
            <div class="database-section__col-3 gutter-xl" data-row-type="risks">
              <div><canvas data-path="risks.risk" data-type="summary" data-parent="s_C" data-option="1"></canvas></div>
              <div><canvas data-path="risks.risk" data-type="summary" data-parent="s_C" data-option="2"></canvas></div>
              <div><canvas data-path="risks.risk" data-type="summary" data-parent="s_C" data-option="3"></canvas></div>
            </div>
            <div class="database-section__col-3 gutter-xl" data-row-type="outcomes">
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
            <div class="database-section__col-3 gutter-xl" data-row-type="policies">
              <div><canvas data-path="policies.policy" data-type="summary" data-parent="s_D" data-option="1"></canvas></div>
              <div><canvas data-path="policies.policy" data-type="summary" data-parent="s_D" data-option="2"></canvas></div>
              <div><canvas data-path="policies.policy" data-type="summary" data-parent="s_D" data-option="3"></canvas></div>
            </div>
            <div class="database-section__col-3 gutter-xl" data-row-type="risks">
              <div><canvas data-path="risks.risk" data-type="summary" data-parent="s_D" data-option="1"></canvas></div>
              <div><canvas data-path="risks.risk" data-type="summary" data-parent="s_D" data-option="2"></canvas></div>
              <div><canvas data-path="risks.risk" data-type="summary" data-parent="s_D" data-option="3"></canvas></div>
            </div>
            <div class="database-section__col-3 gutter-xl" data-row-type="outcomes">
              <div><canvas data-path="outcomes.outcomes" data-type="summary" data-parent="s_D" data-option="1"></canvas></div>
              <div><canvas data-path="outcomes.outcomes" data-type="summary" data-parent="s_D" data-option="2"></canvas></div>
              <div><canvas data-path="outcomes.outcomes" data-type="summary" data-parent="s_D" data-option="3"></canvas></div>
            </div>
          </li>
        </ul>
      </div>
    `;
  }

  function onChartLoad(element, data, dictionary) {
    // Add question titles dynamically from the data-path and the dictionary value
    // const parents = getParents(
    //   element,
    //   ".act-main-section-group-charts-elements"
    // );
    // if (parents.length) {
    //   const parent = parents[0];
    //   const title = parent.querySelector(
    //     ".act-main-section-group-charts-elements-title"
    //   );
    //   // If there's already a question title, ignore it
    //   if (title !== undefined && title !== null && title.innerHTML === "") {
    //     const key = element.dataset.path.split(".").pop() + ".text";
    //     title.innerHTML = resolve(dictionary, key);
    //   }
    // }

    // Get summarized data for chart and render it
    if (element.dataset.type === "summary") {
      return loadSummaryChart(
        element,
        summaryChartData(
          data,
          element.dataset.path,
          element.dataset.parent,
          element.dataset.option
        )
      );
    } else {
      return loadHorizontalChart(
        element,
        summarizeDataFromPath(
          data,
          element.dataset.path,
          element.dataset.dictionary,
          dictionary
        )
      );
    }
  }

  function loadHorizontalChart(idOrElement, chartData, options = {}) {
    let chart;
    if (isString(idOrElement)) {
      chart = document.getElementById(idOrElement);
    } else {
      chart = idOrElement;
    }

    const columnNames = chartData.data.map(a => wrap(a[0], 20));
    const data = chartData.data.map(a => parseFloat(a[1]));
    const inverseData = data.map(e => maxValue - e);

    let barThickness = options.barThickness || 20;
    chart.height = columnNames.length * (barThickness + 12);
    if (chart.height < 180) {
      chart.height = 180;
    }

    let opts = {
      type: "horizontalBar",
      data: {
        labels: columnNames,
        datasets: [
          {
            data: data,
            backgroundColor: mainColor,
            barThickness: barThickness
          },
          {
            data: inverseData,
            hiddenLabel: true
          }
        ]
      },
      plugins: [ChartDataLabels],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        legend: {
          display: false
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
                max: maxValue,
                callback: value => `${value} %`
              }
            }
          ],
          yAxes: [
            {
              stacked: true,
              gridLines: {
                display: false
              },
              afterFit: scaleInstance => {
                scaleInstance.width = chart.width / 2;
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
            barThickness: barThickness
          },
          {
            data: inverseData,
            hiddenLabel: true
          }
        ]
      },
      plugins: [ChartDataLabels],
      options: {
        responsive: false,
        maintainAspectRatio: true,
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

  function summarizeDataFromPath(data, path, dictionaryKey, dictionary) {
    let result = {};
    let total, values;

    [total, values] = getValues(data, path, { flatten: true });

    values.forEach(value => {
      if (result[value] === undefined) {
        result[value] = 0;
      }
      result[value]++;
    });

    return {
      data: calculatePercentage(result, total, dictionaryKey, dictionary)
    };
  }

  function getValues(obj, path, options = {}) {
    let values = [];
    let total;

    if (options.groupBy) {
      obj.forEach(d => {
        const value = resolve(d, path);
        let groupByValues = resolve(d, options.groupBy);
        if (!Array.isArray(groupByValues)) {
          groupByValues = [groupByValues];
        }
        groupByValues.forEach(groupByValue => {
          if (Array.isArray(value)) {
            if (options.flatten === true) {
              value.forEach(v => {
                if (v !== undefined) {
                  values.push([v, groupByValue]);
                }
              });
            } else {
              if (value !== undefined) {
                values.push([value, groupByValue]);
              }
            }
          } else {
            if (value !== undefined) {
              values.push([value, groupByValue]);
            }
          }
        });
      });
      total = values.length;
    } else {
      values = obj.map(d => resolve(d, path)).filter(d => d !== undefined);
      total = values.length;

      if (options.flatten === true) {
        values = flatten(values);
      }

      if (options.unique === true) {
        values = unique(values);
      }
    }

    return [total, values];
  }

  function getParents(elem, selector) {
    // Element.matches() polyfill
    if (!Element.prototype.matches) {
      Element.prototype.matches =
        Element.prototype.matchesSelector ||
        Element.prototype.mozMatchesSelector ||
        Element.prototype.msMatchesSelector ||
        Element.prototype.oMatchesSelector ||
        Element.prototype.webkitMatchesSelector ||
        function(s) {
          var matches = (this.document || this.ownerDocument).querySelectorAll(
              s
            ),
            i = matches.length;
          while (--i >= 0 && matches.item(i) !== this) {}
          return i > -1;
        };
    }

    // Setup parents array
    var parents = [];
    // Get matching parent elements
    for (; elem && elem !== document; elem = elem.parentNode) {
      // Add matching parents to array
      if (selector) {
        if (elem.matches(selector)) {
          parents.push(elem);
        }
      } else {
        parents.push(elem);
      }
    }
    return parents;
  }

  function flatten(arr) {
    return arr.reduce((flat, toFlatten) => {
      return flat.concat(
        Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten
      );
    }, []);
  }

  function isString(x) {
    return Object.prototype.toString.call(x) === "[object String]";
  }

  function wrap(str, limit) {
    if (str.length <= limit) {
      return str;
    }

    const words = str.split(" ");
    let aux = [];
    let concat = [];

    for (let i = 0; i < words.length; i++) {
      let join = concat.join(" ") + " " + words[i];
      if (join.length > limit) {
        aux.push(concat.join(" "));
        concat = [words[i]];
        if (aux.length === 3) {
          if (i < words.length - 1) {
            aux[2] = aux[2] + "...";
          }
          concat = [];
          break;
        }
      } else {
        concat.push(words[i]);
      }
    }

    if (concat.length) {
      aux.push(concat.join(" ").trim());
    }

    return aux;
  }

  function revenueSummary(data) {
    const revenues = data
      .map(d => d.company.revenues)
      .map(revenueTxt => parseFloat(revenueTxt.replace(/,/g, "")))
      .filter(value => !Number.isNaN(value));

    const t0 = revenues.filter(v => v < revenueRange0).length;
    const t1 = revenues.filter(v => v >= revenueRange0 && v < revenueRange1)
      .length;
    const t2 = revenues.filter(v => v >= revenueRange1 && v < revenueRange2)
      .length;
    const t3 = revenues.filter(v => v >= revenueRange2 && v < revenueRange3)
      .length;
    const t4 = revenues.filter(v => v >= revenueRange3).length;
    const total = t0 + t1 + t2 + t3 + t4;

    return {
      data: [
        [`< ${parseMoney(revenueRange0, true, true)}`, percentage(t0, total)],
        [
          `${parseMoney(revenueRange0, true, false)} - ${parseMoney(
            revenueRange1,
            false,
            true
          )}`,
          percentage(t1, total)
        ],
        [
          `${parseMoney(revenueRange1, true, false)} - ${parseMoney(
            revenueRange2,
            false,
            true
          )}`,
          percentage(t2, total)
        ],
        [
          `${parseMoney(revenueRange2, true, false)} - ${parseMoney(
            revenueRange3,
            false,
            true
          )}`,
          percentage(t3, total)
        ],
        [`> ${parseMoney(revenueRange3, true, true)}`, percentage(t4, total)]
      ]
    };
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

  function employeesSummary(data) {
    const employees = data
      .map(d => d.company.employees)
      .map(employeeTxt => parseFloat(employeeTxt.replace(/,/g, "")))
      .sort((a, b) => a - b)
      .filter(value => !Number.isNaN(value));
    const q0 = 500;
    const q1 = 1500;
    const q2 = 5000;
    const q3 = 15000;
    const q4 = 50000;
    const r0 = employees.filter(v => v < q0).length;
    const r1 = employees.filter(v => v >= q0 && v < q1).length;
    const r2 = employees.filter(v => v >= q1 && v < q2).length;
    const r3 = employees.filter(v => v >= q2 && v < q3).length;
    const r4 = employees.filter(v => v >= q3 && v < q4).length;
    const r5 = employees.filter(v => v >= q4).length;
    const total = r0 + r1 + r2 + r3 + r4 + r5;

    return {
      data: [
        [
          `${q0.toLocaleString()} - ${q1.toLocaleString()}`,
          percentage(r1, total)
        ],
        [
          `${q1.toLocaleString()} - ${q2.toLocaleString()}`,
          percentage(r2, total)
        ],
        [
          `${q2.toLocaleString()} - ${q3.toLocaleString()}`,
          percentage(r3, total)
        ],
        [
          `${q3.toLocaleString()} - ${q4.toLocaleString()}`,
          percentage(r4, total)
        ],
        [`> ${q4.toLocaleString()}`, percentage(r5, total)]
      ]
    };
  }

  function fillCountriesFilter(data) {
    let element = document.getElementById("filter-country");
    const option = document.createElement("option");
    option.text = "Select a country";
    option.value = "";
    element.appendChild(option);

    getCountries(data).forEach(country => {
      const option = document.createElement("option");
      option.text = country;
      option.value = country;
      element.appendChild(option);
    });
  }

  function fillSectorsFilter(data) {
    let element = document.getElementById("filter-sector");
    const option = document.createElement("option");
    option.text = "Select a sector";
    option.value = "";
    element.appendChild(option);
    getSectors(data).forEach(country => {
      const option = document.createElement("option");
      option.text = country;
      option.value = country;
      element.appendChild(option);
    });
  }

  function fillRevenuesFilter() {
    let element = document.getElementById("filter-revenues");
    const option = document.createElement("option");
    option.text = "Select a revenue range";
    option.value = "";
    element.appendChild(option);
    getRevenuesFilters().forEach(range => {
      const option = document.createElement("option");
      option.text = range[0];
      option.value = range[1];
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

  function onFilterSelected(event, callback) {
    let sel = event.target;
    let filterType = sel.dataset.filter;
    let selected = sel.options[sel.selectedIndex].value;

    if (selected === "" || filters[filterType] === selected) {
      filters[filterType] = null;
    } else {
      filters[filterType] = selected;
    }
    callback();
    return true;
  }
})();
