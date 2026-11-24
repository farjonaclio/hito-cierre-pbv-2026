(function () {
  "use strict";

  var C = window.HITO_CONFIG;
  var app = document.getElementById("app");
  var params = new URLSearchParams(location.search);
  var tiendaId = (params.get("tienda") || "").toLowerCase();
  var vista = (params.get("vista") || "").toLowerCase();
  var tienda = C.TIENDAS[tiendaId];
  var DEMO = !C.API_URL;
  var DEMO_KEY = "hito-pbv-demo-v2";
  var TEMA = {}; C.TEMAS.forEach(function (t) { TEMA[t.id] = t; });
  var ROL = {}; C.ROLES.forEach(function (r) { ROL[r.id] = r; });

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
  function demoBanner() {
    return DEMO ? el("div", { class: "demo", text: "Modo demostración: las respuestas se guardan solo en este navegador. Configura API_URL en config.js." }) : null;
  }
  function clioFoot(extra) {
    return el("div", { class: "clio" }, [el("img", { src: "clio.png", alt: "CliO Consulting" }), el("span", { text: extra || "CliO para IKEA · Plan Buen Vecino 2026" })]);
  }
  function rolEmoji(r) { return (ROL[r] && ROL[r].emoji) || "✨"; }

  // ---------- datos ----------
  function enviar(payload) {
    if (DEMO) {
      var all = JSON.parse(localStorage.getItem(DEMO_KEY) || "[]");
      all.push({
        id: String(Date.now()) + Math.random().toString(36).slice(2, 6), ts: Date.now(), tienda: payload.tienda,
        rol: payload.rol, nombre: payload.autorizacion ? payload.nombre : "", experiencia: payload.experiencia || null,
        logro: payload.logro, mejora: payload.mejora, sueno: payload.sueno
      });
      localStorage.setItem(DEMO_KEY, JSON.stringify(all));
      return Promise.resolve({ ok: true });
    }
    // text/plain evita la verificación previa (CORS) de Apps Script.
    return fetch(C.API_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) })
      .then(function (r) { return r.json(); });
  }
  function traer(t) {
    if (DEMO) {
      var all = JSON.parse(localStorage.getItem(DEMO_KEY) || "[]");
      return Promise.resolve(t === "todas" ? all : all.filter(function (r) { return r.tienda === t; }));
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

  // ---------- inicio: elegir tienda ----------
  function vistaInicio() {
    var links = Object.keys(C.TIENDAS).map(function (id) {
      return el("a", { href: "?tienda=" + id }, [C.TIENDAS[id].emoji + " ", C.TIENDAS[id].nombre]);
    });
    var org = el("div", { class: "org" }, [el("b", { text: "Para proyectar:" }), el("br")]);
    Object.keys(C.TIENDAS).forEach(function (id) {
      org.appendChild(document.createTextNode(C.TIENDAS[id].nombre + ": "));
      org.appendChild(el("a", { href: "?tienda=" + id + "&vista=instrucciones", text: "instrucciones" }));
      org.appendChild(document.createTextNode(" · "));
      org.appendChild(el("a", { href: "?tienda=" + id + "&vista=tendedero", text: "tendedero" }));
      org.appendChild(document.createTextNode(" · "));
      org.appendChild(el("a", { href: "?tienda=" + id + "&vista=tablero", text: "tablero" }));
      org.appendChild(el("br"));
    });
    org.appendChild(el("a", { href: "?tienda=todas&vista=tablero", text: "Tablero de las tres tiendas" }));

    app.appendChild(el("div", { class: "phone" }, [
      demoBanner(),
      el("div", { class: "p-head" }, [el("div", { class: "who" }, [el("img", { src: "pbv-sello.png", alt: "Plan Buen Vecino IKEA" }), "Plan Buen Vecino 2026"]), el("div", { class: "tab", text: "Hitos de cierre" })]),
      el("div", { class: "p-title" }, [el("div", { class: "eyebrow", text: "Bienvenida 👋" }), el("h1", { text: "Hagamos que siga pasando" })]),
      el("div", { class: "p-body" }, [el("p", { text: "¿En qué tienda estás hoy?" }), el("div", { class: "tiendas" }, links), org]),
      el("div", { class: "p-foot" }, [clioFoot()])
    ]));
  }

  // ---------- participación desde el celular ----------
  function vistaParticipar() {
    var s = { paso: 0, tienda: tiendaId, rol: "", nombre: "", anonimo: false, autorizacion: false, experiencia: 0, logro: "", mejora: "", sueno: "" };
    var PASOS = ["inicio", "quien", "experiencia"].concat(C.TEMAS.map(function (t) { return t.id; })).concat(["revisar"]);

    function shell(tabTxt, eyebrow, titulo, body, actions) {
      clear(app);
      var bar = el("div", { class: "bar", "aria-hidden": "true" });
      for (var i = 1; i < PASOS.length; i++) bar.appendChild(el("span", { class: i <= s.paso ? "on" : "" }));
      app.appendChild(el("div", { class: "phone" }, [
        demoBanner(),
        el("div", { class: "p-head" }, [
          el("div", { class: "who" }, [el("img", { src: "pbv-sello.png", alt: "Plan Buen Vecino IKEA" }), "PBV · " + C.TIENDAS[s.tienda].emoji + " " + C.TIENDAS[s.tienda].nombre]),
          el("div", { class: "tab", text: tabTxt })
        ]),
        s.paso > 0 ? bar : null,
        el("div", { class: "p-title" }, [el("div", { class: "eyebrow", text: eyebrow }), el("h1", { text: titulo })]),
        el("div", { class: "p-body" }, body),
        actions ? el("div", { class: "actions" }, actions) : null,
        el("div", { class: "p-foot" }, [clioFoot()])
      ]));
      window.scrollTo(0, 0);
    }
    function ir(n) { s.paso = n; render(); }
    function pasoTxt() { return "Paso " + s.paso + " de " + (PASOS.length - 1); }
    function error(n, msg) { n.textContent = msg; n.classList.remove("hidden"); }

    function render() {
      var p = PASOS[s.paso];
      if (p === "inicio") return inicio();
      if (p === "quien") return quien();
      if (p === "experiencia") return experiencia();
      if (p === "revisar") return revisar();
      return tema(TEMA[p]);
    }

    function inicio() {
      var howto = el("div", { class: "howto" }, C.TEMAS.map(function (t) {
        return el("div", { class: "row", style: "border-left:6px solid " + t.color }, [
          el("div", { class: "em", text: t.emoji }),
          el("b", { text: t.num + ". " + t.titulo })
        ]);
      }));
      shell("Bienvenida", "Hito de cierre 2026 💙", "Hagamos que siga pasando", [
        howto,
        el("div", { class: "badge", text: "⏱️ " + C.TIEMPO_MIN + " minutos · ¡mira el reloj en pantalla!" })
      ], [el("button", { class: "btn pri", type: "button", text: "Empezar 👉", onclick: function () { ir(1); } })]);
    }

    function quien() {
      var err = el("p", { class: "err hidden" });
      var chips = el("div", { class: "chips", role: "radiogroup", "aria-label": "¿Cómo participaste?" }, C.ROLES.map(function (r) {
        return el("button", { type: "button", class: "chip" + (s.rol === r.id ? " on" : ""), role: "radio", "aria-checked": String(s.rol === r.id), onclick: function () { s.rol = r.id; render(); } },
          [el("span", { class: "em", text: r.emoji }), r.id]);
      }));
      var tiendas = el("div", { class: "chips three", role: "radiogroup", "aria-label": "Tu tienda" }, Object.keys(C.TIENDAS).map(function (id) {
        return el("button", { type: "button", class: "chip" + (s.tienda === id ? " on" : ""), role: "radio", "aria-checked": String(s.tienda === id), onclick: function () { s.tienda = id; render(); } },
          [el("span", { class: "em", text: C.TIENDAS[id].emoji }), C.TIENDAS[id].nombre]);
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
        el("label", { class: "lbl", text: "🏬 Tu tienda" }), tiendas,
        el("label", { class: "lbl", text: "🙋 ¿Cómo participaste?" }), chips,
        el("div", {}, [el("label", { class: "lbl", for: "nombre", text: "✍️ Tu nombre" }), nombre]),
        el("label", { class: "check", for: "anon" }, [anon, el("span", { text: "🙈 Prefiero participar de forma anónima" })]),
        autBox,
        err
      ], [
        el("button", { class: "btn sec", type: "button", text: "Atrás", onclick: function () { ir(0); } }),
        el("button", { class: "btn pri", type: "button", text: "Siguiente 👉", onclick: function () {
          sync();
          if (!s.rol) return error(err, "👆 Elige cómo participaste.");
          if (s.nombre && !s.anonimo && !s.autorizacion) return error(err, "Autoriza tu nombre o marca 🙈 anónimo.");
          ir(2);
        } })
      ]);
    }

    function experiencia() {
      var scale = el("div", { class: "scale", role: "radiogroup", "aria-label": "Tu experiencia en 2026" }, C.EXPERIENCIA.map(function (e) {
        return el("button", { type: "button", class: s.experiencia === e.v ? "on" : "", role: "radio", "aria-checked": String(s.experiencia === e.v), "aria-label": e.txt, onclick: function () { s.experiencia = e.v; render(); } },
          [el("span", { class: "em", text: e.emoji }), el("small", { text: e.txt })]);
      }));
      shell(pasoTxt(), "Paso 2 · Calentemos motores 🔥", "¿Cómo te fue en el PBV 2026?", [
        scale
      ], [
        el("button", { class: "btn sec", type: "button", text: "Atrás", onclick: function () { ir(1); } }),
        el("button", { class: "btn pri", type: "button", text: s.experiencia ? "Siguiente 👉" : "Saltar", onclick: function () { ir(3); } })
      ]);
    }

    function tema(t) {
      var ta = el("textarea", { id: "txt", maxlength: String(C.MAX_CHARS), placeholder: t.ayuda });
      ta.value = s[t.id];
      var count = el("div", { class: "count" });
      function upd() { s[t.id] = ta.value; count.textContent = ta.value.length + " / " + C.MAX_CHARS; }
      ta.addEventListener("input", upd); upd();
      var ej = el("div", { class: "ejemplos" }, t.ejemplos.map(function (x) {
        return el("button", { type: "button", text: "💡 " + x, onclick: function () { ta.value = x; upd(); ta.focus(); } });
      }));
      shell(pasoTxt(), t.emoji + " " + t.titulo, t.pregunta, [
        el("div", { class: "tema-line", style: "background:" + t.color }),
        el("div", {}, [ta, count]),
        ej
      ], [
        el("button", { class: "btn sec", type: "button", text: "Atrás", onclick: function () { ir(s.paso - 1); } }),
        el("button", { class: "btn pri", type: "button", text: "Siguiente 👉", onclick: function () { ir(s.paso + 1); } })
      ]);
    }

    function revisar() {
      var err = el("p", { class: "err hidden" });
      var exp = C.EXPERIENCIA.filter(function (e) { return e.v === s.experiencia; })[0];
      var prev = el("div", { class: "preview" }, C.TEMAS.map(function (t) {
        var txt = s[t.id].trim();
        return txt
          ? el("div", { class: "mini", style: "background:" + t.color + ";color:" + t.texto }, [el("b", { text: t.emoji + " " + t.titulo }), txt])
          : el("div", { class: "mini vacia" }, [el("b", { text: t.emoji + " " + t.titulo }), "Sin respuesta"]);
      }));
      var quienTxt = (s.nombre && !s.anonimo && s.autorizacion ? s.nombre + " · " : "🙈 Anónimo · ") + rolEmoji(s.rol) + " " + s.rol;
      var back = el("button", { class: "btn sec", type: "button", text: "Atrás", onclick: function () { ir(s.paso - 1); } });
      var send = el("button", { class: "btn pri", type: "button", text: "Colgar en el tendedero 🚀", onclick: function () {
        var alguna = C.TEMAS.some(function (t) { return s[t.id].trim(); });
        if (!alguna) return error(err, "✍️ Escribe al menos una respuesta antes de enviar.");
        send.disabled = true; back.disabled = true; send.textContent = "Enviando…";
        var conNombre = !s.anonimo && !!s.nombre && s.autorizacion;
        var payload = { tienda: s.tienda, rol: s.rol, nombre: conNombre ? s.nombre : "", anonimo: !conNombre, autorizacion: conNombre, experiencia: s.experiencia || null };
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
        el("p", { class: "hint", text: quienTxt + (exp ? " · Experiencia " + exp.emoji : "") }),
        prev, err
      ], [back, send]);
    }

    function gracias() {
      clear(app);
      app.appendChild(el("div", { class: "phone" }, [
        el("div", { class: "p-head" }, [el("div", { class: "who" }, [el("img", { src: "pbv-sello.png", alt: "Plan Buen Vecino IKEA" }), "PBV · " + C.TIENDAS[s.tienda].emoji + " " + C.TIENDAS[s.tienda].nombre]), el("div", { class: "tab", text: "¡Listo!" })]),
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

  // ---------- marco de pantallas grandes ----------
  function pantalla(tabTxt, sub, contenido, conQR, extraTools, extraHead) {
    var qr = null;
    if (conQR && tienda) {
      var code = el("div", { class: "code", "aria-label": "Código QR para participar" });
      try { var q = window.qrcode(0, "M"); q.addData(url("?tienda=" + tiendaId)); q.make(); code.innerHTML = q.createSvgTag({ scalable: true, margin: 0 }); }
      catch (e) { code.textContent = "QR"; }
      qr = el("div", { class: "qr" }, [code, el("div", { class: "txt" }, ["📱 Escanea y participa", el("small", { text: url("?tienda=" + tiendaId).replace(/^https?:\/\//, "") })])]);
    }
    var estado = el("span", { text: "Conectando…" });
    var full = el("button", { type: "button", text: "⛶ Pantalla completa", onclick: function () {
      if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen();
    } });
    var nombreT = tienda ? tienda.emoji + " " + tienda.nombre : "Bogotá · Cali · Envigado";
    app.appendChild(el("div", { class: "big-screen" }, [
      demoBanner(),
      el("header", { class: "s-head" }, [
        el("div", {}, [
          el("div", { class: "eyebrow" }, [el("img", { src: "pbv-sello.png", alt: "Plan Buen Vecino IKEA" }), "Plan Buen Vecino 2026 · " + nombreT]),
          el("h1", { text: "Hagamos que siga pasando" }),
          sub ? el("div", { class: "sub", text: sub }) : null
        ]),
        el("div", { class: "right" }, [el("div", { class: "tab", text: tabTxt }), el("div", { class: "headrow" }, [extraHead || null, qr])])
      ]),
      contenido,
      el("footer", { class: "s-foot" }, [clioFoot(), el("div", { class: "tools" }, (extraTools || []).concat([estado, full]))])
    ]));
    return estado;
  }
  function bucle(fn, estado) {
    function ciclo() {
      fn().then(function () {
        estado.textContent = "🟢 En vivo · " + new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
      }).catch(function () { estado.textContent = "🟠 Sin conexión con la hoja, reintentando…"; })
        .then(function () { setTimeout(ciclo, C.REFRESH_MS); });
    }
    ciclo();
  }

  // ---------- reloj de cuenta regresiva (proyector) ----------
  var RELOJ_KEY = "hito-pbv-reloj";
  function relojEstado() {
    try { var r = JSON.parse(localStorage.getItem(RELOJ_KEY)); if (r && typeof r.restante === "number") return r; } catch (e) {}
    return { restante: C.TIEMPO_MIN * 60000, fin: null };
  }
  function relojGuardar(r) { try { localStorage.setItem(RELOJ_KEY, JSON.stringify(r)); } catch (e) {} }
  function reloj(grande) {
    var r = relojEstado();
    var cifra = el("div", { class: "rl-cifra" });
    var play = el("button", { type: "button" });
    var box = el("div", { class: "reloj" + (grande ? " grande" : "") }, [
      el("div", { class: "rl-top" }, [el("span", { text: "⏱️" }), cifra]),
      el("div", { class: "rl-btns" }, [
        play,
        el("button", { type: "button", text: "+1 min", onclick: function () { if (r.fin) r.fin += 60000; else r.restante += 60000; relojGuardar(r); pintar(); } }),
        el("button", { type: "button", text: "↺", "aria-label": "Reiniciar", onclick: function () { r = { restante: C.TIEMPO_MIN * 60000, fin: null }; relojGuardar(r); pintar(); } })
      ])
    ]);
    play.addEventListener("click", function () {
      if (r.fin) { r.restante = Math.max(0, r.fin - Date.now()); r.fin = null; }
      else { if (r.restante <= 0) r.restante = C.TIEMPO_MIN * 60000; r.fin = Date.now() + r.restante; }
      relojGuardar(r); pintar();
    });
    function pintar() {
      var ms = r.fin ? Math.max(0, r.fin - Date.now()) : r.restante;
      var seg = Math.ceil(ms / 1000);
      cifra.textContent = ms <= 0 ? "¡Tiempo! ⏰" : String(Math.floor(seg / 60)).padStart(2, "0") + ":" + String(seg % 60).padStart(2, "0");
      box.classList.toggle("corre", !!r.fin && ms > 0);
      box.classList.toggle("urgente", !!r.fin && ms > 0 && ms <= 30000);
      box.classList.toggle("fin", ms <= 0);
      play.textContent = r.fin && ms > 0 ? "⏸ Pausar" : "▶ Iniciar";
      if (r.fin && ms <= 0) { r = { restante: 0, fin: null }; relojGuardar(r); }
    }
    pintar();
    setInterval(pintar, 250);
    return box;
  }

  // ---------- aviso de tarjeta nueva (proyector) ----------
  function aviso(texto) {
    var t = el("div", { class: "toast", text: texto });
    document.body.appendChild(t);
    setTimeout(function () { t.classList.add("out"); }, 3200);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 3800);
  }

  // ---------- instrucciones (proyector, antes de los resultados) ----------
  function vistaInstrucciones() {
    var link = url("?tienda=" + tiendaId);
    var code = el("div", { class: "bigqr", "aria-label": "Código QR para participar" });
    try { var q = window.qrcode(0, "M"); q.addData(link); q.make(); code.innerHTML = q.createSvgTag({ scalable: true, margin: 0 }); }
    catch (e) { code.textContent = "QR"; }
    var pasos = [
      ["📱", "Escanea el QR"],
      ["🙋", "Elige tu tienda y tu rol"],
      ["😊", "Califica tu 2026"],
      ["🏆🔧🌱", "Responde 3 preguntas"],
      ["🧺", "¡Cuelga tus tarjetas!"]
    ];
    var lista = el("div", { class: "ins-steps" }, pasos.map(function (p, i) {
      return el("div", { class: "ins-step" }, [
        el("div", { class: "ins-n", text: String(i + 1) }),
        el("div", { class: "ins-em", text: p[0] }),
        el("b", { text: p[1] })
      ]);
    }));
    var temas = el("div", { class: "ins-temas" }, C.TEMAS.map(function (t) {
      return el("div", { class: "ins-tema", style: "background:" + t.color + ";color:" + t.texto }, [el("span", { text: t.emoji }), t.titulo]);
    }));
    var contenido = el("div", { class: "ins" }, [
      el("div", { class: "ins-left" }, [lista, temas]),
      el("div", { class: "ins-right" }, [code, reloj(true)])
    ]);
    var ir = el("button", { type: "button", text: "🧺 Ver tendedero 👉", onclick: function () { location.search = "?tienda=" + tiendaId + "&vista=tendedero"; } });
    var estado = pantalla("📋 ¿Cómo participar?", "", contenido, false, [ir]);
    estado.textContent = "";
  }

  // ---------- tendedero ----------
  function vistaTendedero() {
    var vistos = {}, primera = true, cols = {};
    var lines = el("div", { class: "lines" });
    C.TEMAS.forEach(function (t) {
      var k = el("span", { class: "k", text: "0" });
      var cards = el("div", { class: "cards" });
      cols[t.id] = { k: k, cards: cards };
      lines.appendChild(el("section", { class: "col", "aria-label": t.titulo }, [
        el("div", { class: "col-head" }, [el("span", { class: "em", text: t.emoji }), el("h2", { text: t.num + ". " + t.titulo }), k]),
        el("div", { class: "rope", style: "background:" + t.color }),
        cards
      ]));
    });
    var instr = el("button", { type: "button", text: "📋 Instrucciones", onclick: function () { location.search = "?tienda=" + tiendaId + "&vista=instrucciones"; } });
    var tablero = el("button", { type: "button", text: "📊 Ver tablero", onclick: function () { location.search = "?tienda=" + tiendaId + "&vista=tablero"; } });
    var estado = pantalla("🧺 Tendedero en vivo", "", lines, true, [instr, tablero], reloj(false));

    bucle(function () {
      return traer(tiendaId).then(function (resp) {
        var tarjetas = aTarjetas(resp);
        C.TEMAS.forEach(function (t) {
          var lista = tarjetas.filter(function (c) { return c.tema === t.id; });
          var box = cols[t.id];
          box.k.textContent = lista.length + " 🗂️";
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

  // ---------- tablero ----------
  var STOP = ("a al algo algun alguna algunas alguno algunos ante antes aqui asi aun cada como con contra cual cuales cuando de del desde donde dos el ella ellas ellos en entre era eramos es esa esas ese eso esos esta estaba estamos estan estar estas este esto estos fue fueron gran ha hace hacer hacia han hasta hay la las le les lo los mas me mi mis mucho muchos muy nada ni no nos nosotros nuestra nuestras nuestro nuestros o otra otras otro otros para pero poco por porque que quien se ser si sin sobre son su sus tambien tan te tener tenemos ti tiene todo todos tu tus un una unas uno unos y ya yo año años 2026 2027 cosas cosa poder puede pueden hacer ser sea").split(" ");
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
  function hbar(label, n, max, color) {
    var pct = max ? Math.round(n / max * 100) : 0;
    return el("div", { class: "hbar" }, [el("span", { text: label }), el("div", { class: "track" }, [el("div", { class: "fill", style: "width:" + pct + "%;background:" + (color || "#0058A3") })]), el("span", { class: "n", text: String(n) })]);
  }

  function vistaTablero() {
    var actual = tienda ? tiendaId : "todas";
    var dash = el("div", { class: "dash" });
    var selector = el("div", { class: "tiendasel" });
    [["todas", "🇨🇴 Todas"]].concat(Object.keys(C.TIENDAS).map(function (id) { return [id, C.TIENDAS[id].emoji + " " + C.TIENDAS[id].nombre]; })).forEach(function (o) {
      selector.appendChild(el("button", { type: "button", class: o[0] === actual ? "on" : "", text: o[1], onclick: function () {
        location.search = o[0] === "todas" ? "?tienda=todas&vista=tablero" : "?tienda=" + o[0] + "&vista=tablero";
      } }));
    });
    var tools = [selector];
    if (tienda) tools.push(el("button", { type: "button", text: "🧺 Ver tendedero", onclick: function () { location.search = "?tienda=" + tiendaId + "&vista=tendedero"; } }));
    var estado = pantalla("📊 Tablero en vivo", "", dash, !!tienda, tools);

    bucle(function () {
      return traer(actual).then(function (resp) { pintar(resp); });
    }, estado);

    function pintar(resp) {
      clear(dash);
      var tarjetas = aTarjetas(resp);
      var conExp = resp.filter(function (r) { return r.experiencia; });
      var prom = conExp.length ? conExp.reduce(function (a, r) { return a + r.experiencia; }, 0) / conExp.length : 0;
      var promEmoji = prom ? C.EXPERIENCIA[Math.min(4, Math.max(0, Math.round(prom) - 1))].emoji : "—";
      var anon = resp.filter(function (r) { return !r.nombre; }).length;

      dash.appendChild(el("div", { class: "kpis" }, [
        el("div", { class: "kpi" }, [el("div", { class: "em", text: "👥" }), el("div", { class: "v", text: String(resp.length) }), el("div", { class: "l", text: "personas participaron" })]),
        el("div", { class: "kpi" }, [el("div", { class: "em", text: "🗂️" }), el("div", { class: "v", text: String(tarjetas.length) }), el("div", { class: "l", text: "tarjetas en el tendedero" })]),
        el("div", { class: "kpi y" }, [el("div", { class: "em", text: promEmoji }), el("div", { class: "v", text: prom ? prom.toFixed(1).replace(".", ",") + " / 5" : "—" }), el("div", { class: "l", text: "experiencia 2026 (promedio)" })]),
        el("div", { class: "kpi y" }, [el("div", { class: "em", text: "🙈" }), el("div", { class: "v", text: resp.length ? Math.round(anon / resp.length * 100) + " %" : "—" }), el("div", { class: "l", text: "participó de forma anónima" })])
      ]));

      if (!resp.length) { dash.appendChild(el("p", { class: "nodata", text: "📱 Aún no hay respuestas. Escanea el QR para empezar." })); return; }

      var pExp = el("div", { class: "panel" }, [el("h3", { text: "😊 ¿Cómo fue el 2026?" })]);
      var maxE = 0, cE = {};
      C.EXPERIENCIA.forEach(function (e) { cE[e.v] = conExp.filter(function (r) { return r.experiencia === e.v; }).length; maxE = Math.max(maxE, cE[e.v]); });
      C.EXPERIENCIA.slice().reverse().forEach(function (e) { pExp.appendChild(hbar(e.emoji + " " + e.txt, cE[e.v], maxE, "#FFDB00")); });

      var pRol = el("div", { class: "panel" }, [el("h3", { text: "🙋 ¿Quiénes participaron?" })]);
      var cR = {}, maxR = 0;
      resp.forEach(function (r) { cR[r.rol] = (cR[r.rol] || 0) + 1; });
      Object.keys(cR).forEach(function (k) { maxR = Math.max(maxR, cR[k]); });
      C.ROLES.forEach(function (r) { if (cR[r.id]) pRol.appendChild(hbar(r.emoji + " " + r.id, cR[r.id], maxR)); });

      var pTem = el("div", { class: "panel" }, [el("h3", { text: actual === "todas" ? "🏬 Participación por tienda" : "🗂️ Tarjetas por tema" })]);
      if (actual === "todas") {
        var cT = {}, maxT = 0;
        resp.forEach(function (r) { cT[r.tienda] = (cT[r.tienda] || 0) + 1; });
        Object.keys(cT).forEach(function (k) { maxT = Math.max(maxT, cT[k]); });
        Object.keys(C.TIENDAS).forEach(function (id) { pTem.appendChild(hbar(C.TIENDAS[id].emoji + " " + C.TIENDAS[id].nombre, cT[id] || 0, maxT)); });
      } else {
        var maxM = 0, cM = {};
        C.TEMAS.forEach(function (t) { cM[t.id] = tarjetas.filter(function (c) { return c.tema === t.id; }).length; maxM = Math.max(maxM, cM[t.id]); });
        C.TEMAS.forEach(function (t) { pTem.appendChild(hbar(t.emoji + " " + t.titulo, cM[t.id], maxM, t.color)); });
      }
      dash.appendChild(el("div", { class: "panels" }, [pExp, pRol, pTem]));

      dash.appendChild(el("div", { class: "words" }, C.TEMAS.map(function (t) {
        var top = palabras(tarjetas.filter(function (c) { return c.tema === t.id; }).map(function (c) { return c.texto; }), 8);
        var max = top.length ? top[0].n : 1;
        var cloud = el("div", { class: "cloud" }, top.length ? top.map(function (x) {
          var size = (0.85 + 0.65 * x.n / max).toFixed(2);
          return el("span", { style: "font-size:" + size + "vw;background:" + t.color + ";color:" + t.texto, title: x.n + " veces", text: x.w });
        }) : [el("span", { class: "nodata", text: "Sin palabras aún" })]);
        return el("div", { class: "panel" }, [el("h3", { text: t.emoji + " Palabras que más se repiten · " + t.titulo }), cloud]);
      })));

      dash.appendChild(el("div", { class: "panel" }, [
        el("h3", { text: "🆕 Últimas tarjetas" }),
        el("div", { class: "latest" }, tarjetas.slice(0, 4).map(function (c) {
          var t = TEMA[c.tema];
          return el("div", { class: "mini", style: "background:" + t.color + ";color:" + t.texto }, [el("b", { text: t.emoji + " " + t.titulo + " · " + (c.nombre ? c.nombre + " · " : "") + rolEmoji(c.rol) + " " + c.rol }), c.texto]);
        }))
      ]));
    }
  }

  // ---------- arranque ----------
  if (vista === "tablero" && (tienda || tiendaId === "todas")) vistaTablero();
  else if (!tienda) vistaInicio();
  else if (vista === "instrucciones") vistaInstrucciones();
  else if (vista === "tendedero" || vista === "pantalla") vistaTendedero();
  else vistaParticipar();
})();
