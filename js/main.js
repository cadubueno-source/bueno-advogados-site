(function () {
  "use strict";

  /* ---------- Cabeçalho: encolhe e ganha sombra ao rolar ---------- */
  var siteHeader = document.querySelector(".site-header");
  if (siteHeader) {
    var scrollTicking = false;
    function updateHeaderState() {
      siteHeader.classList.toggle("is-scrolled", window.scrollY > 12);
      scrollTicking = false;
    }
    window.addEventListener(
      "scroll",
      function () {
        if (!scrollTicking) {
          window.requestAnimationFrame(updateHeaderState);
          scrollTicking = true;
        }
      },
      { passive: true }
    );
    updateHeaderState();
  }

  /* ---------- Mobile nav ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".main-nav");
  var backdrop = document.querySelector(".nav-backdrop");

  function closeNav() {
    if (!nav) return;
    nav.classList.remove("is-open");
    if (backdrop) backdrop.classList.remove("is-open");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
  }

  function toggleNav() {
    if (!nav) return;
    var isOpen = nav.classList.toggle("is-open");
    if (backdrop) backdrop.classList.toggle("is-open", isOpen);
    if (toggle) toggle.setAttribute("aria-expanded", String(isOpen));
  }

  if (toggle) toggle.addEventListener("click", toggleNav);
  if (backdrop) backdrop.addEventListener("click", closeNav);

  /* ---------- Dropdowns (clique para touch, hover cuida do desktop via CSS) ---------- */
  var dropdownParents = document.querySelectorAll(".has-dropdown");
  dropdownParents.forEach(function (parent) {
    var trigger = parent.querySelector(".nav-link");
    if (!trigger) return;
    trigger.setAttribute("aria-expanded", "false");
    trigger.addEventListener("click", function (e) {
      var isMobile = window.matchMedia("(max-width: 1060px)").matches;
      if (!isMobile) return;
      e.preventDefault();
      var willOpen = !parent.classList.contains("is-open");
      dropdownParents.forEach(function (p) {
        p.classList.remove("is-open");
        var t = p.querySelector(".nav-link");
        if (t) t.setAttribute("aria-expanded", "false");
      });
      if (willOpen) {
        parent.classList.add("is-open");
        trigger.setAttribute("aria-expanded", "true");
      }
    });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closeNav();
      dropdownParents.forEach(function (p) {
        p.classList.remove("is-open");
      });
    }
  });

  /* ---------- Cookie consent banner ---------- */
  var COOKIE_KEY = "bueno-advogados-cookie-consent";
  var banner = document.querySelector("[data-cookie-banner]");

  function getConsent() {
    try {
      return localStorage.getItem(COOKIE_KEY);
    } catch (err) {
      return null;
    }
  }

  function setConsent(value) {
    try {
      localStorage.setItem(COOKIE_KEY, value);
    } catch (err) {
      /* localStorage indisponível: apenas oculta na sessão atual */
    }
  }

  if (banner) {
    if (!getConsent()) {
      window.setTimeout(function () {
        banner.classList.add("is-visible");
      }, 400);
    }

    var acceptBtn = banner.querySelector("[data-cookie-accept]");
    var rejectBtn = banner.querySelector("[data-cookie-reject]");
    var settingsBtn = banner.querySelector("[data-cookie-settings]");
    var detailsPanel = banner.querySelector("[data-cookie-details]");

    function hideBanner() {
      banner.classList.remove("is-visible");
    }

    if (acceptBtn) {
      acceptBtn.addEventListener("click", function () {
        setConsent("accepted");
        hideBanner();
      });
    }

    if (rejectBtn) {
      rejectBtn.addEventListener("click", function () {
        setConsent("rejected");
        hideBanner();
      });
    }

    if (settingsBtn && detailsPanel) {
      settingsBtn.addEventListener("click", function () {
        var isHidden = detailsPanel.hasAttribute("hidden");
        if (isHidden) {
          detailsPanel.removeAttribute("hidden");
        } else {
          detailsPanel.setAttribute("hidden", "");
        }
        settingsBtn.setAttribute("aria-expanded", String(isHidden));
      });
    }
  }

  /* ---------- Formulários: envio real via Netlify Forms ----------
     Funciona quando o site está publicado no Netlify (que detecta os
     formulários com data-netlify="true" no HTML). Rodando localmente
     (fora do Netlify) o envio falha de propósito, pois não existe
     esse backend aqui — é o comportamento esperado no ambiente local. */
  var forms = document.querySelectorAll("[data-static-form]");
  forms.forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var status = form.querySelector(".form-status");
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      var submitBtn = form.querySelector('button[type="submit"]');
      var originalBtnText = submitBtn ? submitBtn.textContent : "";
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Enviando…";
      }
      if (status) {
        status.textContent = "";
        status.removeAttribute("data-state");
      }

      fetch(form.getAttribute("action") || window.location.pathname, {
        method: "POST",
        body: new FormData(form),
      })
        .then(function (response) {
          if (!response.ok) throw new Error("Falha no envio");
          if (status) {
            status.textContent =
              form.getAttribute("data-success-message") ||
              "Mensagem recebida. Entraremos em contato em breve.";
            status.setAttribute("data-state", "success");
          }
          form.reset();
        })
        .catch(function () {
          if (status) {
            status.textContent =
              "Não foi possível enviar agora. Tente novamente ou fale por telefone/e-mail.";
            status.setAttribute("data-state", "error");
          }
        })
        .then(function () {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
          }
        });
    });
  });

  /* ---------- Ouvidoria: alterna campos identificados/anônimos ---------- */
  var ouvidoriaForm = document.querySelector("[data-ouvidoria-form]");
  if (ouvidoriaForm) {
    var modeRadios = ouvidoriaForm.querySelectorAll('input[name="modo-relato"]');
    var idFields = ouvidoriaForm.querySelector("[data-identified-fields]");

    function applyMode() {
      var selected = ouvidoriaForm.querySelector('input[name="modo-relato"]:checked');
      if (!selected || !idFields) return;
      var isAnon = selected.value === "anonimo";
      idFields.style.display = isAnon ? "none" : "";
      idFields.querySelectorAll("input").forEach(function (input) {
        if (isAnon) {
          input.removeAttribute("required");
        } else if (input.hasAttribute("data-required")) {
          input.setAttribute("required", "");
        }
      });
    }

    modeRadios.forEach(function (radio) {
      radio.addEventListener("change", applyMode);
    });
    applyMode();
  }

  /* ---------- Ano no rodapé ---------- */
  var yearEl = document.getElementById("ano-atual");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Reveal on scroll (sutil, transform/opacity) ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length) {
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15 }
      );
      revealEls.forEach(function (el) {
        io.observe(el);
      });
    } else {
      revealEls.forEach(function (el) {
        el.classList.add("is-visible");
      });
    }
  }
})();
