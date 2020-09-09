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

  observeDOM(document.body, function () {
    console.log("dom changed");
  });

  document.addEventListener("DOMContentLoaded", () => {
    console.log(1, "document");
    const widget = document.querySelector("[widgetid^='PopupSignupForm']");

    if (widget) {
      console.log(2, "wiii-dget");

      widget.style.opacity = 0.25;
    }
  });

  window.addEventListener("DOMContentLoaded", () => {
    const widget = document.querySelector("[widgetid^='PopupSignupForm']");

    console.log("window", widget);
  });
})();
