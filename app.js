(function () {
  "use strict";

  var C = window.HITO_CONFIG;
  var app = document.getElementById("app");
  var params = new URLSearchParams(location.search);
  var tiendaId = (params.get("tienda") || "").toLowerCase();
  var vista = (params.get("vista") || "").toLowerCase();
  var tienda = C.TIENDAS[tiendaId];
  var DEMO = !C.API_URL;
  var DEMO_KEY = "hito-pbv-demo-v3";
  var TEMA = {}; C.TEMAS.forEach(function (t) { TEMA[t.id] = t; });
  var ROL = {}; C.ROLES.forEach(function (r) { ROL[r.id] = r; });
  var MOM = {}; C.MOMENTOS.forEach(function (m) { MOM[m.id] = m; });

  // ---------- utilidades ----------
  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    attrs = attrs || {};
    Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === "class") n.className = v;
      else if (k === "text") n.textContent = v;
      else if (k.indexOf("on") === 0) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v);
    });
    (children || []).forEach(function (c) {
      if (c === null || c === undefined || c === false) return;
      n.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return n;
  }
  function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); }
  function url(q) { var u = new URL(location.href); u.search = q; u.hash = ""; return u.toString(); }
  function ir(q) { location.search = q; }
  function demoBanner() {
    return DEMO ? el("div", { class: "demo", text: "Modo demostración: las respuestas se guardan solo en este navegador." }) : null;
  }
  function clioFoot(extra) {
    return el("div", { class: "clio" }, [el("img", { src: "clio.png", alt: "CliO Consulting" }), el("span", { text: extra || "CliO para IKEA · Plan Buen Vecino 2026" })]);
  }
  function rolEmoji(r) { return (ROL[r] && ROL[r].emoji) || "✨"; }
  function qrSvg(texto, node) {
    try { var q = window.qrcode(0, "M"); q.addData(texto); q.make(); node.innerHTML = q.createSvgTag({ scalable: true, margin: 0 }); }
    catch (e) { node.textContent = "QR"; }
    return node;
  }
  // Círculo al estilo del sello PBV: color, anillo blanco y emoji al centro.
  function circulo(color, emoji, num, extraClass) {
    return el("div", { class: "circ" + (extraClass ? " " + extraClass : ""), style: "background:" + color }, [
      el("span", { class: "circ-em", text: emoji }),
      num ? el("span", { class: "circ-n", text: String(num) }) : null
    ]);
  }

  // ---------- datos ----------
  function demoAll() { return JSON.parse(localStorage.getItem(DEMO_KEY) || "[]"); }
  function demoSave(a) { localStorage.setItem(DEMO_KEY, JSON.stringify(a)); }
  function post(payload) {
    // text/plain evita la verificación previa (CORS) de Apps Script.
    return fetch(C.API_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) })
      .then(function (r) { return r.json(); });
  }
  function enviar(payload) {
    if (DEMO) {
      var all = demoAll();
      all.push({
        id: String(Date.now()) + Math.random().toString(36).slice(2, 6), ts: Date.now(), tienda: payload.tienda,
        rol: payload.rol, nombre: payload.autorizacion ? payload.nombre : "", experiencia: payload.experiencia || null,
        comentario: payload.comentario, logro: payload.logro, mejora: payload.mejora, sueno: payload.sueno, visible: "SI"
      });
      demoSave(all);
      return Promise.resolve({ ok: true });
    }
    return post(payload);
  }
  function traer(t) {
    if (DEMO) {
      return Promise.resolve(demoAll().filter(function (r) { return r.visible !== "NO" && (t === "todas" || r.tienda === t); }));
    }
    return fetch(C.API_URL + "?action=data&tienda=" + encodeURIComponent(t) + "&t=" + Date.now())
      .then(function (r) { return r.json(); })
      .then(function (d) { if (!d.ok) throw new Error(d.error || "error"); return d.respuestas; });
  }
  function aTarjetas(respuestas) {
    var out = [];
    respuestas.forEach(function (r) {
      C.TEMAS.forEach(function (t) {
        if (r[t.id]) out.push({ id: r.id + "-" + t.id, ts: r.ts, tema: t.id, texto: r[t.id], rol: r.rol, nombre: r.nombre, tienda: r.tienda });
      });
    });
    return out.sort(function (a, b) { return b.ts - a.ts; });
  }

  // =====================================================================
  //  CELULAR
  // =====================================================================
  function vistaParticipar() {
    var s = { paso: 0, volver: false, tienda: tienda ? tiendaId : "", rol: "", nombre: "", anonimo: false, autorizacion: false, experiencia: 0, comentario: "", logro: "", mejora: "", sueno: "" };
    var PASOS = ["inicio", "quien", "experiencia"].concat(C.TEMAS.map(function (t) { return t.id; })).concat(["revisar"]);
    var REVISAR = PASOS.length - 1;

    function shell(tabTxt, eyebrow, titulo, body, actions) {
      clear(app);
      var bar = el("div", { class: "bar", "aria-hidden": "true" });
      for (var i = 1; i < PASOS.length; i++) bar.appendChild(el("span", { class: i <= s.paso ? "on" : "" }));
      var t = C.TIENDAS[s.tienda];
      app.appendChild(el("div", { class: "phone" }, [
        demoBanner(),
        el("div", { class: "p-head" }, [
          el("div", { class: "who" }, [el("img", { src: "pbv-sello.png", alt: "Plan Buen Vecino IKEA" }), "PBV 2026" + (t && s.paso > 0 ? " · " + t.emoji + " " + t.nombre : "")]),
          el("div", { class: "tab", text: tabTxt })
        ]),
        s.paso > 0 ? bar : null,
        el("div", { class: "p-title" }, [eyebrow ? el("div", { class: "eyebrow", text: eyebrow }) : null, el("h1", { text: titulo })]),
        el("div", { class: "p-body" }, body),
        actions ? el("div", { class: "actions" }, actions) : null,
        el("div", { class: "p-foot" }, [clioFoot()])
      ]));
      window.scrollTo(0, 0);
    }
    function ir(n) { s.paso = n; render(); }
    function pasoTxt() { return "Paso " + s.paso + " de " + (PASOS.length - 1); }
    function error(n, msg) { n.textContent = msg; n.classList.remove("hidden"); }
    // Botones de abajo: normales, o «volver a revisar» si se llegó desde «Editar».
    function botones(atras, siguiente, validar) {
      if (s.volver) {
        return [el("button", { class: "btn pri", type: "button", text: "Listo, volver a revisar 👀", onclick: function () {
          if (validar && !validar()) return;
          s.volver = false; ir(REVISAR);
        } })];
      }
      return [
        el("button", { class: "btn sec", type: "button", text: "Atrás", onclick: function () { ir(atras); } }),
        el("button", { class: "btn pri", type: "button", text: siguiente.txt || "Siguiente 👉", onclick: function () {
          if (validar && !validar()) return;
          ir(siguiente.n);
        } })
      ];
    }

    function render() {
      var p = PASOS[s.paso];
      if (p === "inicio") return inicio();
      if (p === "quien") return quien();
      if (p === "experiencia") return experiencia();
      if (p === "revisar") return revisar();
      return tema(TEMA[p]);
    }

    function inicio() {
      var err = el("p", { class: "err hidden" });
      var tiendas = el("div", { class: "tiendas-c", role: "radiogroup", "aria-label": "Tu tienda" }, Object.keys(C.TIENDAS).map(function (id) {
        var on = s.tienda === id;
        return el("button", { type: "button", class: "tienda-c" + (on ? " on" : ""), role: "radio", "aria-checked": String(on), onclick: function () { s.tienda = id; render(); } },
          [el("span", { class: "em", text: C.TIENDAS[id].emoji }), C.TIENDAS[id].nombre]);
      }));
      var pasos = el("div", { class: "circs" }, C.TEMAS.map(function (t) {
        return el("div", { class: "circ-item" }, [circulo(t.color, t.emoji, t.num), el("b", { text: t.titulo })]);
      }));
      shell("¡Hola! 👋", null, "Hagamos que siga pasando", [
        el("div", {}, [el("label", { class: "lbl", text: "🏬 ¿En qué tienda estás?" }), tiendas]),
        el("div", {}, [el("label", { class: "lbl", text: "✍️ Vamos a responder 3 cosas" }), pasos]),
        err
      ], [el("button", { class: "btn pri", type: "button", text: "Empezar 👉", onclick: function () {
        if (!s.tienda) return error(err, "👆 Elige tu tienda para empezar.");
        ir(1);
      } })]);
    }

    function quien() {
      var err = el("p", { class: "err hidden" });
      var chips = el("div", { class: "chips", role: "radiogroup", "aria-label": "¿Cómo participaste?" }, C.ROLES.map(function (r) {
        return el("button", { type: "button", class: "chip" + (s.rol === r.id ? " on" : ""), role: "radio", "aria-checked": String(s.rol === r.id), onclick: function () { sync(); s.rol = r.id; render(); } },
          [el("span", { class: "em", text: r.emoji }), r.id]);
      }));
      var nombre = el("input", { type: "text", id: "nombre", maxlength: "60", autocomplete: "name", placeholder: "Escribe tu nombre (opcional)" });
      nombre.value = s.nombre;
      var anon = el("input", { type: "checkbox", id: "anon" }); anon.checked = s.anonimo;
      var aut = el("input", { type: "checkbox", id: "aut" }); aut.checked = s.autorizacion;
      var autBox = el("label", { class: "check", for: "aut" }, [aut, el("span", { text: C.AUTORIZACION })]);
      function sync() {
        s.nombre = nombre.value.trim(); s.anonimo = anon.checked; s.autorizacion = aut.checked;
        nombre.disabled = anon.checked;
        autBox.classList.toggle("hidden", anon.checked || !s.nombre);
      }
      nombre.addEventListener("input", sync); anon.addEventListener("change", sync); aut.addEventListener("change", sync);
      sync();
      shell(pasoTxt(), "Paso 1 · ¿Quién eres?", "Cuéntanos de ti 👋", [
        el("div", {}, [el("label", { class: "lbl", text: "🙋 ¿Cómo participaste?" }), chips]),
        el("div", {}, [el("label", { class: "lbl", for: "nombre", text: "✍️ Tu nombre" }), nombre]),
        el("label", { class: "check", for: "anon" }, [anon, el("span", { text: "🙈 Prefiero participar de forma anónima" })]),
        autBox,
        err
      ], botones(0, { n: 2 }, function () {
        sync();
        if (!s.rol) { error(err, "👆 Elige cómo participaste."); return false; }
        if (s.nombre && !s.anonimo && !s.autorizacion) { error(err, "Autoriza tu nombre o marca 🙈 anónimo."); return false; }
        return true;
      }));
    }

    function experiencia() {
      var com = el("textarea", { id: "com", class: "corto", maxlength: String(C.MAX_CHARS), placeholder: "Escribe aquí (opcional)" });
      com.value = s.comentario;
      com.addEventListener("input", function () { s.comentario = com.value; });
      var scale = el("div", { class: "scale", role: "radiogroup", "aria-label": "Tu experiencia en 2026" }, C.EXPERIENCIA.map(function (e) {
        return el("button", { type: "button", class: s.experiencia === e.v ? "on" : "", role: "radio", "aria-checked": String(s.experiencia === e.v), "aria-label": e.txt, onclick: function () { s.experiencia = e.v; render(); } },
          [el("span", { class: "em", text: e.emoji }), el("small", { text: e.txt })]);
      }));
      shell(pasoTxt(), "Paso 2 · Calentemos motores 🔥", "¿Cómo te fue en el PBV 2026?", [
        scale,
        el("div", {}, [el("label", { class: "lbl", for: "com", text: "💬 ¿Algo más que quieras contarnos?" }), com])
      ], botones(1, { n: 3, txt: s.experiencia || s.comentario ? "Siguiente 👉" : "Saltar 👉" }));
    }

    function tema(t) {
      var ta = el("textarea", { id: "txt", maxlength: String(C.MAX_CHARS), placeholder: t.ayuda });
      ta.value = s[t.id];
      var count = el("div", { class: "count" });
      function upd() { s[t.id] = ta.value; count.textContent = ta.value.length + " / " + C.MAX_CHARS; }
      ta.addEventListener("input", upd); upd();
      var ej = el("div", { class: "ideas" }, [
        el("div", { class: "ideas-t", text: "💡 ¿Sin ideas? Inspírate con una (tócala y ajústala)" }),
        el("div", { class: "ejemplos" }, t.ejemplos.map(function (x) {
          return el("button", { type: "button", text: x, onclick: function () { ta.value = x; upd(); ta.focus(); } });
        }))
      ]);
      shell(pasoTxt(), t.emoji + " " + t.titulo, t.pregunta, [
        el("div", { class: "tema-line", style: "background:" + t.color }),
        el("div", {}, [ta, count]),
        ej
      ], botones(s.paso - 1, { n: s.paso + 1 }));
    }

    function revisar() {
      var err = el("p", { class: "err hidden" });
      function editar(n) { return el("button", { type: "button", class: "edit", text: "✏️ Editar", onclick: function () { s.volver = true; ir(n); } }); }
      var exp = C.EXPERIENCIA.filter(function (e) { return e.v === s.experiencia; })[0];
      var quienTxt = (s.nombre && !s.anonimo && s.autorizacion ? s.nombre : "🙈 Anónimo") + " · " + rolEmoji(s.rol) + " " + s.rol;
      var filas = [
        el("div", { class: "rev-row" }, [el("span", { text: quienTxt }), editar(1)]),
        el("div", { class: "rev-row" }, [el("span", { text: exp ? exp.emoji + " " + exp.txt + (s.comentario.trim() ? " · 💬 " + s.comentario.trim() : "") : (s.comentario.trim() ? "💬 " + s.comentario.trim() : "Sin calificación") }), editar(2)])
      ];
      var prev = el("div", { class: "preview" }, C.TEMAS.map(function (t, i) {
        var txt = s[t.id].trim();
        var head = el("div", { class: "mini-h" }, [el("b", { text: t.emoji + " " + t.titulo }), editar(3 + i)]);
        return txt
          ? el("div", { class: "mini", style: "background:" + t.color + ";color:" + t.texto }, [head, txt])
          : el("div", { class: "mini vacia" }, [head, "Sin respuesta"]);
      }));
      var back = el("button", { class: "btn sec", type: "button", text: "Atrás", onclick: function () { ir(s.paso - 1); } });
      var send = el("button", { class: "btn pri", type: "button", text: "Colgar en el tendedero 🚀", onclick: function () {
        var alguna = C.TEMAS.some(function (t) { return s[t.id].trim(); });
        if (!alguna) return error(err, "✍️ Escribe al menos una respuesta antes de enviar.");
        send.disabled = true; back.disabled = true; send.textContent = "Enviando…";
        var conNombre = !s.anonimo && !!s.nombre && s.autorizacion;
        var payload = { tienda: s.tienda, rol: s.rol, nombre: conNombre ? s.nombre : "", anonimo: !conNombre, autorizacion: conNombre, experiencia: s.experiencia || null, comentario: s.comentario.trim() };
        C.TEMAS.forEach(function (t) { payload[t.id] = s[t.id].trim(); });
        enviar(payload).then(function (r) {
          if (!r || !r.ok) throw new Error((r && r.error) || "error");
          gracias();
        }).catch(function () {
          error(err, "😕 No pudimos enviar tus respuestas. Revisa tu conexión e inténtalo de nuevo.");
          send.disabled = false; back.disabled = false; send.textContent = "Colgar en el tendedero 🚀";
        });
      } });
      shell(pasoTxt(), "Último paso 👀", "Así se verán tus tarjetas", [
        el("div", { class: "rev" }, filas),
        prev, err
      ], [back, send]);
    }

    function gracias() {
      clear(app);
      var t = C.TIENDAS[s.tienda];
      app.appendChild(el("div", { class: "phone" }, [
        el("div", { class: "p-head" }, [el("div", { class: "who" }, [el("img", { src: "pbv-sello.png", alt: "Plan Buen Vecino IKEA" }), "PBV 2026 · " + t.emoji + " " + t.nombre]), el("div", { class: "tab", text: "¡Listo!" })]),
        el("div", { class: "p-body thanks" }, [
          el("div", { class: "em", text: "🎉" }),
          el("div", { class: "big", text: "¡Gracias! Tus tarjetas ya están en el tendedero." }),
          el("p", { text: "Mira la pantalla 👀 Hagamos que siga pasando 💙" }),
          el("button", { class: "btn sec", type: "button", text: "Responder de nuevo", onclick: function () { vistaParticipar(); } })
        ]),
        el("div", { class: "p-foot" }, [clioFoot()])
      ]));
    }

    render();
  }

  // =====================================================================
  //  RELATOR (proyector)
  // =====================================================================

  // Portada del relator: se elige la ciudad una sola vez.
  function vistaRelatorInicio() {
    app.appendChild(el("div", { class: "big-screen" }, [
      demoBanner(),
      el("header", { class: "s-head" }, [
        el("div", {}, [
          el("div", { class: "eyebrow" }, [el("img", { src: "pbv-sello.png", alt: "Plan Buen Vecino IKEA" }), "Plan Buen Vecino 2026 · Hito de cierre"]),
          el("h1", { text: "Hagamos que siga pasando" })
        ]),
        el("div", { class: "right" }, [el("div", { class: "tab", text: "🎤 Relator" })])
      ]),
      el("div", { class: "r-home" }, [
        el("h2", { text: "¿En qué tienda estamos hoy?" }),
        el("div", { class: "r-ciudades" }, Object.keys(C.TIENDAS).map(function (id) {
          return el("a", { class: "r-ciudad", href: "?tienda=" + id + "&vista=instrucciones" }, [
            circulo("#0058A3", C.TIENDAS[id].emoji, null, "xl"), el("b", { text: C.TIENDAS[id].nombre })
          ]);
        })),
        el("p", { class: "r-otros" }, [
          el("a", { href: "?tienda=todas&vista=resumen", text: "✨ Resumen de las tres tiendas" }), " · ",
          el("a", { href: "?vista=moderar", text: "🛡️ Moderar respuestas (en otro computador)" })
        ])
      ]),
      el("footer", { class: "s-foot" }, [clioFoot(), el("div", { class: "tools" }, [])])
    ]));
  }

  // Marco de las pantallas del relator, con pestañas 1-2-3 siempre visibles.
  function pantalla(activa, contenido, opts) {
    opts = opts || {};
    var qr = null;
    if (opts.qr && tienda) {
      qr = el("div", { class: "qr" }, [qrSvg(url("?tienda=" + tiendaId), el("div", { class: "code", "aria-label": "Código QR para participar" })), el("div", { class: "txt", text: "📱 Escanea y participa" })]);
    }
    var nav = null;
    if (tienda) {
      nav = el("nav", { class: "r-nav", "aria-label": "Pantallas del relator" }, [
        ["instrucciones", "1", "📋 Instrucciones"], ["tendedero", "2", "🧺 Tendedero"], ["resumen", "3", "✨ Resumen"]
      ].map(function (o) {
        return el("button", { type: "button", class: o[0] === activa ? "on" : "", "aria-current": o[0] === activa ? "page" : null, onclick: function () { ir("?tienda=" + tiendaId + "&vista=" + o[0]); } },
          [el("span", { class: "n", text: o[1] }), o[2]]);
      }));
    }
    var estado = el("span", { class: "estado", text: "" });
    var full = el("button", { type: "button", text: "⛶ Pantalla completa", onclick: function () {
      if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen();
    } });
    var nombreT = tienda ? tienda.emoji + " " + tienda.nombre : "Bogotá · Cali · Envigado";
    app.appendChild(el("div", { class: "big-screen" }, [
      demoBanner(),
      el("header", { class: "s-head" }, [
        el("div", {}, [
          el("div", { class: "eyebrow" }, [el("img", { src: "pbv-sello.png", alt: "Plan Buen Vecino IKEA" }), "Plan Buen Vecino 2026 · " + nombreT]),
          el("h1", { text: "Hagamos que siga pasando" })
        ]),
        el("div", { class: "right" }, [nav || el("div", { class: "tab", text: "✨ Resumen" }), el("div", { class: "headrow" }, [opts.head || null, qr])])
      ]),
      contenido,
      el("footer", { class: "s-foot" }, [clioFoot(), el("div", { class: "tools" }, [
        estado,
        el("button", { type: "button", text: "🏬 Cambiar de tienda", onclick: function () { ir("?vista=relator"); } }),
        full
      ])])
    ]));
    return estado;
  }
  function bucle(fn, estado) {
    function ciclo() {
      fn().then(function () {
        estado.textContent = "🟢 En vivo";
      }).catch(function () { estado.textContent = "🟠 Reconectando…"; })
        .then(function () { setTimeout(ciclo, C.REFRESH_MS); });
    }
    ciclo();
  }

  // ---------- reloj por momento ----------
  var RELOJ_KEY = "hito-pbv-reloj-v2";
  function relojNuevo(id) { return { momento: id, restante: MOM[id].min * 60000, fin: null }; }
  function relojEstado() {
    try { var r = JSON.parse(localStorage.getItem(RELOJ_KEY)); if (r && MOM[r.momento] && typeof r.restante === "number") return r; } catch (e) {}
    return relojNuevo(C.MOMENTOS[0].id);
  }
  function relojGuardar(r) { try { localStorage.setItem(RELOJ_KEY, JSON.stringify(r)); } catch (e) {} }
  function reloj(grande, alCambiar) {
    var r = relojEstado(), ultimo = null, editando = false;
    var cifra = el("button", { type: "button", class: "rl-cifra", title: "Toca para cambiar el tiempo" });
    var editor = el("input", { type: "text", class: "rl-edit hidden", inputmode: "numeric", "aria-label": "Tiempo (minutos o mm:ss)" });
    var etiqueta = el("div", { class: "rl-mom" });
    var play = el("button", { type: "button", class: "rl-play" });
    var expandir = el("button", { type: "button", class: "rl-exp", title: "Reloj en pantalla completa", text: "⛶" });
    var momentos = el("div", { class: "rl-moms", role: "radiogroup", "aria-label": "Momento" }, C.MOMENTOS.map(function (m) {
      return el("button", { type: "button", "data-m": m.id, title: m.titulo + " · " + m.min + " min", onclick: function () { r = relojNuevo(m.id); relojGuardar(r); pintar(); } }, [m.emoji]);
    }));
    function sumar(ms) {
      if (r.fin) r.fin = Math.max(Date.now(), r.fin + ms); else r.restante = Math.max(0, r.restante + ms);
      relojGuardar(r); pintar();
    }
    var box = el("div", { class: "reloj" + (grande ? " grande" : "") }, [
      expandir, momentos, etiqueta,
      el("div", { class: "rl-top" }, [cifra, editor]),
      el("div", { class: "rl-btns" }, [
        play,
        el("button", { type: "button", class: "rl-mas", text: "−1", title: "Quitar 1 minuto", onclick: function () { sumar(-60000); } }),
        el("button", { type: "button", class: "rl-mas", text: "+1", title: "Sumar 1 minuto", onclick: function () { sumar(60000); } }),
        el("button", { type: "button", text: "↺", "aria-label": "Reiniciar", onclick: function () { r = relojNuevo(r.momento); relojGuardar(r); pintar(); } })
      ]),
      el("button", { type: "button", class: "rl-cerrar", text: "✕ Volver", onclick: function () { cerrar(); } })
    ]);
    function abrir() {
      box.classList.add("expandido");
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(function () {});
    }
    function cerrar() { box.classList.remove("expandido"); }
    expandir.addEventListener("click", function () { if (box.classList.contains("expandido")) cerrar(); else abrir(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !editando) cerrar(); });
    // Editar el tiempo: escribir "3" (minutos) o "2:30".
    cifra.addEventListener("click", function () {
      editando = true;
      var ms = r.fin ? Math.max(0, r.fin - Date.now()) : r.restante, seg = Math.ceil(ms / 1000);
      editor.value = Math.floor(seg / 60) + ":" + String(seg % 60).padStart(2, "0");
      cifra.classList.add("hidden"); editor.classList.remove("hidden"); editor.focus(); editor.select();
    });
    function aplicar() {
      if (!editando) return;
      editando = false;
      var v = editor.value.trim().replace(",", ":").replace(".", ":"), p = v.split(":"), ms = NaN;
      if (p.length === 1) ms = parseFloat(p[0]) * 60000;
      else if (p.length === 2) ms = (parseInt(p[0] || "0", 10) * 60 + parseInt(p[1] || "0", 10)) * 1000;
      if (isFinite(ms) && ms >= 0 && ms <= 120 * 60000) {
        if (r.fin) r.fin = Date.now() + ms; else r.restante = ms;
        relojGuardar(r);
      }
      editor.classList.add("hidden"); cifra.classList.remove("hidden"); pintar();
    }
    editor.addEventListener("keydown", function (e) { if (e.key === "Enter") aplicar(); if (e.key === "Escape") { editando = false; editor.classList.add("hidden"); cifra.classList.remove("hidden"); } });
    editor.addEventListener("blur", aplicar);
    play.addEventListener("click", function () {
      if (r.fin) { r.restante = Math.max(0, r.fin - Date.now()); r.fin = null; }
      else { if (r.restante <= 0) r.restante = MOM[r.momento].min * 60000; r.fin = Date.now() + r.restante; }
      relojGuardar(r); pintar();
    });
    function pintar() {
      var ms = r.fin ? Math.max(0, r.fin - Date.now()) : r.restante;
      var seg = Math.ceil(ms / 1000);
      var m = MOM[r.momento];
      etiqueta.textContent = m.emoji + " " + m.titulo;
      cifra.textContent = ms <= 0 ? "¡Tiempo! ⏰" : String(Math.floor(seg / 60)).padStart(2, "0") + ":" + String(seg % 60).padStart(2, "0");
      Array.prototype.forEach.call(momentos.children, function (b) {
        var on = b.getAttribute("data-m") === r.momento;
        b.classList.toggle("on", on); b.setAttribute("aria-checked", String(on));
      });
      box.classList.toggle("corre", !!r.fin && ms > 0);
      box.classList.toggle("urgente", !!r.fin && ms > 0 && ms <= 30000);
      box.classList.toggle("fin", ms <= 0);
      play.textContent = r.fin && ms > 0 ? "⏸ Pausar" : "▶ Iniciar";
      if (r.fin && ms <= 0) { r = { momento: r.momento, restante: 0, fin: null }; relojGuardar(r); }
      if (alCambiar && ultimo !== r.momento) { ultimo = r.momento; alCambiar(m); }
    }
    pintar();
    setInterval(pintar, 250);
    return box;
  }

  function aviso(texto) {
    var t = el("div", { class: "toast", text: texto });
    document.body.appendChild(t);
    setTimeout(function () { t.classList.add("out"); }, 3200);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 3800);
  }

  // ---------- 1 · instrucciones ----------
  function vistaInstrucciones() {
    var pasos = [
      ["📱", "Escanea el QR"],
      ["✍️", "Responde 3 preguntas"],
      ["🧺", "¡Cuelga tus tarjetas!"]
    ];
    var lista = el("div", { class: "ins-steps" }, pasos.map(function (p, i) {
      return el("div", { class: "ins-step" }, [el("div", { class: "ins-n", text: String(i + 1) }), el("div", { class: "ins-em", text: p[0] }), el("b", { text: p[1] })]);
    }));
    var temas = el("div", { class: "ins-circs" }, C.TEMAS.map(function (t) {
      return el("div", { class: "circ-item" }, [circulo(t.color, t.emoji, t.num, "lg"), el("b", { text: t.titulo })]);
    }));
    var contenido = el("div", { class: "ins" }, [
      el("div", { class: "ins-left" }, [lista, temas]),
      el("div", { class: "ins-right" }, [qrSvg(url("?tienda=" + tiendaId), el("div", { class: "bigqr", "aria-label": "Código QR para participar" })), reloj(true)])
    ]);
    pantalla("instrucciones", contenido);
  }

  // ---------- 2 · tendedero ----------
  function vistaTendedero() {
    var vistos = {}, primera = true, cols = {};
    var lines = el("div", { class: "lines" });
    C.TEMAS.forEach(function (t) {
      var k = el("span", { class: "circ-n", text: "0" });
      var cards = el("div", { class: "cards" });
      var sec = el("section", { class: "col", "aria-label": t.titulo }, [
        el("div", { class: "col-head" }, [el("div", { class: "circ sm", style: "background:" + t.color }, [el("span", { class: "circ-em", text: t.emoji }), k]), el("h2", { text: t.titulo })]),
        el("div", { class: "rope", style: "background:" + t.color }),
        cards
      ]);
      cols[t.id] = { k: k, cards: cards, sec: sec };
      lines.appendChild(sec);
    });
    function destacar(m) {
      C.TEMAS.forEach(function (t) {
        cols[t.id].sec.classList.toggle("activa", m.tema === t.id);
        cols[t.id].sec.classList.toggle("tenue", !!m.tema && m.tema !== t.id);
      });
    }
    var estado = pantalla("tendedero", lines, { qr: true, head: reloj(false, destacar) });

    bucle(function () {
      return traer(tiendaId).then(function (resp) {
        var tarjetas = aTarjetas(resp);
        C.TEMAS.forEach(function (t) {
          var lista = tarjetas.filter(function (c) { return c.tema === t.id; });
          var box = cols[t.id];
          box.k.textContent = String(lista.length);
          clear(box.cards);
          if (!lista.length) { box.cards.appendChild(el("p", { class: "empty", text: "📱 ¡Cuelga la primera!" })); return; }
          lista.slice(0, C.MAX_TARJETAS_POR_TEMA).forEach(function (c) {
            var by = (c.nombre ? c.nombre + " · " : "") + rolEmoji(c.rol) + " " + (c.rol || "Participante");
            box.cards.appendChild(el("div", { class: "card" + (!primera && !vistos[c.id] ? " nueva" : ""), style: "background:" + t.color + ";color:" + t.texto }, [
              el("span", { class: "clip", "aria-hidden": "true" }), el("p", { text: c.texto }), el("div", { class: "by", text: by })
            ]));
          });
        });
        if (!primera) {
          var nuevas = resp.filter(function (r) { return !vistos[r.id + "-v"]; });
          nuevas.slice(0, 3).forEach(function (r, i) { setTimeout(function () { aviso("🎉 ¡Nuevas tarjetas! " + rolEmoji(r.rol) + " " + (r.nombre || r.rol)); }, i * 900); });
        }
        resp.forEach(function (r) { vistos[r.id + "-v"] = true; });
        tarjetas.forEach(function (c) { vistos[c.id] = true; });
        primera = false;
      });
    }, estado);
  }

  // ---------- 3 · resumen ----------
  var STOP = ("a al algo algun alguna algunas alguno algunos ante antes aqui asi aun cada como con contra cual cuales cuando de del desde donde dos el ella ellas ellos en entre era eramos es esa esas ese eso esos esta estaba estamos estan estar estas este esto estos fue fueron gran ha hace hacer hacia han hasta hay la las le les lo los mas me mi mis mucho muchos muy nada ni no nos nosotros nuestra nuestras nuestro nuestros o otra otras otro otros para pero poco por porque que quien se ser si sin sobre son su sus tambien tan te tener tenemos ti tiene todo todos tu tus un una unas uno unos y ya yo año años 2026 2027 cosas cosa poder puede pueden sea").split(" ");
  function sinTilde(w) { return w.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
  function palabras(textos, n) {
    var cuenta = {}, forma = {};
    textos.forEach(function (tx) {
      (tx.toLowerCase().match(/[a-záéíóúñü]+/g) || []).forEach(function (w) {
        var k = sinTilde(w);
        if (k.length < 4 || STOP.indexOf(k) !== -1) return;
        cuenta[k] = (cuenta[k] || 0) + 1;
        if (!forma[k]) forma[k] = w;
      });
    });
    return Object.keys(cuenta).sort(function (a, b) { return cuenta[b] - cuenta[a]; }).slice(0, n).map(function (k) { return { w: forma[k], n: cuenta[k] }; });
  }

  function vistaResumen() {
    var actual = tienda ? tiendaId : "todas";
    var box = el("div", { class: "res" });
    var estado = pantalla("resumen", box, { qr: !!tienda });
    bucle(function () { return traer(actual).then(pintar); }, estado);

    function pintar(resp) {
      clear(box);
      var tarjetas = aTarjetas(resp);
      if (!resp.length) { box.appendChild(el("div", { class: "res-vacio" }, [el("div", { class: "em", text: "📱" }), el("p", { text: "Aún no hay respuestas. ¡Escanea el QR para empezar!" })])); return; }

      // fila 1: personas, tarjetas y cómo nos fue
      var conExp = resp.filter(function (r) { return r.experiencia; });
      var caras = el("div", { class: "res-caras" }, C.EXPERIENCIA.slice().reverse().map(function (e) {
        var n = conExp.filter(function (r) { return r.experiencia === e.v; }).length;
        return el("div", { class: "res-cara" + (n ? "" : " cero") }, [el("span", { class: "em", text: e.emoji }), el("span", { class: "n", text: String(n) })]);
      }));
      box.appendChild(el("div", { class: "res-top" }, [
        el("div", { class: "res-stat" }, [el("div", { class: "v", text: String(resp.length) }), el("div", { class: "l", text: "👥 personas" })]),
        el("div", { class: "res-stat" }, [el("div", { class: "v", text: String(tarjetas.length) }), el("div", { class: "l", text: "🗂️ tarjetas" })]),
        el("div", { class: "res-block" }, [el("h3", { text: "😊 ¿Cómo nos fue?" }), caras])
      ]));

      // fila 2: los tres temas en círculos, con sus palabras
      box.appendChild(el("div", { class: "res-temas" }, C.TEMAS.map(function (t) {
        var lista = tarjetas.filter(function (c) { return c.tema === t.id; });
        var top = palabras(lista.map(function (c) { return c.texto; }), 5);
        var max = top.length ? top[0].n : 1;
        return el("div", { class: "res-tema" }, [
          el("div", { class: "res-tema-h" }, [
            el("div", { class: "circ lg", style: "background:" + t.color }, [el("span", { class: "circ-em", text: t.emoji }), el("span", { class: "circ-n", text: String(lista.length) })]),
            el("b", { text: t.titulo })
          ]),
          el("div", { class: "cloud" }, top.length ? top.map(function (x) {
            return el("span", { style: "font-size:" + (1 + 0.7 * x.n / max).toFixed(2) + "vw;border-color:" + t.color, text: x.w });
          }) : [el("span", { class: "nada", text: "Aún sin palabras" })])
        ]);
      })));

      // fila 3: comentarios
      var coms = resp.filter(function (r) { return r.comentario; }).sort(function (a, b) { return b.ts - a.ts; }).slice(0, 2);
      if (coms.length) {
        box.appendChild(el("div", { class: "res-coms" }, [el("h3", { text: "💬 Lo que nos contaron" })].concat(coms.map(function (r) {
          return el("div", { class: "res-com" }, [r.comentario, el("small", { text: (r.nombre ? r.nombre + " · " : "") + rolEmoji(r.rol) + " " + r.rol })]);
        }))));
      }
    }
  }

  // =====================================================================
  //  MODERACIÓN (en otro computador, con clave)
  // =====================================================================
  var CLAVE_KEY = "hito-pbv-clave";
  function modListar(clave, t) {
    if (DEMO) return Promise.resolve({ ok: true, respuestas: demoAll().filter(function (r) { return t === "todas" || r.tienda === t; }) });
    return post({ accion: "moderar", clave: clave, tienda: t });
  }
  function modVisible(clave, id, visible) {
    if (DEMO) {
      var all = demoAll(); all.forEach(function (r) { if (r.id === id) r.visible = visible; }); demoSave(all);
      return Promise.resolve({ ok: true });
    }
    return post({ accion: "visible", clave: clave, id: id, visible: visible });
  }

  function vistaModerar() {
    var clave = sessionStorage.getItem(CLAVE_KEY) || "";
    var actual = tienda ? tiendaId : "todas";
    var lista = el("div", { class: "mod-lista" });
    var estado = el("span", { class: "mod-estado" });
    var selector = el("div", { class: "mod-sel" }, [["todas", "Todas"]].concat(Object.keys(C.TIENDAS).map(function (id) { return [id, C.TIENDAS[id].emoji + " " + C.TIENDAS[id].nombre]; })).map(function (o) {
      return el("button", { type: "button", class: o[0] === actual ? "on" : "", text: o[1], onclick: function () { ir("?vista=moderar" + (o[0] === "todas" ? "" : "&tienda=" + o[0])); } });
    }));

    app.appendChild(el("div", { class: "mod" }, [
      demoBanner(),
      el("header", { class: "mod-head" }, [
        el("div", {}, [el("div", { class: "eyebrow", text: "Plan Buen Vecino 2026 · Hito de cierre" }), el("h1", { text: "🛡️ Moderar respuestas" }),
          el("p", { class: "hint", text: "Oculta lo que no deba verse en el tendedero ni en el resumen. Se puede volver a mostrar." })]),
        clioFoot("")
      ]),
      el("div", { class: "mod-bar" }, [selector, el("button", { type: "button", class: "mod-btn", text: "🔄 Actualizar", onclick: cargar }), estado]),
      lista
    ]));

    function pedirClave(msg) {
      clear(lista);
      var inp = el("input", { type: "password", placeholder: "Clave de moderación", autocomplete: "off" });
      var f = el("form", { class: "mod-clave", onsubmit: function (e) { e.preventDefault(); clave = inp.value.trim(); sessionStorage.setItem(CLAVE_KEY, clave); cargar(); } }, [
        el("label", { class: "lbl", text: "🔑 Clave de moderación" }), inp, el("button", { type: "submit", class: "mod-btn pri", text: "Entrar" }),
        msg ? el("p", { class: "err", text: msg }) : null
      ]);
      lista.appendChild(f); inp.focus();
    }

    function cargar() {
      if (!clave && !DEMO) return pedirClave();
      estado.textContent = "Cargando…";
      modListar(clave, actual).then(function (d) {
        if (!d.ok) { sessionStorage.removeItem(CLAVE_KEY); clave = ""; estado.textContent = ""; return pedirClave(d.error === "clave" ? "Clave incorrecta." : "No se pudo cargar (" + d.error + ")."); }
        pintar(d.respuestas.sort(function (a, b) { return b.ts - a.ts; }));
        estado.textContent = d.respuestas.length + " respuestas · " + new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
      }).catch(function () { estado.textContent = "🟠 Sin conexión"; });
    }

    function pintar(rs) {
      clear(lista);
      if (!rs.length) { lista.appendChild(el("p", { class: "hint", text: "Aún no hay respuestas." })); return; }
      rs.forEach(function (r) {
        var oculta = String(r.visible).toUpperCase() === "NO";
        var textos = [];
        if (r.comentario) textos.push(el("div", { class: "mod-t" }, [el("b", { text: "💬 " }), r.comentario]));
        C.TEMAS.forEach(function (t) { if (r[t.id]) textos.push(el("div", { class: "mod-t", style: "border-color:" + t.color }, [el("b", { text: t.emoji + " " }), r[t.id]])); });
        var btn = el("button", { type: "button", class: "mod-btn" + (oculta ? "" : " warn"), text: oculta ? "👁️ Mostrar" : "🙈 Ocultar", onclick: function () {
          btn.disabled = true;
          modVisible(clave, r.id, oculta ? "SI" : "NO").then(function (d) { if (!d.ok) throw new Error(d.error); cargar(); })
            .catch(function () { btn.disabled = false; estado.textContent = "😕 No se pudo cambiar. Intenta de nuevo."; });
        } });
        lista.appendChild(el("div", { class: "mod-item" + (oculta ? " oculta" : "") }, [
          el("div", { class: "mod-meta" }, [
            el("b", { text: (r.nombre || "🙈 Anónimo") + " · " + rolEmoji(r.rol) + " " + r.rol }),
            el("span", { text: (C.TIENDAS[r.tienda] ? C.TIENDAS[r.tienda].emoji + " " + C.TIENDAS[r.tienda].nombre + " · " : "") + new Date(r.ts).toLocaleString("es-CO", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) + (oculta ? " · OCULTA" : "") })
          ]),
          el("div", { class: "mod-textos" }, textos),
          btn
        ]));
      });
    }

    cargar();
    setInterval(function () { if (clave || DEMO) cargar(); }, 15000);
  }

  // ---------- arranque ----------
  if (vista === "moderar") vistaModerar();
  else if (vista === "relator") vistaRelatorInicio();
  else if ((vista === "resumen" || vista === "tablero") && (tienda || tiendaId === "todas")) vistaResumen();
  else if (tienda && vista === "instrucciones") vistaInstrucciones();
  else if (tienda && (vista === "tendedero" || vista === "pantalla")) vistaTendedero();
  else if (vista) vistaRelatorInicio();
  else vistaParticipar();
})();
