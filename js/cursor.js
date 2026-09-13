(function () {
  "use strict";

  var isFinePointer = window.matchMedia("(pointer: fine)").matches;
  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!isFinePointer || prefersReducedMotion) return;

  var ring = document.createElement("div");
  ring.className = "custom-cursor";
  var dot = document.createElement("div");
  dot.className = "custom-cursor-dot";
  document.body.appendChild(ring);
  document.body.appendChild(dot);
  document.body.classList.add("has-custom-cursor");

  var mouseX = window.innerWidth / 2;
  var mouseY = window.innerHeight / 2;
  var ringX = mouseX;
  var ringY = mouseY;
  var visible = false;

  function onMouseMove(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.transform = "translate(" + mouseX + "px," + mouseY + "px) translate(-50%, -50%)";
    if (!visible) {
      visible = true;
      ring.classList.add("is-active");
      dot.classList.add("is-active");
    }
  }

  function onMouseLeaveWindow(e) {
    if (!e.relatedTarget && !e.toElement) {
      visible = false;
      ring.classList.remove("is-active");
      dot.classList.remove("is-active");
    }
  }

  function tick() {
    ringX += (mouseX - ringX) * 0.18;
    ringY += (mouseY - ringY) * 0.18;
    ring.style.transform = "translate(" + ringX + "px," + ringY + "px) translate(-50%, -50%)";
    requestAnimationFrame(tick);
  }

  var hoverTargets = "a, button, .btn, input, textarea, select, .nav-toggle, .cookie-link-btn";

  document.addEventListener("mousemove", onMouseMove, { passive: true });
  document.addEventListener("mouseout", onMouseLeaveWindow);

  document.addEventListener(
    "mouseover",
    function (e) {
      if (e.target.closest && e.target.closest(hoverTargets)) {
        ring.classList.add("is-hover");
      }
    },
    true
  );

  document.addEventListener(
    "mouseout",
    function (e) {
      if (e.target.closest && e.target.closest(hoverTargets)) {
        ring.classList.remove("is-hover");
      }
    },
    true
  );

  requestAnimationFrame(tick);
})();
