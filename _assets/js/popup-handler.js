(function() {
  console.log('load');

  document.addEventListener('DOMContentLoaded', () => {
    console.log(1, 'document');
    const widget = document.querySelector("[widgetid^='PopupSignupForm']")
    
    if (widget) {
      console.log(2, 'wiii-dget');
      
      widget.style.opacity = 0.25
    } else {
      console.log(3, 'no widget');

      document.body.style.background = 'black'
    }
  })

  window.addEventListener('DOMContentLoaded', () => {
    console.log(2, 'window');
  })

  const widget = document.querySelector("[widgetid^='PopupSignupForm']")

  console.log(0, widget);
})();
