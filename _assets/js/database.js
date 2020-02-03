(function() {
  window.addEventListener("DOMContentLoaded", () => {
    // TODO: refactor this method, don't call it after DOMContentLoaded, but before
    getJSON("https://act-export.frankbold.org/dictionary.json", dictionary => {
      getJSON("https://act-export.frankbold.org/reports.json", data => {
        // Update sector names using the dictionary keys
        data.forEach(d => {
          d.company.sectors = d.company.sectors.map(d => dictionary[d]);
        });

        // The list of sections is the first level of the JSON
        const tree = getTree(data);

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

        // If there's no hash, set default one
        const { hash = "#general" } = window.location;

        // Search the anchor-hash who matches with the location-hash
        const i = [...lis].findIndex(d =>
          [...d.children].find(d => d.hash === hash)
        );
        lis.item(i).classList.add(activeClass);

        renderSection(hash.slice(1), data, tree, dictionary);
      });
    });
  });

  const mainColor = getComputedStyle(document.documentElement).getPropertyValue("--green");
  const maxValue = 100;
  const revenueRange0 = 3e8;
  const revenueRange1 = 1e9;
  const revenueRange2 = 3e9;
  const revenueRange3 = 2e10;
  const countriesPath = "company.country_incorporation";
  const sectorsPath = "company.sectors";

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
      document.getElementById("sections").innerHTML = renderGeneralSection();

      loadHorizontalChart(
        "chart-summary_companies_per_revenue_range",
        revenueSummary(data)
      );
      loadHorizontalChart(
        "chart-summary_companies_per_employees",
        employeesSummary(data)
      );

      renderSummaryTable("summary-table");
      assignTableBehaviour("summary-table");
      fillFilterValues(data);

      // // Assign behaviour to filters
      // document.querySelectorAll("[data-filter]").forEach((element) => {
      //   return element.addEventListener('input', (event) => {
      //     onFilterSelected(event, () => {
      //       renderSummaryTable(data, "summary-table");
      //       assignTableBehaviour("summary-table");

      //       document.querySelectorAll("[data-path]").forEach((element) => {
      //         return onChartLoad(element, data, dictionary);
      //       });
      //     });
      //   });
      // });
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
    document.querySelectorAll("[data-path]").forEach(element => {
      return onChartLoad(element, data, dictionary);
    });

    // // Assign behaviour to drilldown buttons
    // document.querySelectorAll("[data-drilldown]").forEach((element) => {
    //   return element.addEventListener('click', (event) => {
    //     onDrillDownButtonClick(event, data, dictionary);
    //   });
    // });
  }

  function renderGeneralSection() {
    return `
<section id="general_results-companies-per" class="database-section">
  <h4 class="database-section__h4">Summary - Companies per</h4>
  <div class="database-section__col-3">
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
</section>

<section class="database-section">
  <div class="database-section__flex">
    <h4 class="database-section__h4">Summary - Compliance</h4>
  
    <div class="database-section__col-3">
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
  
  <div class="act-main-section-group">
    <div class="act-main-groups-charts">
      <table id="summary-table"></table>
    </div>
  </div>

</section>
`;
  }

  function onChartLoad(element, data, dictionary) {
    // Add question titles dynamically from the data-path and the dictionary value
    const parents = getParents(
      element,
      ".act-main-section-group-charts-elements"
    );
    if (parents.length) {
      const parent = parents[0];
      const title = parent.querySelector(
        ".act-main-section-group-charts-elements-title"
      );
      // If there's already a question title, ignore it
      if (title !== undefined && title !== null && title.innerHTML === "") {
        const key = element.dataset.path.split(".").pop() + ".text";
        title.innerHTML = resolve(dictionary, key);
      }
    }
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

    console.log(chart.parentElement.getBoundingClientRect().width);
    

    const columnNames = chartData.data.map(a => wrap(a[0], 20));
    const data = chartData.data.map(a => parseFloat(a[1]));
    const inverseData = data.map(e => maxValue - e)

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
            hiddenLabel: true,
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
                beginAtZero: true,
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
    let data = chartData.data.map(a => parseFloat(a[1]));
    const inverseData = data.map(e => maxValue - e + 0.1);

    let barThickness = options.barThickness || 20;
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
        scales: {
          xAxes: [
            {
              stacked: true,
              gridLines: {
                drawBorder: false,
                drawTicks: false
              },
              ticks: {
                display: false
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

  function renderSummaryTable(selector) {
    const template = `
  <thead>
    <tr>
      <th></th>
      <th data-row-type="policies" class="heading-selected" data-table-selector="policies">Policies & Procedures</th>
      <th data-row-type="policies" class="heading-no-selected" data-table-selector="risks">Risks management</th>
      <th data-row-type="policies" class="heading-no-selected" data-table-selector="outcomes">Outcomes</th>
      <th data-row-type="risks"    class="heading-no-selected" data-table-selector="policies">Policies & Procedures</th>
      <th data-row-type="risks"    class="heading-selected" data-table-selector="risks">Risks management</th>
      <th data-row-type="risks"    class="heading-no-selected" data-table-selector="outcomes">Outcomes</th>
      <th data-row-type="outcomes" class="heading-no-selected" data-table-selector="policies">Policies & Procedures</th>
      <th data-row-type="outcomes" class="heading-no-selected" data-table-selector="risks">Risks management</th>
      <th data-row-type="outcomes" class="heading-selected" data-table-selector="outcomes">Outcomes</th>
    </tr>
    <tr>
      <th></th>
      <!-- Policies & procedures -->
      <th data-row-type="policies">No information provided</th>
      <th data-row-type="policies">Policy is described or referenced</th>
      <th data-row-type="policies">Policy description specifies key issues and objectives</th>
      <!-- Risks Management -->
      <th data-row-type="risks">No risks identification</th>
      <th data-row-type="risks">Vague risks identification</th>
      <th data-row-type="risks">Description of specific risk</th>
      <!-- Outcomes -->
      <th data-row-type="outcomes">No description</th>
      <th data-row-type="outcomes">Description provided</th>
      <th data-row-type="outcomes">Outcomes in terms of meeting policy targets</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="heading">A - Enviroment</td>
      <td data-row-type="policies"></td>
      <td data-row-type="policies"></td>
      <td data-row-type="policies"></td>
      <td data-row-type="risks"></td>
      <td data-row-type="risks"></td>
      <td data-row-type="risks"></td>
      <td data-row-type="outcomes"></td>
      <td data-row-type="outcomes"></td>
      <td data-row-type="outcomes"></td>
    </tr>
    <tr>
      <td>
        <p>A.1 Climate change</p>
        <p>A.2 Use of natural resources</p>
        <p>A.3 Polluting discharges</p>
        <p>A.4 Waste</p>
        <p>A.5 Biodiversity and ecosystem conservation</p>
      </td>
      <td data-row-type="policies"><canvas data-path="policies.policy" data-type="summary" data-parent="s_A" data-option="1"></canvas></td>
      <td data-row-type="policies"><canvas data-path="policies.policy" data-type="summary" data-parent="s_A" data-option="2"></canvas></td>
      <td data-row-type="policies"><canvas data-path="policies.policy" data-type="summary" data-parent="s_A" data-option="3"></canvas></td>
      <td data-row-type="risks"   ><canvas data-path="risks.risk" data-type="summary" data-parent="s_A" data-option="1"></canvas></td>
      <td data-row-type="risks"   ><canvas data-path="risks.risk" data-type="summary" data-parent="s_A" data-option="2"></canvas></td>
      <td data-row-type="risks"   ><canvas data-path="risks.risk" data-type="summary" data-parent="s_A" data-option="3"></canvas></td>
      <td data-row-type="outcomes"><canvas data-path="outcomes.outcomes" data-type="summary" data-parent="s_A" data-option="1"></canvas></td>
      <td data-row-type="outcomes"><canvas data-path="outcomes.outcomes" data-type="summary" data-parent="s_A" data-option="2"></canvas></td>
      <td data-row-type="outcomes"><canvas data-path="outcomes.outcomes" data-type="summary" data-parent="s_A" data-option="3"></canvas></td>
    </tr>
    <tr>
      <td class="heading">B - Employee and social matters</td>
      <td data-row-type="policies"></td>
      <td data-row-type="policies"></td>
      <td data-row-type="policies"></td>
      <td data-row-type="risks"></td>
      <td data-row-type="risks"></td>
      <td data-row-type="risks"></td>
      <td data-row-type="outcomes"></td>
      <td data-row-type="outcomes"></td>
      <td data-row-type="outcomes"></td>
    </tr>
    <tr>
      <td>
        <p>B.1 Employee and workforce matters</p>
      </td>
      <td data-row-type="policies"><canvas data-path="policies.policy" data-type="summary" data-parent="s_B" data-option="1"></canvas></td>
      <td data-row-type="policies"><canvas data-path="policies.policy" data-type="summary" data-parent="s_B" data-option="2"></canvas></td>
      <td data-row-type="policies"><canvas data-path="policies.policy" data-type="summary" data-parent="s_B" data-option="3"></canvas></td>
      <td data-row-type="risks"   ><canvas data-path="risks.risk" data-type="summary" data-parent="s_B" data-option="1"></canvas></td>
      <td data-row-type="risks"   ><canvas data-path="risks.risk" data-type="summary" data-parent="s_B" data-option="2"></canvas></td>
      <td data-row-type="risks"   ><canvas data-path="risks.risk" data-type="summary" data-parent="s_B" data-option="3"></canvas></td>
      <td data-row-type="outcomes"><canvas data-path="outcomes.outcomes" data-type="summary" data-parent="s_B" data-option="1"></canvas></td>
      <td data-row-type="outcomes"><canvas data-path="outcomes.outcomes" data-type="summary" data-parent="s_B" data-option="2"></canvas></td>
      <td data-row-type="outcomes"><canvas data-path="outcomes.outcomes" data-type="summary" data-parent="s_B" data-option="3"></canvas></td>
    </tr>
    <tr>
      <td class="heading">C - Human Rights</td>
      <td data-row-type="policies"></td>
      <td data-row-type="policies"></td>
      <td data-row-type="policies"></td>
      <td data-row-type="risks"></td>
      <td data-row-type="risks"></td>
      <td data-row-type="risks"></td>
      <td data-row-type="outcomes"></td>
      <td data-row-type="outcomes"></td>
      <td data-row-type="outcomes"></td>
    </tr>
    <tr>
      <td>
        <p>C. General Human Rights Reporting Criteria</p>
        <p>C1. Supply Chains Management</p>
        <p>C2. Impacts on indigenous and/or local communities rights</p>
        <p>C3. Hight risk areas for Civil & Political rights</p>
        <p>C4. Conflict resources (minerals, timber, etc.)</p>
        <p>C5. Data protection / Digital rights</p>
      </td>
      <td data-row-type="policies"><canvas data-path="policies.policy" data-type="summary" data-parent="s_C" data-option="1"></canvas></td>
      <td data-row-type="policies"><canvas data-path="policies.policy" data-type="summary" data-parent="s_C" data-option="2"></canvas></td>
      <td data-row-type="policies"><canvas data-path="policies.policy" data-type="summary" data-parent="s_C" data-option="3"></canvas></td>
      <td data-row-type="risks"   ><canvas data-path="risks.risk" data-type="summary" data-parent="s_C" data-option="1"></canvas></td>
      <td data-row-type="risks"   ><canvas data-path="risks.risk" data-type="summary" data-parent="s_C" data-option="2"></canvas></td>
      <td data-row-type="risks"   ><canvas data-path="risks.risk" data-type="summary" data-parent="s_C" data-option="3"></canvas></td>
      <td data-row-type="outcomes"><canvas data-path="outcomes.outcomes" data-type="summary" data-parent="s_C" data-option="1"></canvas></td>
      <td data-row-type="outcomes"><canvas data-path="outcomes.outcomes" data-type="summary" data-parent="s_C" data-option="2"></canvas></td>
      <td data-row-type="outcomes"><canvas data-path="outcomes.outcomes" data-type="summary" data-parent="s_C" data-option="3"></canvas></td>
    </tr>
    <tr>
      <td class="heading">D - Anti-corruption & Whistleblowing</td>
      <td data-row-type="policies"></td>
      <td data-row-type="policies"></td>
      <td data-row-type="policies"></td>
      <td data-row-type="risks"></td>
      <td data-row-type="risks"></td>
      <td data-row-type="risks"></td>
      <td data-row-type="outcomes"></td>
      <td data-row-type="outcomes"></td>
      <td data-row-type="outcomes"></td>
    </tr>
    <tr>
      <td>
        <p>D1. Anti-corruption</p>
        <p>D2. Whistleblowing channel</p>
      </td>
      <td data-row-type="policies"><canvas data-path="policies.policy" data-type="summary" data-parent="s_D" data-option="1"></canvas></td>
      <td data-row-type="policies"><canvas data-path="policies.policy" data-type="summary" data-parent="s_D" data-option="2"></canvas></td>
      <td data-row-type="policies"><canvas data-path="policies.policy" data-type="summary" data-parent="s_D" data-option="3"></canvas></td>
      <td data-row-type="risks"   ><canvas data-path="risks.risk" data-type="summary" data-parent="s_D" data-option="1"></canvas></td>
      <td data-row-type="risks"   ><canvas data-path="risks.risk" data-type="summary" data-parent="s_D" data-option="2"></canvas></td>
      <td data-row-type="risks"   ><canvas data-path="risks.risk" data-type="summary" data-parent="s_D" data-option="3"></canvas></td>
      <td data-row-type="outcomes"><canvas data-path="outcomes.outcomes" data-type="summary" data-parent="s_D" data-option="1"></canvas></td>
      <td data-row-type="outcomes"><canvas data-path="outcomes.outcomes" data-type="summary" data-parent="s_D" data-option="2"></canvas></td>
      <td data-row-type="outcomes"><canvas data-path="outcomes.outcomes" data-type="summary" data-parent="s_D" data-option="3"></canvas></td>
    </tr>
    <!--
      <tr>
        <td class="heading">E - General positive impacts by products / sources of opportunity</td>
        <td data-row-type="policies"></td>
        <td data-row-type="policies"></td>
        <td data-row-type="policies"></td>
        <td data-row-type="risks"></td>
        <td data-row-type="risks"></td>
        <td data-row-type="risks"></td>
        <td data-row-type="outcomes"></td>
        <td data-row-type="outcomes"></td>
        <td data-row-type="outcomes"></td>
      </tr>
      <tr>
        <td>
          <p>General</p>
          <p>E1. Infrastructure</p>
          <p>E2. Food & Beverages</p>
          <p>E3. Technology & Communications</p>
          <p>E4. Transportation</p>
          <p>E5. Health Care</p>
          <p>E6. Energy & Resource Extraction</p>
          <p>E7. Consumption</p>
          <p>E8. Final Services</p>
        </td>
        <td data-row-type="policies"><canvas data-path="policies.policy" data-type="summary" data-parent="s_E" data-option="1"></canvas></td>
        <td data-row-type="policies"><canvas data-path="policies.policy" data-type="summary" data-parent="s_E" data-option="2"></canvas></td>
        <td data-row-type="policies"><canvas data-path="policies.policy" data-type="summary" data-parent="s_E" data-option="3"></canvas></td>
        <td data-row-type="risks"   ><canvas data-path="risks.risk" data-type="summary" data-parent="s_E" data-option="1"></canvas></td>
        <td data-row-type="risks"   ><canvas data-path="risks.risk" data-type="summary" data-parent="s_E" data-option="2"></canvas></td>
        <td data-row-type="risks"   ><canvas data-path="risks.risk" data-type="summary" data-parent="s_E" data-option="3"></canvas></td>
        <td data-row-type="outcomes"><canvas data-path="outcomes.outcomes" data-type="summary" data-parent="s_E" data-option="1"></canvas></td>
        <td data-row-type="outcomes"><canvas data-path="outcomes.outcomes" data-type="summary" data-parent="s_E" data-option="2"></canvas></td>
        <td data-row-type="outcomes"><canvas data-path="outcomes.outcomes" data-type="summary" data-parent="s_E" data-option="3"></canvas></td>
      </tr>
    -->
  </tbody>`;
    document.getElementById(selector).innerHTML = template;
  }

  function assignTableBehaviour(id) {
    let table = document.getElementById(id);

    table.querySelectorAll("[data-row-type]").forEach(element => {
      if (element.dataset.rowType !== "policies") {
        element.style.display = "none";
      }
    });

    document.querySelectorAll("[data-table-selector]").forEach(element => {
      return element.addEventListener("click", event => {
        const selectedRowType = event.target.dataset.tableSelector;
        table.querySelectorAll("[data-row-type]").forEach(element => {
          if (element.dataset.rowType !== selectedRowType) {
            element.style.display = "none";
          } else {
            element.style.display = "";
          }
        });
      });
    });
  }

  function fillFilterValues(data) {
    window.filters = {
      country: null,
      sector: null,
      revenues: null
    };

    fillCountriesFilter(data);
    fillSectorsFilter(data);
    fillRevenuesFilter(data);
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
      if(window.filters !== undefined) {
        if(window.filters.country !== null && company.company.country_incorporation !== window.filters.country) {
          return;
        }
        if(window.filters.sector !== null && company.company.sectors !== undefined && company.company.sectors.indexOf(window.filters.sector) === -1) {
          return;
        }
        if(window.filters.revenues !== null && company.company.revenues !== undefined) {
          let revenues = parseFloat(company.company.revenues.replace(/,/g, ''));
          let range = window.filters.revenues.split("-").map(d => parseFloat(d));
          if(!(revenues >= range[0] && revenues <= range[1])) {
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
})();
