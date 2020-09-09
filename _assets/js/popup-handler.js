(function() {
  console.log('load');
  
  document.addEventListener('DOMContentLoader', () => {
    console.log(1);
    const widget = document.querySelector("[widgetid^='PopupSignupForm']")
    
    if (widget) {
      console.log(2, 'wiii-dget');
      
      widget.style.opacity = 0.25
    } else {
      console.log(3, 'no widget');

      document.body.style.background = 'black'
    }
  })
})();
