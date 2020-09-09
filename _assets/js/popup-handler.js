(function () {
  const observeDOM = (function () {
    const MutationObserver =
      window.MutationObserver || window.WebKitMutationObserver;
    const eventListenerSupported = window.addEventListener;

    return function (obj, callback) {
      if (MutationObserver) {
        // define a new observer
        const obs = new MutationObserver(function (mutations, observer) {
          if (
            mutations[0].addedNodes.length ||
            mutations[0].removedNodes.length
          )
            callback();
        });
        // have the observer observe foo for changes in children
        obs.observe(obj, { childList: true, subtree: true });
      } else if (eventListenerSupported) {
        obj.addEventListener("DOMNodeInserted", callback, false);
        obj.addEventListener("DOMNodeRemoved", callback, false);
      }
    };
  })();

  function getCookie(name) {
    // Split cookie string and get all individual name=value pairs in an array
    var cookieArr = document.cookie.split(";");

    // Loop through the array elements
    for (var i = 0; i < cookieArr.length; i++) {
      var cookiePair = cookieArr[i].split("=");

      /* Removing whitespace at the beginning of the cookie name
        and compare it with the given string */
      if (name == cookiePair[0].trim()) {
        // Decode the cookie value and return
        return decodeURIComponent(cookiePair[1]);
      }
    }

    // Return null if not found
    return null;
  }

  let IS_WIDGET_INITIALIZED = false
  let REPORT_URL = null

  observeDOM(document.body, function () {
    const widget = document.querySelector("[widgetid^='PopupSignupForm']");
  
    if (widget && !IS_WIDGET_INITIALIZED) {
      IS_WIDGET_INITIALIZED = true
      widget.style.opacity = 0;
      widget.style.transform = "translate(-9999px)";
    }

    if (!widget && REPORT_URL) {
      window.open(REPORT_URL, "_blank");
      REPORT_URL = null
    }
  });

  window.onclick = (e) => {
    const { dataset: { triggerModal, action } = {}, href } = e.target

    if (triggerModal !== undefined) {
      const widget = document.querySelector("[widgetid^='PopupSignupForm']");

      if (widget && getCookie("MCPopupClosed") !== "yes") {
        e.preventDefault()
        REPORT_URL = href
        widget.style.opacity = null;
        widget.style.transform = null;
      }
    }
  }
})();
