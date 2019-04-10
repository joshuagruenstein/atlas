let sidebarButton = document.querySelectorAll("a[href='#sidebar']")[0];

window.onload = window.onresize = function() {
    sidebarButton.style.display = (window.innerWidth >= 960) ? "none" : "block";
};

window.MathJax = {
    "fast-preview": {
        disabled: true
    },
    AuthorInit: function() {
        MathJax.Hub.Register.StartupHook('End', function() {
            MathJax.Hub.processSectionDelay = 0
            var demoSource = document.getElementById('expressionSource')
            var demoRendering = document.getElementById('expressionRendering')
            var math = MathJax.Hub.getAllJax('demoRendering')[0]
            demoSource.addEventListener('input', function() {
                MathJax.Hub.Queue(['Text', math, demoSource.value])
            })
        })
    }
}
