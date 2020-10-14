(function() {
  const DEBUG = (location.origin === "http://0.0.0.0:4000") || false;

  // Store it in a global var, instead of passing through functions
  let GLOBAL_TREE = null;

  let reportYear = '';
  let materialityMatrixURL = null;

  window.addEventListener("DOMContentLoaded", loadData);

  closestPolyfill()

  Chart.defaults.global.defaultFontSize = 13;
  Chart.defaults.global.tooltips.enabled = false

  const mainColor = getComputedStyle(document.documentElement).getPropertyValue(
    "--green"
  );
  const activeClass = "active";
  const openClass = "is-open";
  const MAXVALUE = 100;
  const revenueRange0 = 3e8;
  const revenueRange1 = 1e9;
  const revenueRange2 = 3e9;
  const revenueRange3 = 2e10;
  const countriesPath = "company.country_incorporation";
  const sectorsPath = "company.sectors";
  const STATIC_DATA = {
    "general-transparency-key-issues": {
      data: [
        ["No", 52.1],
        ["Partially", 28.9],
        ["Fully", 19],
      ],
      opts: {
        labelWidth: () => 50
      }
    },
    "climate-target": {
      data: [
        ["Apparel & Textiles", 26.4],
        ["Consumption", 29.4],
        ["Energy & Resource Extraction", 36.4],
        ["Financials", 20.5],
        ["Food & Beverages", 48.4],
        ["Health Care", 32.9],
        ["Hospitality & Recreation", 26.2],
        ["Infrastructure", 46.1],
        ["Resource Transformation", 44.3],
        ["Technology & Communications", 40],
        ["Transportation", 47.6]
      ],
      opts: {
        labelWidth: () => 0,
        mirrorY: false
      }
    },
    "company-climate-target": {
      data: [
        ["Apparel & Textiles", 9.1],
        ["Consumption", 4.4],
        ["Energy & Resource Extraction", 23.5],
        ["Financials", 10.2],
        ["Food & Beverages", 20],
        ["Health Care", 6.8],
        ["Hospitality & Recreation", 9.5],
        ["Infrastructure", 17.1],
        ["Resource Transformation", 13.4],
        ["Technology & Communications", 20],
        ["Transportation", 12.48]
      ],
      opts: {
        labelWidth: () => 0,
        mirrorY: false
      }
    },
    "human-rights": {
      data: [
        ["Identified concrete operations and/or business partners associated with salient issues & impacts", 9.7],
        ["Specific examples and appropriate indicators illustrate each salient issue is being managed effectively", 3.6],
        ["Board oversight of risks and salient issues", 16],
        ["Changes in the nature of each salient human rights issue (trend & patterns in impacts) over time", 1.3],
        ["Actions that company has taken to prevent or mitigate impacts related to each salient issue", 19.4],
        ["Explicit commitment to provide remedy to harmed people", 6.9],
        ["Grievance mechanism and its application", 11]
      ],
      opts: {
        labelWidth: chart => {
          const { width = 150 } = chart.getBoundingClientRect() // enforce minimun label size
          return width * 0.6
        },
        maxLength: 60,
        fontSize: 15,
        mirrorY: false
      }
    },
    "supply-chain": {
      data: [
        ["No information on the structure of the supply chain", 67.2],
        ["General Description of high risk supply chains", 24.7],
        ["List of suppliers in high-risk supply chains", 1.7],
        ["List of individual ultimate factories was published + List of individual ultimate factories is available for download", 3.7]
      ],
      opts: {
        labelWidth: chart => {
          const { width = 150 } = chart.getBoundingClientRect() // enforce minimun label size
          return width * 0.6
        },
        maxLength: 60,
        fontSize: 15,
        mirrorY: false
      }
    }
  }
  const SUMMARY = {
    COLORS: [ "#0b2740", "#c5d8d9", "#b5725d" ],
    TOPICS: {
      2019: [
        { index: "A.1", title: "Climate change", parent: "s_A", child: "s_A1" },
        { index: "A.2", title: "Use of natural resources", parent: "s_A", child: "s_A2" },
        { index: "A.3", title: "Polluting discharges", parent: "s_A", child: "s_A3" },
        { index: "A.4", title: "Waste", parent: "s_A", child: "s_A4" },
        { index: "A.5", title: "Biodiversity and ecosystem conservation", parent: "s_A", child: "s_A5" },
        { index: "B.1", title: "Employee and workforce matters", parent: "s_B", child: "s_B1" },
        { index: "C.0", title: "General Human Rights Reporting Criteria", parent: "s_C", child: "s_C0" },
        { index: "C.1", title: "Supply Chains Management", parent: "s_C", child: "s_C1" },
        { index: "C.2", title: "Impacts on indigenous and/or local communities rights", parent: "s_C", child: "s_C2" },
        { index: "C.3", title: "Hight risk areas for Civil & Political rights", parent: "s_C", child: "s_C3" },
        { index: "C.4", title: "Conflict resources (minerals, timber, etc.)", parent: "s_C", child: "s_C4" },
        { index: "C.5", title: "Data protection / Digital rights", parent: "s_C", child: "s_C5" },
        { index: "D.1", title: "Anti-corruption", parent: "s_D", child: "s_D1" },
        { index: "D.2", title: "Whistleblowing channel", parent: "s_D", child: "s_D2" },
      ],
      2020: [
        { index: "A.1", title: "Climate change", parent: "s_A", child: "s_A1" },
        { index: "A.2", title: "Use of natural resources", parent: "s_A", child: "s_A2" },
        { index: "A.3", title: "Polluting discharges", parent: "s_A", child: "s_A3" },
        { index: "A.4", title: "Biodiversity and ecosystem conservation", parent: "s_A", child: "s_A4" },
      ]
    }
  }
  const MAP = {
    COLORS: [ "#cdf0d5", "#87dac0", "#23a9ce", "#0087c3", "#214591" ],
    DATA: {
      2019: {
        GB: 168,
        FR: 127,
        DE: 108,
        IT: 70,
        ES: 67,
        PL: 64,
        SE: 61,
        NL: 52,
        FI: 39,
        DK: 34,
        BE: 30,
        AT: 21,
        LU: 20,
        IE: 20,
        GR: 16,
        SK: 10,
        RO: 11,
        PT: 11,
        HU: 11,
        CZ: 10,
        LT: 9,
        EE: 9,
        HR: 9,
        SI: 8,
        LV: 5,
        CY: 5,
        BG: 4,
        MT: 1,
      },
      2020: {
        BG: 8,
        HR: 15,
        CY: 1,
        CZ: 11,
        GR: 19,
        HU: 8,
        IT: 77,
        PL: 73,
        RO: 15,
        SK: 8,
        SI: 11,
        ES: 58
      },
    },
  };

  const path = location.pathname.replace(/\//g,'')
  const { country = [], sector = [], revenues = [] } = JSON.parse(localStorage.getItem(`filters-${path}`)) || {}
  const filters = {
    country,
    sector,
    revenues
  };

  // Private functions
  function loadData() {
    const containers = document.querySelectorAll("[data-year]")
    const yearSelector = document.querySelector("[data-select-year]")

    if (yearSelector) {
      reportYear = yearSelector.value

      if (containers) {
        containers.forEach((block) =>
          block.dataset.year !== reportYear
            ? (block.style.display = "none")
            : (block.style.display = "block")
        );
      }
    } else {
      const [{ dataset: { year } = {} } = {}] = containers
      reportYear = year
    }

    const reportYearParsed = reportYear === '2020' ? '2020' : ''

    const dictionaryUrl = DEBUG
      ? `../static_data/mock_dictionary${reportYearParsed}.json`
      : `https://act-export.frankbold.org/dictionary${reportYearParsed}.json`;
    const reportsUrl = DEBUG
      ? `../static_data/mock_reports${reportYearParsed}.json`
      : `https://act-export.frankbold.org/reports${reportYearParsed}.json`;

    const spinner = document.querySelector("[data-spinner]")
    if (spinner) {
      spinner.style.display = 'block'
    }

    getJSON(dictionaryUrl, dictionary => {
      getJSON(reportsUrl, data => {
        if (spinner) {
          spinner.style.display = 'none'
        }

        // Update sector names using the dictionary keys
        data.forEach(d => {
          d.company.sectors = d.company.sectors.map(d => dictionary[d]);
        });

        tree = getTree(data);

        GLOBAL_TREE = tree

        // set url for PDF
        materialityMatrixURL = document.querySelector("input[type='hidden'][name='materiality_matrix']").value

        // Load sidebar
        const sidebar = document.querySelector("[data-sidebar]");
        if (sidebar) {
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
  
          // set active the matching item
          const currentItem = lis.item(i)
          currentItem.classList.add(activeClass);
  
          const parentLi = currentItem.parentElement.closest("li")
          if (parentLi) {
            parentLi.querySelector("ul").classList.add(openClass)
          }
          
          // open submenu if there are
          const submenu = currentItem.querySelector("ul")
          if (submenu) {
            submenu.classList.add(openClass)
          }
  
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
  
          // scroll listener
          document.addEventListener('scroll', (e) => {
            const submenu = document.querySelector("[data-sidebar] > ul > li > ul.is-open")
  
            if (submenu) {
              const anchors = submenu.querySelectorAll("a")
              const hashes = [...anchors].map(d => d.hash)
  
              hashes.forEach(hash => {
                const element = document.getElementById(hash.slice(1)).parentElement
                const { top, height } = element.getBoundingClientRect()
  
                if ((top > -300 && top < 300) || (top + height < 300 && top + height > -300)) {
                  const parentActive = document.querySelector("[data-sidebar] > ul > li.active")
                  if (parentActive) {
                    parentActive.classList.remove(activeClass)
                  }
  
                  anchors.forEach(a => a.parentElement.classList.remove(activeClass));
                  const sidebarAnchor = [...anchors].find(d => d.hash === hash)
                  sidebarAnchor.parentElement.classList.add(activeClass)
                }
              })
            }
          })
        }

        // Load summaryTable
        const summaryTable = document.querySelector(`[data-year='${reportYear}'] [data-summary-table]`);
        if (summaryTable) {
          let template = "";
          template += getFiltersHTML()
          template += getGeneralSectionLegendHTML()
          template += getGeneralSectionChartsHTML()

          summaryTable.innerHTML = template

          const charts = summaryTable.querySelectorAll("[data-path]");
          // render charts
          renderCharts(charts, data);

          const callback = event => {
            onFilterSelected(event, () => {
              const charts = summaryTable.querySelectorAll("[data-path]");
              if (charts.length) {
                renderCharts(charts, data);
              }
            });
          }

          // Assign behaviour to filters
          fillFilters(data, callback)

          const yearSelector = document.querySelector("[data-select-year]")
          if (yearSelector) {
            yearSelector.addEventListener("change", loadData)
          }
        }

        const europes = document.querySelectorAll("[data-map]")
        if (europes.length) {
          getJSON(`../static_data/europe.json`, topology => europes.forEach(eu => drawMap(topology, eu)))
        }
      });
    });
  }

  function drawMap(topology, europe) {
    europe.innerHTML = "";
    const container = d3.select(europe).attr("style", "position: relative");
    const { width } = container.node().getBoundingClientRect();
    const height = width * 0.5;
    const map = container
      .append("svg")
      .attr("width", width)
      .attr("height", height);
    const g = map.append("g");
    container
      .append("div")
      .attr("id", "tooltip")
      .attr("style", "position: absolute; opacity: 0;");

    const geojson = topojson.feature(topology, topology.objects.europe);
    const projection = d3.geoConicConformal().fitSize([width, height], geojson);
    const path = d3.geoPath(projection);

    // populate topojson with displayed data
    const { map: mapYear } = europe.dataset
    const mapData = geojson.features.reduce((acc, item) => {
      const value = MAP.DATA[mapYear][item.id];
      value
        ? acc.push({ ...item, properties: { ...item.properties, value } })
        : acc.push(item);
      return acc;
    }, []);

    // helpers to set the polygons color
    const [min, max] = d3.extent(Object.values(MAP.DATA[mapYear]));
    const colorStep = (max - min) / (MAP.COLORS.length - 1);
    const color = (value) => MAP.COLORS[Math.floor(value / colorStep)];

    const regions = g.selectAll(".region").data(mapData);
    regions.exit().remove();

    const regionsEnter = regions.enter().append("path");
    regions
      .merge(regionsEnter)
      .attr("d", path)
      .attr("class", "region")
      .attr("fill", ({ properties: { value } = {} }) =>
        value !== undefined ? color(value) : "#eee"
      )
      .on("mousemove", (e, { properties: { NAME = "", value } = {} }) => {
        if (value !== undefined) {
          const [left, top] = d3.pointer(e);

          d3.select(`[data-map="${mapYear}"] #tooltip`)
            .style("opacity", 1)
            .style("left", `${left + 10}px`)
            .style("top", `${top + 10}px`)
            .style("background-color", "#fff")
            .style("padding", "10px")
            .style("font-size", "11px")
            .style("border", "1px solid whitesmoke")
            .style("box-shadow", "3px 3px 3px rgba(0,0,0,0.1)")
            .style("z-index", 100)
            .text(`${NAME} - Companies: ${value}`);

          d3.select(e.target).attr("stroke-width", 1).attr("stroke", "#333");
          e.target.parentNode.appendChild(e.target);
        }
      })
      .on("mouseout", ({ target }) => {
        d3.select(`[data-map="${mapYear}"] #tooltip`).style("opacity", 0);
        d3.select(target).attr("stroke-width", 0);
        target.parentNode.insertBefore(target, target.parentNode.firstChild);
      });

    // borders
    const mesh = topojson.mesh(topology, topology.objects.europe);
    g.append("path")
      .datum(mesh)
      .attr("fill", "none")
      .attr("stroke", "white")
      .attr("stroke-linejoin", "round")
      .attr("d", path);

    // legend
    const legendGroup = g.append("g");
    const legend = legendGroup
      .selectAll(".legend")
      .data(d3.ticks(min, max, 3).reverse());
    legend.exit().remove();

    const legendsEnter = legend.enter().append("g");
    const legendBlock = legend.merge(legendsEnter).attr("class", "legend");

    const itemSize = 15;
    legendBlock
      .append("rect")
      .attr("x", width - 100)
      .attr("y", (_, i) => (i + 1) * itemSize + (i * itemSize) / 3)
      .attr("width", itemSize)
      .attr("height", itemSize)
      .attr("fill", (d) => color(d));

    legendBlock
      .append("text")
      .attr("x", width - 100 + itemSize + 5)
      .attr("y", (_, i) => (i + 1) * itemSize + (i * itemSize) / 3)
      .attr("dy", (3 / 4) * itemSize)
      .attr("font-size", "11px")
      .text((d) => d);
  }

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

    // split the data array into minor chunks to speed up the merge
    const chunks = 50;
    const part = [];
    for (let index = 0; index < chunks; index++) {
      part.push(
        deepmerge.all(
          data.slice(
            index * (data.length / chunks),
            index * (data.length / chunks) + data.length / chunks - 1
          )
        )
      );
    }

    let tree = deepmerge.all(part);

    // section C keys are not sorted, we need to sort them
    // in the final tree
    if (tree.hasOwnProperty("s_C")) {
      let sectionC = {};
      Object.keys(tree["s_C"])
        .sort()
        .forEach(key => {
          sectionC[key] = tree["s_C"][key];
        });
      tree["s_C"] = sectionC;
    }

    // section E keys are not sorted, we need to sort them
    // in the final tree
    if (tree.hasOwnProperty("s_E") && tree["s_E"].hasOwnProperty("s_E_products")) {
      let sectionEProducts = {};
      Object.keys(tree["s_E"]["s_E_products"])
        .sort()
        .forEach(key => {
          sectionEProducts[key] = tree["s_E"]["s_E_products"][key];
        });
      tree["s_E"]["s_E_products"] = sectionEProducts;
    }

    return tree;
  }

  function loadTOC(tree, dictionary) {
    let result = "";

    const ul = html => `<ul>${html}</ul>`
    const li = html => `<li>${html}</li>`
    const a = (section, text) => `<a href="#${section}">${text}</a>`;
    const url = (url, text) => `<a href="${url}" target="_blank" data-trigger-modal>${text}</a>`;

    result += li(a("general", "General Results"));

    Object.keys(tree).forEach(section => {
      let text =
        dictionary[section] !== undefined ? dictionary[section].text : section;

      let block = "";
      if (section !== "company") {
        block += a(section, text);

        if (section !== "s_1") {
          block += loadChildrenTOC(tree, section, dictionary)
        }

        result += li(block)
      }
    });

    const reportURL = document.querySelector(`input[type='hidden'][name='report-${reportYear}']`).value
    result += li(url(reportURL, "Research Report (PDF)"))

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

        if (section === "s_2b") {

          const template = `
            <section class="database-section database-section__margin-xl">
              <span id="${subSection}" class="database-section__anchor"></span>
              
              ${getDrilldownButtonsHTML({ text: sectionText })}

              ${block}

            </section>
          `;

          renderedTemplate += template;
        } else if (isObject(tree[section][subSection]) && section !== "s_1") {
          let materiality = '';

          if (reportYear === '2019') {
            materiality = `<a href="${materialityMatrixURL}" class="database-heading__h1-link" target="_blank">See materiality matrix</a>`
          }

          renderedTemplate += `
            <section class="database-section">
              <span id="${subSection}" class="database-section__anchor"></span>
              <h1 class="heading__h1 with-decorator">
                ${sectionText}
                ${materiality}
              </h1>
              ${block}
            </section>
          `;
        } else {
          renderedTemplate += block;
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

    // chart title heights
    const h2 = document.querySelectorAll("h2.database-heading__h2")
    h2.forEach(element => {
      const chartsBlock = element.nextElementSibling
      if (chartsBlock) {
        // split the charts by gorups of 3 elements
        const h6Group = chunk(Array.from(chartsBlock.querySelectorAll("[data-charts-container] h6")), 3)
        if (h6Group.length) {
          h6Group.forEach(h6 => {
            const minHeight = Math.max(...h6.map(elem => elem.getBoundingClientRect().height))
            h6.forEach(elem => (elem.style.minHeight = `${minHeight}px`))
          })
        }
      }
    })

    const callback = event => {
      onFilterSelected(event, () => {
          const charts = content.querySelectorAll("[data-path]");
          if (charts.length) {
            renderCharts(charts, data, dictionary);
          }
      });
    };
    
    // Assign behaviour to filters
    fillFilters(data, callback)
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
          <section class="database-section database-section__margin-xl">

            ${getDrilldownButtonsHTML({ text })}

            <div data-charts-container>
              ${getChartsContainerHTML({ dataPath, subSection, className })}
            </div>

          </section>
        `;

        renderedTemplate += template + "\n\n";
      } else if (level >= 2 && level < 5) {

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
      if (level === 2 && subSection === "issues") {
        issueTemplate += `
          <section class="database-section__margin-s">
            <h2 class="database-heading__h2">Specific issues & impacts</h2>
          </section>
          `;
      }

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
        issueTemplate = `<div class="database-layout__grid-3 gutter-xl">${issueTemplate}</div>`
      }

      // In this specific conditions include the drilldown
      if (
        (level === 2 && subSection !== "issues") ||
        (level === 3 && section === "issues") ||
        (level === 1 && subSection === "general")
      ) {

        issueTemplate = `<div class="database-layout__grid-3 gutter-xl">${issueTemplate}</div>`

        const template = `
          <section class="database-section database-section__margin-xl">

            ${getDrilldownButtonsHTML({ text })}

            ${issueTemplate}

          </section>
        `;

        renderedTemplate += template + "\n\n";
      } else {
        renderedTemplate += issueTemplate + "\n\n";
      }
    }

    if (level === 2 && section === "s_E_products") {
      renderedTemplate += `
        <section class="database-section__margin-s">
          <h2 class="database-heading__h2">Specific issues & impacts</h2>
        </section>
      `;

      Object.keys(tree[section][subSection]["issues"]).forEach(question => {
        renderedTemplate += renderSubsection(
          tree[section][subSection],
          "issues",
          question,
          data,
          3,
          `${dataPath}.${subSection}.issues`,
          dictionary
        );
      });
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

  function renderStaticCharts(charts) {
    charts.forEach(chart => {
      const { staticPath } = chart.dataset
      const { data, opts } = STATIC_DATA[staticPath]
      loadHorizontalChart(chart, { data }, opts);
    })
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
      <section class="database-section database-section__margin-xl database-canvas__fit">
        <span id="general" class="database-section__anchor"></span>
        ${getFiltersHTML()}
        ${getGeneralSectionLegendHTML()}
        ${getGeneralSectionChartsHTML()}
      </section>
      <section id="general_results-companies-per" class="database-section__margin-xl database-canvas__fit">
        ${getCompaniesPerHTML()}
      </section>
    `;
  }

  function getGeneralSectionLegendHTML() {
    const option = (option, color) => `
      <div class="database-summary__legend--option">
        <span style="background: ${color}"></span>
        <span class="database-summary__legend--label">${option}</span>
      </div>
    `
    const o = (titles, color) => {
      let options = ''
      for (let i = 0; i < titles.length; i++) {
        const opt = titles[i];
        options += option(opt, color)
      }
      return `<div class="database-summary__legend--column">${options}</div>`
    };

    const t = title => `<div class="database-summary__legend--title">${title}</div>`

    const items = {
      titles: ["Policies", "Risks", "Outcomes"],
      options: [
        {
          titles: [
            "Policy description specifies key issues and objectives",
            "Description of specific risks",
            "Outcomes in terms of meeting policy targets",
          ],
          color: SUMMARY.COLORS[0],
        },
        {
          titles: [
            "Policy is described or referenced",
            "Vague risks identification",
            "Description provided",
          ],
          color: SUMMARY.COLORS[1],
        },
        {
          titles: [
            "No information provided",
            "No risks identification",
            "No description",
          ],
          color: SUMMARY.COLORS[2],
        },
      ],
    };

    let titles = ''
    for (let i = 0; i < items.titles.length; i++) {
      const element = items.titles[i];
      titles += t(element)
    }

    let options = ''
    for (let i = 0; i < items.options.length; i++) {
      const { titles, color } = items.options[i];
      options += o(titles, color)
    }

    return `
      <div class="database-summary__legend">
        <div>
          <div class="database-summary__legend--column">
            ${titles}
          </div>
        </div>
        <div>${options}</div>
      </div>
      <div class="database-tabcontent__label">
        <span>% percentage of total</span>
      </div>
    `
  }

  function getGeneralSectionChartsHTML() {
    const template = (index, title, path) => `
      <div class="database-tabcontent__label">
        <p><span>${index}</span> ${title}</p>
      </div>
      <div class="database-tabcontent__row">
        <canvas data-path="${path}" data-type="summary"></canvas>
      </div>
    `

    // global variable
    const topics = SUMMARY.TOPICS[reportYear || 2019];

    // different first-level sections
    const parents = unique(topics.map(({ parent }) => parent))

    let sections = '';
    for (let i = 0; i < parents.length; i++) {
      const parent = parents[i];

      if (GLOBAL_TREE.hasOwnProperty(parent)) {
        const topic = topics.filter(d => d.parent === parent)

        for (let j = 0; j < topic.length; j++) {
          const { index, title, child } = topic[j];
          
          if (GLOBAL_TREE[parent].hasOwnProperty(child)) {
            sections += template(index, title, `${parent}.${child}`)
          }
        }
      }
    }

    return sections
  }

  function getCompaniesPerHTML() {
    return `
      <h4 class="heading__h4">Companies included in the research</h4>
      <div class="database-layout__col-2-3 gutter-l">
        <div>
          <span class="database-heading__span-underline">Sector (absolute numbers)</span>
          <div>
            <canvas data-path="company.sectors" data-exclude-filter data-absolute data-sort></canvas>
          </div>
        </div>
        <div data-map="${reportYear}"></div>
      </div>
    `;
  }

  function getFiltersHTML() {
    let materiality = '';

    if (reportYear === '2019') {
      materiality = `<a href="${materialityMatrixURL}" class="database-heading__h1-link" target="_blank">See materiality matrix</a>`
    }

    return `
      <div class="database-layout__flex">
        <h4 class="heading__h4">
          Summary
          ${materiality}
        </h4>
        ${getFiltersBlock()}
      </div>
    `;
  }

  function getFiltersBlock() {
    return `
      <div class="database-layout__col-3 gutter-xl" style="position: relative;">
        <div>
          <select data-filter="sector" id="filter-sector" multiple>
          </select>
        </div>
        <div>
          <select data-filter="revenues" id="filter-revenues" multiple>
          </select>
        </div>
        <div>
          <select data-filter="country" id="filter-country" multiple>
          </select>
        </div>
        <div class="database-filters__info">
          <i class="fa fa-info-circle"></i>
          <div class="database-filters__info-text">
            These filters will enable you to view the results for the option selected across the whole database. Please note that individual drilldowns are also included in each section. For aggregated data, please make sure no sector is selected in the main filter
          </div>
        </div>
      </div>
    `
  }

  function getDrilldownButtonsHTML({ text }) {
    return `
      <h2 class="database-heading__h2 with-decorator database-layout__flex">
        <span>${text}</span>
        <div class="database-layout__col-3 align-center gutter-l" data-drilldown-container>
          <span class="database-tag__title">Comparative results</span>
          <button class="database-tag" data-drilldown="country">By country</button>
          <button class="database-tag" data-drilldown="sector">By sector</button>
          <button class="database-tag" data-drilldown="revenue">By revenue</button>
        </div>
      </h2>
    `;
  }

  function getChartsContainerHTML({ text = '', dataPath, subSection, className = '' }) {
    return `
      <h6 class="heading__h6">${text}</h6>
      <div data-charts ${className ? `data-s_1 class="${className}"` : '' }>
        <div><canvas data-path="${dataPath}.${subSection}" data-dictionary="${subSection}"></canvas></div>
        <div class="database-layout__grid-2 gutter-m" data-subcharts-container></div>
      </div>
    `
  }

  function onChartLoad(element, data, dictionary, options = {}) {
    // Get summarized data for chart and render it
    const { dataset } = element

    let opts = options
    
    if (dataset.absolute !== undefined) {
      opts.absolute = true
    }

    if (dataset.sort !== undefined) {
      opts.sort = true
    }

    if (dataset.barThickness !== undefined) {
      opts.barThickness = Number(dataset.barThickness)
    }

    if (dataset.mirrorX !== undefined) {
      opts.mirrorX = dataset.mirrorY === '' || dataset.mirrorX === 'true'
    }

    if (dataset.mirrorY !== undefined) {
      opts.mirrorY = dataset.mirrorY === '' || dataset.mirrorY === 'true'
    }

    let filter = true
    if (dataset.excludeFilter !== undefined) {
      filter = false
    }

    if (element.dataset.type === "summary") {
      return loadSummaryChart(
        element,
        summaryChartData(
          filter ? filterData(data) : data,
          dataset.path
        ),
        opts
      );
    } else {
      return loadHorizontalChart(
        element,
        summarizeDataFromPath(
          filter ? filterData(data) : data,
          dataset.path,
          dataset.dictionary,
          dictionary,
          data,
          opts
        ),
        opts
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

    const maxLength = options.maxLength || estimateMaxLengthLabel(chart)
    const columnNames = chartData.data.map(a => wrap(a[0], maxLength));
    const data = chartData.data.map(a => parseFloat(a[1]));
    const maxValue = options.absolute ? Math.max(...data) : MAXVALUE
    const inverseData = data.map(e => maxValue - e);

    const barThickness = options.barThickness || 40;
    const mirrorX = options.mirrorX !== undefined ? options.mirrorX : false;
    const mirrorY = options.mirrorY !== undefined ? options.mirrorY : true;

    chart.height = Math.max(2.25 * barThickness, columnNames.length * (barThickness + 20)); // force a minimal height
    chart.width = chart.getBoundingClientRect().width

    const labelWidth = options.labelWidth !== undefined ? options.labelWidth : (chart => {
      const { width = 150 } = chart.getBoundingClientRect() // enforce minimun label size
      return width * (2 / 3)
    })
    const fontSize = options.fontSize || Chart.defaults.global.defaultFontSize

    let tooltipConf = {
      enabled: false
    };
    if (chartData.data.some(d => d.length > 2)) {
      tooltipConf = {
        enabled: true,
        position: "nearest",
        mode: "nearest",
        intersect: true,
        callbacks: {
          title: (data) => {
            const [element] = data;
            const { label: id } = element;
            const [, , text] = chartData.data.find(arr => arr[0] === id);
            return wrap(text, maxLength * 1.4, false);
          },
          label: () => null
        }
      };
    }

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
              categoryPercentage: 1.0,
              barPercentage: 1.0,
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
                mirror: mirrorX,
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
              ticks: {
                fontSize: fontSize,
                fontStyle: 200,
                mirror: mirrorY,
              },
              afterFit: scaleInstance => {
                const width = labelWidth(chart);
                scaleInstance.width = width;
                scaleInstance.options.ticks.padding = width;
              }
            }
          ]
        },
        tooltips: tooltipConf,
        plugins: {
          datalabels: {
            anchor: "end",
            offset: context =>
              context.dataset.data[context.dataIndex] < 50 ? 0 : 10,
            color: context =>
              context.dataset.data[context.dataIndex] < 50 ? "#3B5360" : "#fff",
            align: context =>
              context.dataset.data[context.dataIndex] < 50 ? "end" : "start",
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

    const data = chartData.data;
    debugger
    const barThickness = options.barThickness || 50;
    const fontSize = options.fontSize || Chart.defaults.global.defaultFontSize

    let columnNames = ["Policies", "Risks", "Outcomes"];
    let datasets = [
      {
        data: data[0],
        backgroundColor: SUMMARY.COLORS[0],
        barPercentage: 0.9,
        maxBarThickness: barThickness,
      },
      {
        data: data[1],
        backgroundColor: SUMMARY.COLORS[1],
        barPercentage: 0.9,
        maxBarThickness: barThickness,
      },
      {
        data: data[2],
        backgroundColor: SUMMARY.COLORS[2],
        barPercentage: 0.9,
        maxBarThickness: barThickness,
      },
    ];

    const nullIndexes = data.map(d => d.findIndex(f => Number.isNaN(f)))
    const indexToDelete = nullIndexes.every(d => d > -1 && d === nullIndexes[0]) ? nullIndexes[0] : null;

    if (indexToDelete !== null) {
      columnNames.splice(indexToDelete, 1)
      datasets.map(d => {
        const { data } = d
        data.splice(indexToDelete, 1)
        return { ...d, data }
      })
    }

    chart.height = columnNames.length * (barThickness + 6);
    chart.width = chart.getBoundingClientRect().width

    const lessThan = ctx => ctx.dataset.data[ctx.dataIndex] < 5
    const nextLessThan = ctx => (data[ctx.datasetIndex + 1] || [])[ctx.dataIndex] < 5

    const opts = {
      type: "horizontalBar",
      data: {
        labels: columnNames,
        datasets,
      },
      plugins: [ChartDataLabels],
      options: {
        responsive: false,
        maintainAspectRatio: false,
        legend: {
          display: false,
        },
        layout: {
          padding: {
            left: -10,
            right: 0,
            top: 0,
            bottom: 0,
          },
        },
        scales: {
          xAxes: [
            {
              stacked: true,
              gridLines: {
                drawBorder: false,
                drawTicks: false,
              },
              ticks: {
                display: false,
                beginAtZero: false,
                precision: 0,
                max: MAXVALUE,
              },
            },
          ],
          yAxes: [
            {
              stacked: true,
              gridLines: {
                display: false,
              },
              ticks: {
                fontSize: fontSize,
                fontStyle: 200,
                padding: chart.width * (1 / 4) - 40,
                mirror: true
              },
              afterFit: (scaleInstance) => {
                scaleInstance.width = chart.width * (1 / 4);
                // scaleInstance.options.ticks.padding = chart.width * (1 / 4) - 40;
              },
            },
          ],
        },
        plugins: {
          datalabels: {
            anchor: "start",
            offset: (context) => {
              if (
                context.datasetIndex === 1 && lessThan(context) && nextLessThan(context)
              )
                return 8;
              if (
                context.datasetIndex !== 0 &&
                (lessThan(context) || nextLessThan(context))
              )
                return 0;
              if (
                context.datasetIndex !== 0 &&
                context.dataset.data[context.dataIndex] < 6
              )
                return 2;
              return 8;
            },
            color: (context) => {
              if (
                (context.datasetIndex === 1 &&
                  !lessThan(context) &&
                  !nextLessThan(context)) ||
                (context.datasetIndex === 2 && lessThan(context))
              )
                return "#3B5360";
              return "#fff";
            },
            align: (context) => {
              if (
                context.datasetIndex !== 0 &&
                (lessThan(context) || nextLessThan(context))
              )
                return "start";
              return "end";
            },
            font: {
              weight: "bold",
            },
            clip: true,
            formatter: (value, ctx) => {
              if (ctx.dataset.hiddenLabel) {
                return null;
              } else {
                return value;
              }
            },
          },
        },
      },
    };

    new Chart(chart, opts);
  }

  function loadDrillDownChart(container, chartsData, options = {}) {
    chartsData.forEach((chartDataInfo, index) => {
      let newChart = document.createElement("div");

      newChart.className = "database-layout__flex-column"
      newChart.innerHTML = `
        <span class="heading__span thick muted">${chartDataInfo[0] || "-"}</span>
        <canvas></canvas>
      `;

      container.appendChild(newChart);

      const chart = newChart.querySelector("canvas");
      const chartData = chartDataInfo[1];

      const columnNames = chartData.map(a => wrap(a[0], estimateMaxLengthLabel(chart)));
      const data = chartData.map(a => parseFloat(a[1]));

      const inverseData = data.map(e => MAXVALUE - e + 0.1);

      const barThickness = options.barThickness || 20;
      chart.height = Math.max(2.25 * barThickness, columnNames.length * (barThickness + 8)); // force a minimal height
      chart.width = chart.getBoundingClientRect().width

      const fontSize = options.fontSize || Chart.defaults.global.defaultFontSize

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
                  max: MAXVALUE
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
                  display: true,
                  fontSize: fontSize,
                  fontStyle: 200,
                  mirror: true
                },
                afterFit: scaleInstance => {
                  const { width = 150 } = chart.getBoundingClientRect() // enforce minimun label size
                  scaleInstance.width = width * (2 / 3);
                  scaleInstance.options.ticks.padding = width * (2 / 3);
                }
              }
            ]
          },
          plugins: {
            datalabels: {
              anchor: "end",
              clamp: true,
              color: context =>
                context.dataset.data[context.dataIndex] < 50
                  ? "#3B5360"
                  : "#fff",
              align: context =>
                context.dataset.data[context.dataIndex] < 50 ? "end" : "start",
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

  function summaryChartData(data, chart) {
    // Differenciate the possible options
    let resultByOptions = { 1: {}, 2: {}, 3: {}};
    let total = {};

    const paths = ["policies.policy", "risks.risk", "outcomes_wrapper.outcomes"]
    const [parent, question] = chart.split(".") || []
    const element = (GLOBAL_TREE[parent] || {})[question];

    if (element) {
      for (let i = 0; i < paths.length; i++) {
        const path = paths[i];
        // init counters
        total[path] = 0
        resultByOptions[1][path] = 0
        resultByOptions[2][path] = 0
        resultByOptions[3][path] = 0

        for (let j = 0; j < data.length; j++) {
          const company = data[j];

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

          if (value) {
            // Only count if the value is present
            resultByOptions[value][path]++;
            total[path]++;
          }
        }
      }
    }

    const transpose = arr => arr.map((_, col) => arr.map(row => row[col]));
    const unsorted = Object.values(resultByOptions).map(x => Object.keys(x).map(y => decimalRound(100 * x[y] / total[y])))
    const sorted = transpose(transpose(unsorted).map(x => x.sort((a, b) => b > a)))

    return {
      data: sorted
    };
  }

  function decimalRound(num, decimals) {
    const pow = Math.pow(10, decimals || 1)
    return Math.round((num + Number.EPSILON) * pow) / pow
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

      const { absolute: isAbsolute = false } = options
      const value = isAbsolute ? data[key] : percentage(data[key], isObject(total) ? total[key] : total)

      const element = [keyTxt, value];

      // Has label
      if (dictionary && dictionaryKey && dictionary[`${dictionaryKey}_info`]) {
        const { text } = dictionary[`${dictionaryKey}_info`]
        element.push(text)
      }

      return element;
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

  function summarizeDataFromPath(data, path, dictionaryKey, dictionary, originalData, options) {
    let result = {};
    let total, values;

    [total, values] = getValues(data, path, { flatten: true });

    values.forEach(value => {
      if (result[value] === undefined) {
        result[value] = 0;
      }
      result[value]++;
    });

    const [_, values1] = getValues(originalData, path, { flatten: true });
    let result1 = {}
    values1.forEach(value => {
      result1[value] = 0;
    });

    // first merge the original data with 0, and then the real object, to be updated
    let combined = { ...result1, ...result }

    // In case of some data values are null/undefined/non-existant, but they do in dictionary
    if (dictionary && dictionary[dictionaryKey]) {
      const availableOptions = Object.keys(dictionary[dictionaryKey]).filter(Number);
      const currentOptions = Object.keys(combined);
      if (availableOptions.length > currentOptions.length) {
        const intersection = (a, b) => a.filter((value) => !b.includes(value));
        combined = intersection(availableOptions, currentOptions).reduce((acc, item) => ({ ...acc, [item]: 0 }), combined)
      }
    }

    return {
      data: calculatePercentage(combined, total, dictionaryKey, dictionary, options)
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

  function wrap(str, limit, ellipsis = true) {
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
        if (aux.length === 3 && ellipsis) {
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

  function fillFilters(data, callback) {
    fillSectorsFilter(data);
    fillRevenuesFilter(data);
    fillCountriesFilter(data);

    const filters = [
      { id: "sector", placeholder: "Select a sector..." },
      { id: "revenues", placeholder: "Select a revenue..." },
      { id: "country", placeholder: "Select a country..." },
    ];

    const multiselects = []
    filters.forEach(({ id, placeholder }) => {
      // Run multiselect.js
      const element = document.multiselect(`[data-year='${reportYear}'] #filter-${id}`);

      element._items.forEach(({ id: itemId, multiselectElement }) => {
        multiselectElement.setAttribute("data-filter", id)
        element.setCheckBoxClick(itemId, e => { element._hideList(element); callback(e) })
      })

      // add the placeholder to the new input field
      document.getElementById(`filter-${id}_input`).setAttribute("placeholder", placeholder)

      multiselects.push(element)
      const node = document.getElementById(element._getIdentifier())
      node.addEventListener("click", ({ target }) => {
        const select = ((target.parentElement || {}).parentElement || {}).previousElementSibling
        if (select) {
          multiselects.forEach(x => (x._item !== select) ? x._hideList(x) : x._showList(x));
        }
      });
    })

    document.addEventListener('click', ({ target }) => {
      if (!multiselects.some(x => x._item.contains(target))) {
        multiselects.forEach(x => x._hideList(x))
      }
    })
  }

  function fillCountriesFilter(data) {
    let element = document.querySelector(`[data-year='${reportYear}'] #filter-country`);

    const storedFilters = localStorage.getItem(`filters-${path}`)
    if (storedFilters) {
      const { country } = JSON.parse(storedFilters)
      filters.country = country
    }

    getCountries(data).forEach(country => {
      const option = document.createElement("option");
      option.text = country;
      option.value = country;

      if (filters.country.includes(country)) {
        option.selected = true
      }

      element.appendChild(option);
    });
  }

  function fillSectorsFilter(data) {
    let element = document.querySelector(`[data-year='${reportYear}'] #filter-sector`);

    const storedFilters = localStorage.getItem(`filters-${path}`)
    if (storedFilters) {
      const { sector } = JSON.parse(storedFilters)
      filters.sector = sector
    }

    getSectors(data).forEach(sector => {
      const option = document.createElement("option");
      option.text = sector;
      option.value = sector;

      if (filters.sector.includes(sector)) {
        option.selected = true
      }

      element.appendChild(option);
    });
  }

  function fillRevenuesFilter() {
    let element = document.querySelector(`[data-year='${reportYear}'] #filter-revenues`);

    const storedFilters = localStorage.getItem(`filters-${path}`)
    if (storedFilters) {
      const { revenues } = JSON.parse(storedFilters)
      filters.revenues = revenues
    }

    getRevenuesFilters().forEach(range => {
      const option = document.createElement("option");
      option.text = range[0];
      option.value = range[1];

      if (filters.revenues.includes(range[1])) {
        option.selected = true
      }

      element.appendChild(option);
    });
  }

  function getCountries(data) {
    return unique(data.map(d => resolve(d, countriesPath))).filter(Boolean).sort();
  }

  function getSectors(data) {
    return unique(flatten(data.map(d => resolve(d, sectorsPath)))).filter(Boolean).sort();
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
        if (filters.country.length && !filters.country.includes(company.company.country_incorporation)) {
          return;
        }

        if (filters.sector.length && company.company.sectors !== undefined && !filters.sector.some(d => company.company.sectors.includes(d))) {
          return;
        }

        if (
          filters.revenues.length &&
          company.company.revenues !== undefined
        ) {
          const revenues = parseFloat(company.company.revenues.replace(/,/g, ""));
          const ranges = filters.revenues.map(a => a.split("-").map(d => parseFloat(d)))

          if (!ranges.some(([min, max]) => revenues >= min && revenues <= max)) {
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
    const { val, filter } = event.dataset;
    const arr = filters[filter]

    if (arr) {
      const ix = arr.indexOf(val)
      
      ix > -1 ? arr.splice(ix, 1) : arr.push(val);
      filters[filter] = arr
  
      localStorage.setItem(`filters-${path}`, JSON.stringify(filters))
  
      callback();
    }

    return true;
  }

  function sentenceCase(str) {
    try {
      str = str.split('-').join(' ').split('_').join(' ');
      return str[0].toUpperCase() + str.slice(1).toLowerCase();
    } catch (e) {
      return str;
    }
  }

  function onDrillDownButtonClick(event, data, dictionary) {
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

        if (groupBykey) {
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
    const scale = 8

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

  function chunk(arr = [], size = 1) {
    const results = [];
    while (arr.length) {
      results.push(arr.splice(0, size));
    }
    return results;
  };

  function nice(number = 0) {
    const digits = Math.abs(Math.trunc(number)).toString().length - 1
    let base = Math.pow(10, digits) / 20
  
    while (base < 1) {
      base *= 10
    }
  
    return Math.ceil(number / base) * base
  }
})();
