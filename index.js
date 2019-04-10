let sidebarButton = document.querySelectorAll("a[href='#sidebar']")[0];

window.onload = window.onresize = function() {
	sidebarButton.style.display = (window.innerWidth >= 960) ? "none" : "block";
};