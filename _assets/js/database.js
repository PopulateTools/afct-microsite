(function() {
  const DEBUG = (location.origin === "http://0.0.0.0:4000") || false;

  let mockTree = null;
  if (DEBUG) {
    getJSON("../static_data/mock_tree.json", d => { mockTree = d })
  }

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
          tree = mockTree || {};
        } else {
          tree = getTree(data);
        }

        // Load sidebar
        const sidebar = document.querySelector("[data-sidebar]");
        sidebar.innerHTML = loadTOC(tree, dictionary);

        const lis = sidebar.querySelectorAll("li");
        const submenus = sidebar.querySelectorAll("li ul");

        // Event delegation to the parent (avoid multiple listeners)
        sidebar.addEventListener("click", ({ target }) => {
          const { nextElementSibling: ul } = target

          // remove all active states, and close all submenus
          lis.forEach(li => li.classList.remove(activeClass));
          submenus.forEach(ul => ul.classList.remove(openClass));

          // set active class for the clicked item
          target.parentElement.classList.add(activeClass);

          // open submenu if there is
          if (ul) {
            ul.classList.add(openClass)
          }

          target.closest("ul").classList.add(openClass)

          const { hash } = target;
          if (hash) {

            // You will tell me why parent section is called "s_2b" and its children s_2, s_3
            let hash_ = hash
            if (["#s_2", "#s_3"].includes(hash)) {
              hash_ = "#s_2b"
            }

            renderSection(hash_.slice(1), data, tree, dictionary);
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

        // download button handler
        document.addEventListener('click', ({ target }) => {
          const { previousElementSibling } = target
          
          if (previousElementSibling) {
            const { nodeName } = previousElementSibling
            
            // Check if the previous sibling is a canvas
            if (nodeName && nodeName === "CANVAS") {
              const { dataset } = previousElementSibling
  
              if (dataset) {
                downloadCanvas({ dataset, data, dictionary })
              }
            }
          }
        })
      });
    });
  });

  closestPolyfill()

  Chart.defaults.global.tooltips = {
    enabled: false
  }

  // Chart.defaults.global.defaultFontFamily = 'Avenir Next';
  Chart.defaults.global.defaultFontSize = 11;

  const mainColor = getComputedStyle(document.documentElement).getPropertyValue(
    "--green"
  );
  const activeClass = "active";
  const openClass = "is-open";
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
  function closestPolyfill() {
    if (!Element.prototype.matches) {
      Element.prototype.matches =
        Element.prototype.msMatchesSelector ||
        Element.prototype.webkitMatchesSelector;
    }
  
    if (!Element.prototype.closest) {
      Element.prototype.closest = function(s) {
        var el = this;
  
        do {
          if (el.matches(s)) return el;
          el = el.parentElement || el.parentNode;
        } while (el !== null && el.nodeType === 1);
        return null;
      };
    }
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

    const ul = html => `<ul>${html}</ul>`
    const li = html => `<li>${html}</li>`
    const a = (section, text) => `<a href="#${section}">${text}</a>`;

    result += li(a("general", "General Results"));

    Object.keys(tree).forEach(section => {
      let text =
        dictionary[section] !== undefined ? dictionary[section].text : section;

      let block = "";
      if (section !== "company") {
        block += a(section, text);
        block += loadChildrenTOC(tree, section, dictionary)
        result += li(block)
      }
    });

    return ul(result);
  }

  function loadChildrenTOC(tree, section, dictionary) {
    let result = "";

    const ul = html => `<ul>${html}</ul>`
    const li = html => `<li>${html}</li>`
    const a = (section, text) => `<a href="#${section}">${text}</a>`;

    Object.keys(tree[section]).forEach((subSection) => {
      if(!isObject(tree[section][subSection])){
        return;
      }
      
      let text = dictionary[subSection] !== undefined ? dictionary[subSection].text : subSection;
      result += li(a(subSection, text));
    });
  
    return ul(result);
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

    const content = document.querySelector("[data-content]");

    if (section === "general") {
      content.innerHTML = renderGeneralSection();

      renderSpecialCharts("chart-summary_companies_per_revenue_range", data)
      renderSpecialCharts("chart-summary_companies_per_employees", data)

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
    } else {
      let renderedTemplate = `<div id="${section}"></div><div class="database-filters">${getFiltersBlock()}</div>`;

      Object.keys(tree[section] || {}).forEach(subSection => {
        const sectionText = dictionary[subSection]
          ? dictionary[subSection].text
          : sentenceCase(subSection);

        let block = renderSubsection(
          tree,
          section,
          subSection,
          data,
          1,
          `${section}`,
          dictionary
        );

        if (isObject(tree[section][subSection])) {
          renderedTemplate += `
            <section class="database-section">
              <span id="${subSection}" class="database-section__anchor"></span>
              <h1 class="database-heading__h1 with-decorator">${sectionText}</h1>
              ${block}
            </section>
          `;
        } else {
          renderedTemplate += block
        }

      });

      content.innerHTML = renderedTemplate;
    }

    // render charts
    const charts = document.querySelectorAll("[data-path]");
    renderCharts(charts, data, dictionary);

    // wrap all canvas with button
    wrapCanvas()

    // Assign behaviour to drilldown buttons
    content.querySelectorAll("[data-drilldown-container]").forEach((element) => {
      const buttons = element.querySelectorAll("[data-drilldown]")

      buttons.forEach(btn => {
        return btn.addEventListener('click', (event) => {
          const { target } = event

          const isActive = target.classList.contains(activeClass)

          if (isActive) {
            target.classList.remove(activeClass);
          } else {
            buttons.forEach(e => e.classList.remove(activeClass));
            target.classList.add(activeClass);
          }

          onDrillDownButtonClick(event, data, dictionary);
        });
      })
    });

    fillCountriesFilter(data);
    fillSectorsFilter(data);
    fillRevenuesFilter(data);

    // Assign behaviour to filters
    content.querySelectorAll("[data-filter]").forEach(element => {
      return element.addEventListener("input", event => {
        onFilterSelected(event, () => {
            const charts = content.querySelectorAll("[data-path]");
            if (charts.length) {
              renderCharts(charts, data, dictionary);
            }
        });
      });
    });
  }

  function renderSubsection(tree, section, subSection, data, level, dataPath, dictionary) {
    let renderedTemplate = "";

    const text = dictionary[subSection]
      ? dictionary[subSection].text
      : subSection;

    // If is not object it means that there are not sub-levels and the question needs to be rendered
    if (!isObject(tree[section][subSection])) {

      // Special scenario where the chart doesn't have a title, it's not duplicated from the below one
      if (level < 2) {
        const className = "database-layout__col-2-3 gutter-l"

        const template = `
          <section class="database-section">

            ${getDrilldownButtonsHTML({ text })}

            <div data-charts-container>
              ${getChartsContainerHTML({ dataPath, subSection, className })}
            </div>

          </section>
        `;

        renderedTemplate += template + "\n\n";
      } else {

        const template = `
          <div data-charts-container>
            ${getChartsContainerHTML({ text, dataPath, subSection })}
          </div>
        `;

        renderedTemplate += template + "\n\n";
      }
    } else {

      let issueTemplate = "";

      // Issues subsection has a special section title named Specific issues & impacts
      if ((level === 2 && subSection === "issues") || (level === 1 && subSection === "s_E_products")) {
        issueTemplate += `
          <section class="database-section__margin-s">
            <h2 class="database-heading__h2">Specific issues & impacts</h2>
          </section>
          `;
      }

      // Recursive call to a deeper level (level + 1) and a deeper data path (dataPath + subSection)
      Object.keys(tree[section][subSection]).forEach(question => {
        issueTemplate += renderSubsection(
          tree[section],
          subSection,
          question,
          data,
          level + 1,
          `${dataPath}.${subSection}`,
          dictionary
        );
      });

      // Specific wrap for section 2
      if (section === "s_2b") {
        issueTemplate = `<div class="database-layout__grid-3 gutter-l">${issueTemplate}</div>`
      }

      // In this specific conditions include the drilldown
      if (
        (level === 2 && subSection !== "issues") ||
        (level === 3 && section === "issues") ||
        (level === 1 && subSection === "general")
      ) {

        issueTemplate = `<div class="database-layout__grid-3 gutter-l">${issueTemplate}</div>`

        const template = `
          <section class="database-section">

            ${getDrilldownButtonsHTML({ text })}

            ${issueTemplate}

          </section>
        `;

        renderedTemplate += template + "\n\n";
      } else {
        renderedTemplate += issueTemplate + "\n\n";
      }
    }
  
    return renderedTemplate;
  }

  function wrapNodeHTML(el, wrapper) {
    el.parentNode.insertBefore(wrapper, el);
    wrapper.appendChild(el);
  }

  function wrapCanvas() {
    document.querySelectorAll("canvas").forEach(d => {
      const { classList } = d.parentElement

      if (!classList.contains("database-canvas__wrapper")) {
        const { path } = d.dataset

        const div = document.createElement('div')
        const btn = document.createElement('button')

        div.className = "database-canvas__wrapper"

        btn.className = "database-canvas__button"
        btn.innerHTML = "Download PNG"
        btn.setAttribute('data-download', path)

        wrapNodeHTML(d, div)

        div.appendChild(btn)
      }
    })
  }

  function renderCharts(charts, data, dictionary) {
    charts.forEach(element => onChartLoad(element, data, dictionary));
  }

  function renderSpecialCharts(id, data) {
    let dataFn = null
    if (id.match(/chart-summary_companies_per_revenue_range/)) {
      dataFn = revenueSummary(data)
    } else if (id.match(/chart-summary_companies_per_employees/)) {
      dataFn = employeesSummary(data)
    }

    if (dataFn) {
      loadHorizontalChart(id, dataFn);
    }
  }

  function renderGeneralSection() {
    return `
      <section id="general_results-companies-per" class="database-section">
        <span id="general" class="database-section__anchor"></span>
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
      <h4 class="database-heading__h4">Companies included in the research</h4>
      <div class="database-layout__col-3 gutter-l">
        <div>
          <span class="database-heading__span-underline">Country</span>
          <div>
            <canvas data-path="company.country_incorporation"></canvas>
          </div>
        </div>
        <div>
          <span class="database-heading__span-underline">Sector</span>
          <div>
            <canvas data-path="company.sectors"></canvas>
          </div>
        </div>
        <div>
          <span class="database-heading__span-underline">Revenue range</span>
          <div>
            <canvas id="chart-summary_companies_per_revenue_range" data-special="chart-summary_companies_per_revenue_range"></canvas>
          </div>
          <span class="database-heading__span-underline">Employees</span>
          <div>
            <canvas id="chart-summary_companies_per_employees" data-special="chart-summary_companies_per_employees"></canvas>
          </div>
        </div>
      </div>
    `;
  }

  function getFiltersHTML() {
    return `
      <div class="database-layout__flex">
        <h4 class="database-heading__h4">Summary</h4>
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

  function getDrilldownButtonsHTML({ text }) {
    return `
      <h2 class="database-heading__h2 with-decorator database-layout__flex">
        <span>${text}</span>
        <div class="database-layout__col-3 align-center gutter-l" data-drilldown-container>
          <span class="database-tag__title">Filter</span>
          <button class="database-tag" data-drilldown="country">By country</button>
          <button class="database-tag" data-drilldown="sector">By sector</button>
          <button class="database-tag" data-drilldown="revenue">By revenue</button>
        </div>
      </h2>
    `;
  }

  function getChartsContainerHTML({ text = '&nbsp;', dataPath, subSection, className = '' }) {
    return `
      <h6 class="database-heading__h6">${text}</h6>
      <div data-charts ${className ? `data-s_1 class="${className}"` : '' }>
        <div><canvas data-path="${dataPath}.${subSection}" data-dictionary="${subSection}"></canvas></div>
        <div class="database-layout__grid-2 gutter-m" data-subcharts-container></div>
      </div>
    `
  }

  function onChartLoad(element, data, dictionary, options) {
    // Get summarized data for chart and render it
    if (element.dataset.type === "summary") {
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
    } else {
      return loadHorizontalChart(
        element,
        summarizeDataFromPath(
          filterData(data),
          element.dataset.path,
          element.dataset.dictionary,
          dictionary
        ),
        options
      );
    }
  }

  function estimateMaxLengthLabel(element) {
    // Rough calculation of max chars on a line based on the width
    const container = element.closest("[data-path]")
    let maxWidth = element.width

    if (container) {
      const { width } = container.getBoundingClientRect()

      if (width) {
        maxWidth = width
      }
    }

    return Math.floor(maxWidth / 11)
  }

  function loadHorizontalChart(idOrElement, chartData, options = {}) {
    let chart;
    if (isString(idOrElement)) {
      chart = document.getElementById(idOrElement);
    } else {
      chart = idOrElement;
    }

    const maxLength = estimateMaxLengthLabel(chart)
    const columnNames = chartData.data.map(a => wrap(a[0], maxLength));
    const data = chartData.data.map(a => parseFloat(a[1]));
    const inverseData = data.map(e => maxValue - e);

    const barThickness = options.barThickness || 30;
    chart.height = columnNames.length * (barThickness + 20);

    const opts = {
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
          display: false,
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
                scaleInstance.width = chart.width * (2 / 3);
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

  function loadDrillDownChart(container, chartsData, options = {}) {
    chartsData.forEach((chartDataInfo, index) => {
      let newChart = document.createElement("div");

      newChart.className = "database-layout__flex-column"
      newChart.innerHTML = `
        <span class="database-heading__span">${chartDataInfo[0] || "-"}</span>
        <canvas></canvas>
      `;

      container.appendChild(newChart);

      const chart = newChart.querySelector("canvas");
      const chartData = chartDataInfo[1];

      const columnNames = chartData.map(a => wrap(a[0], estimateMaxLengthLabel(chart)));
      const data = chartData.map(a => parseFloat(a[1]));

      const inverseData = data.map(e => maxValue - e + 0.1);

      const barThickness = options.barThickness || 20;
      chart.height = columnNames.length * (barThickness + 8);

      const opts = {
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
                  display: false,
                  drawBorder: false,
                  drawTicks: false
                },
                ticks: {
                  display: false,
                  beginAtZero: true,
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
                  display: true
                },
                afterFit: scaleInstance => {
                  scaleInstance.width = chart.width * (2 / 3);
                }
              }
            ]
          },
          plugins: {
            datalabels: {
              anchor: "end",
              clamp: true,
              color: context =>
                context.dataset.data[context.dataIndex] < 40
                  ? "#3B5360"
                  : "#fff",
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
    });
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

    const storedFilters = localStorage.getItem('filters')
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

    const storedFilters = localStorage.getItem('filters')
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

    const storedFilters = localStorage.getItem('filters')
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

    localStorage.setItem('filters', JSON.stringify(filters))

    callback();
    return true;
  }

  function sentenceCase(str) {
    try {
      str = str.split('-').join(' ').split('_').join(' ');
      return str[0].toUpperCase() + str.slice(1).toLowerCase();
    } catch {
      
      return str;
    }
  }

  function onDrillDownButtonClick(event, data, dictionary) {
    // wrap all canvas with button
    wrapCanvas()

    const { target } = event;

    const isActive = target.classList.contains(activeClass);
    const parent = target.closest(".database-section")
    const chartsContainers = parent.querySelectorAll("[data-charts-container]")

    // Run through all containers inside element
    chartsContainers.forEach(chartsContainer => {

      const charts = chartsContainer.querySelector("[data-charts]")
      const isS1 = chartsContainer.querySelector("[data-s_1]")
      // distinguish between different markups to toggle properly the CSS classes
      if (isActive) {
        if (!isS1) {
          chartsContainer.parentElement.classList.remove("database-layout__grid-3")
          charts.classList.add("database-layout__col-2-3", "gutter-l")
        }
      } else {
        if (!isS1) {
          chartsContainer.parentElement.classList.add("database-layout__grid-3")
          charts.classList.remove("database-layout__col-2-3", "gutter-l")
        }
      }

      const chart = chartsContainer.querySelector("[data-path]");
      const subchartsContainer = chartsContainer.querySelector("[data-subcharts-container]");

      // Remove all drilldown charts for that subchart
      subchartsContainer.innerHTML = ''

      if (chart && isActive) {
        const { path, dictionary: datasetDictionary } = chart.dataset
        const { drilldown } = target.dataset

        const summarizeData = summarizeDrilldownDataFromPath(
          data,
          path,
          datasetDictionary,
          drilldown,
          dictionary
        );

        loadDrillDownChart(subchartsContainer, summarizeData);
      }
    });
  }

  function summarizeDrilldownDataFromPath(
    data,
    path,
    dictionaryKey,
    drillDownType,
    dictionary
  ) {
    let values, tempValue;
    let result = {};
    let total = {};

    if (drillDownType === "revenue") {
      values = getRevenues(data, path);
    } else {
      const groupByPath =
        drillDownType === "country" ? countriesPath : sectorsPath;
      [tempValue, values] = getValues(data, path, {
        groupBy: groupByPath,
        flatten: false
      });
    }
    // The resulting object has two levels:
    //   - the first level contains the questions
    //   - the second level contains the grouping variable (country, sector or revenue)
    let items;
    if (drillDownType === "country") {
      items = getCountries(data);
    } else if (drillDownType === "sector") {
      items = getSectors(data);
    } else {
      items = getRevenueGroups();
    }

    // Prepare result and total objects
    values.forEach(array => {
      if (array !== null) {
        // array[0]: contains the key
        // array[1]: contains the value to group by
        const key = array[0];
        const groupBykey = array[1];

        let keys = key;
        if (!Array.isArray(key)) {
          keys = [key];
        }
        keys.forEach(key => {
          if (result[key] === undefined) {
            result[key] = {};
          }
          items.forEach(item => {
            if (result[key][item] === undefined) {
              result[key][item] = 0;
            }
          });
          result[key][groupBykey]++;
        });

        if (total[groupBykey] === undefined) {
          total[groupBykey] = 0;
        }
        total[groupBykey]++;
      }
    });

    return Object.keys(result).map(question => {
      let keyTxt = question;

      if (
        dictionaryKey !== undefined &&
        dictionary[dictionaryKey] !== undefined &&
        dictionary[dictionaryKey][question] !== undefined
      ) {
        keyTxt = dictionary[dictionaryKey][question];
      }
      return [
        keyTxt,
        calculatePercentage(result[question], total, dictionaryKey, dictionary)
      ];
    });
  }

  function getRevenues(data, path) {
    const groups = getRevenueGroups();

    let values = [];
    data.forEach(d => {
      const value = resolve(d, path);
      let revenue = d.company.revenues;
      revenue = parseFloat(revenue.replace(/,/g, ""));

      if (!Number.isNaN(value)) {
        let revenueGroup = null;
        if (revenue < revenueRange0) {
          revenueGroup = groups[0];
        } else if (revenue >= revenueRange0 && revenue < revenueRange1) {
          revenueGroup = groups[1];
        } else if (revenue >= revenueRange1 && revenue < revenueRange2) {
          revenueGroup = groups[2];
        } else if (revenue >= revenueRange2 && revenue < revenueRange3) {
          revenueGroup = groups[3];
        } else if (revenue >= revenueRange3) {
          revenueGroup = groups[4];
        }
        if (revenueGroup !== null) {
          values.push([value, revenueGroup]);
        }
      }
    });
    return values;
  }

  function getRevenueGroups() {
    return [
      `< ${parseMoney(revenueRange0, true, true)}`,
      `${parseMoney(revenueRange0, true, false)} - ${parseMoney(
        revenueRange1,
        false,
        true
      )}`,
      `${parseMoney(revenueRange1, true, false)} - ${parseMoney(
        revenueRange2,
        false,
        true
      )}`,
      `${parseMoney(revenueRange2, true, false)} - ${parseMoney(
        revenueRange3,
        false,
        true
      )}`,
      `> ${parseMoney(revenueRange3, true, true)}`
    ];
  }

  function downloadCanvas({ dataset, data, dictionary }) {
    const element = document.createElement('a');
    const fakeCanvas = document.createElement('canvas')

    element.style.display = 'none';
    document.body.appendChild(element);
    document.body.appendChild(fakeCanvas);

    const ctx = fakeCanvas.getContext("2d")
    const scale = 6

    const { special } = dataset
    if (special) {
      fakeCanvas.id = `${special}-fake`
      renderSpecialCharts(`${special}-fake`, data)
    } else {
      for (const key in dataset) {
        if (dataset.hasOwnProperty(key)) {
          const element = dataset[key];
          fakeCanvas.setAttribute(`data-${key}`, element)
        }
      }
  
      // Call to render chart on a fake canvas
      onChartLoad(fakeCanvas, data, dictionary)
    }

    fakeCanvas.width = scale * fakeCanvas.width
    fakeCanvas.height = scale * fakeCanvas.height
    ctx.scale(scale, scale)

    // Wait for the chartjs-animation finishes
    setTimeout(() => {
      element.setAttribute('href', fakeCanvas.toDataURL());

      const { path = 'chart'} = dataset
      element.setAttribute('download', `${path}.png`);
    
      
      element.click();
      
      document.body.removeChild(element);
      document.body.removeChild(fakeCanvas);
    }, 500);
  }
})();
