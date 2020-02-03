(function() {
  window.addEventListener("DOMContentLoaded", () => {
    getJSON("https://act-export.frankbold.org/dictionary.json", dictionary => {
      getJSON("https://act-export.frankbold.org/reports.json", data => {
        // Update sector names using the dictionary keys
        data.forEach(d => {
          d.company.sectors = d.company.sectors.map(d => dictionary[d]);
        });

        // The list of sections is the first level of the JSON
        const tree = getTree(data);

        // Load sidebar
        const sidebar = document.querySelector(".js-database-sidebar")
        sidebar.innerHTML = loadTOC(tree, dictionary);

        const lis = sidebar.querySelectorAll("li")
        const activeClass = 'active'
        sidebar.addEventListener('click', (event) => {
          const { target } = event

          lis.forEach(li => li.classList.remove(activeClass))
          target.parentElement.classList.add(activeClass)
        })

        // Load General section
        // renderSection(window.location.hash.slice(1), data, tree, dictionary);

        // // Sidebar navigation
        // document.querySelectorAll("#sidebar a").forEach((element) => {
        //   return element.addEventListener('click', (event) => {
        //     renderSection(event.target.hash.slice(1), data, tree, dictionary);
        //   });
        // });

        // // When changes the state, render the section from the URL hash
        // window.onpopstate = (event) => {
        //   renderSection(document.location.hash.slice(1), data, tree, dictionary);
        // }
      });
    });
  });
})();

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
