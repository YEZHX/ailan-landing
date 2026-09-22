/* Переключение языка, режимы доступности и мобильное меню. Без библиотек. */
(function () {
  "use strict";

  var root = document.documentElement;
  var dict = window.AILAN_I18N || {};
  var LANGS = ["kk", "ru", "en"];
  var KINDS = { text: "data-i18n", alt: "data-i18n-alt", title: "data-i18n-title", content: "data-i18n-content" };
  var ru = { text: {}, alt: {}, title: {}, content: {} };

  function each(selector, fn) {
    Array.prototype.forEach.call(document.querySelectorAll(selector), fn);
  }

  function store(key, value) {
    try {
      if (value === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, value);
    } catch (e) {
      return null;
    }
  }

  // Русский — исходный текст страницы: запоминаем его, чтобы возвращаться без перезагрузки.
  each("[data-i18n]", function (el) { ru.text[el.getAttribute(KINDS.text)] = el.textContent; });
  each("[data-i18n-alt]", function (el) { ru.alt[el.getAttribute(KINDS.alt)] = el.getAttribute("alt"); });
  each("[data-i18n-title]", function (el) { ru.title[el.getAttribute(KINDS.title)] = el.getAttribute("title"); });
  each("[data-i18n-content]", function (el) { ru.content[el.getAttribute(KINDS.content)] = el.getAttribute("content"); });

  function translate(lang, kind, key) {
    var own = lang !== "ru" && dict[lang] ? dict[lang][key] : undefined;
    if (own !== undefined) return own;
    // Для alt и title ключ может совпадать с текстовым (имя в карточке и подпись фото).
    return ru[kind][key] !== undefined ? ru[kind][key] : ru.text[key];
  }

  function setLang(lang) {
    if (LANGS.indexOf(lang) < 0) lang = "ru";
    each("[data-i18n]", function (el) { el.textContent = translate(lang, "text", el.getAttribute(KINDS.text)); });
    each("[data-i18n-alt]", function (el) { el.setAttribute("alt", translate(lang, "alt", el.getAttribute(KINDS.alt))); });
    each("[data-i18n-title]", function (el) {
      var v = translate(lang, "title", el.getAttribute(KINDS.title));
      el.setAttribute("title", v);
      el.setAttribute("aria-label", v);
    });
    each("[data-i18n-content]", function (el) { el.setAttribute("content", translate(lang, "content", el.getAttribute(KINDS.content))); });
    each("[data-lang]", function (btn) { btn.setAttribute("aria-pressed", String(btn.getAttribute("data-lang") === lang)); });
    root.setAttribute("lang", lang);
    store("ailan.lang", lang);
    if (window.history && history.replaceState) {
      var url = new URL(window.location.href);
      url.searchParams.set("lang", lang);
      history.replaceState(null, "", url);
    }
  }

  function initialLang() {
    var fromUrl = new URLSearchParams(window.location.search).get("lang");
    if (LANGS.indexOf(fromUrl) >= 0) return fromUrl;
    var saved = store("ailan.lang");
    if (LANGS.indexOf(saved) >= 0) return saved;
    var prefs = navigator.languages || [navigator.language || ""];
    for (var i = 0; i < prefs.length; i++) {
      var code = String(prefs[i]).toLowerCase();
      if (code.indexOf("kk") === 0 || code.indexOf("kz") === 0) return "kk";
      if (code.indexOf("ru") === 0) return "ru";
      if (code.indexOf("en") === 0) return "en";
    }
    return "ru";
  }

  each("[data-lang]", function (btn) {
    btn.addEventListener("click", function () { setLang(btn.getAttribute("data-lang")); });
  });

  // Режимы доступности: класс на <html> ставится ещё в <head>, здесь только кнопки.
  function bindToggle(id, cls, key) {
    var btn = document.getElementById(id);
    if (!btn) return;
    btn.setAttribute("aria-pressed", String(root.classList.contains(cls)));
    btn.addEventListener("click", function () {
      var on = root.classList.toggle(cls);
      btn.setAttribute("aria-pressed", String(on));
      store(key, on ? "1" : "0");
    });
  }
  bindToggle("toggle-large", "a11y-large", "ailan.large");
  bindToggle("toggle-contrast", "a11y-contrast", "ailan.contrast");

  // Мобильное меню
  var nav = document.getElementById("nav");
  var menuBtn = document.getElementById("menu-btn");
  function closeMenu() {
    nav.classList.remove("is-open");
    menuBtn.setAttribute("aria-expanded", "false");
  }
  if (nav && menuBtn) {
    menuBtn.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      menuBtn.setAttribute("aria-expanded", String(open));
    });
    each("#nav a", function (a) { a.addEventListener("click", closeMenu); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenu(); });
  }

  setLang(initialLang());
})();
