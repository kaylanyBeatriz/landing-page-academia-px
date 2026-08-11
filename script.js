(function () {
  "use strict";

  /* ============ Integração Academia PX — Caminho B (PostgREST direto) ============
     Ver README-LP-ACADEMIA.md. Chave pública (anon): só executa as 4 RPCs abaixo,
     não lê tabela nenhuma. Nunca chamar tabela direto. */
  var SB_URL = "https://supabase.px.center";
  var SB_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzY0MDAyOTM2fQ.dMGaLZiuABWuyamF_0qirSJzsOs5O_I9wTn5QP1MQtQ";
  // TODO: trocar para "website_academia_px" antes de publicar em produção.
  // _dev não dispara e-mail (ver README-LP-ACADEMIA.md).
  var SB_PROFILE = "website_academia_px_dev";
  var LP_SLUG = "curso-nr-35";
  var TOKEN_KEY = "academia_kit_nr35_token";
  var UNLOCKED_AT_KEY = "academia_kit_nr35_unlocked_at";
  var SESSION_TIMEOUT_MS = 15 * 60 * 1000; // sessão liberada dura 15min neste navegador
  var LOGIN_ENDPOINT = "/api/send-login.php"; // envia o e-mail com o link de acesso (Resend)
  var REGISTER_ENDPOINT = "/api/register-lead.php"; // cadastro + aviso por e-mail pro admin

  var SB_HEADERS = {
    apikey: SB_KEY,
    Authorization: "Bearer " + SB_KEY,
    "Content-Type": "application/json",
    "Content-Profile": SB_PROFILE,
  };

  function rpc(fn, body) {
    return fetch(SB_URL + "/rest/v1/rpc/" + fn, {
      method: "POST",
      headers: SB_HEADERS,
      body: JSON.stringify(body),
    }).then(function (r) {
      return r.text().then(function (text) {
        var data = null;
        try {
          data = text ? JSON.parse(text) : null;
        } catch (e) {
          data = null;
        }
        if (!r.ok) {
          var err = new Error((data && data.message) || text || "Erro na requisição");
          err.code = data && data.code;
          err.details = data && data.details;
          throw err;
        }
        return data;
      });
    });
  }

  var ICONS = {
    clipboard:
      '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 12h6M9 16h6"/></svg>',
    presentation:
      '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h20M4 3v13a1 1 0 0 0 1 1h5l-1 4h6l-1-4h5a1 1 0 0 0 1-1V3"/></svg>',
    book: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/></svg>',
    palette:
      '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2a10 10 0 1 0 0 20c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.062 0-.874.726-1.625 1.625-1.625H16.5a4.5 4.5 0 0 0 4.5-4.5C21 6 17 2 12 2Z"/></svg>',
    guide:
      '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>',
    lock: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
    download:
      '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5M12 15V3"/></svg>',
  };

  /* ============ Estado ============ */
  var state = {
    unlocked: false,
    leadName: null,
    materials: [],
    materialsLoaded: false,
    downloadingId: null,
    viewMode: "cadastro", // "cadastro" | "login"
  };

  /* ============ Toast ============ */
  function toast(message, type) {
    var container = document.getElementById("toast-container");
    var el = document.createElement("div");
    el.className = "toast toast--" + (type || "info");
    el.textContent = message;
    container.appendChild(el);
    setTimeout(function () {
      el.remove();
    }, 4000);
  }

  /* ============ Render materiais ============ */
  function renderMateriais() {
    var grid = document.getElementById("materiais-grid");
    grid.innerHTML = "";

    state.materials.forEach(function (material) {
      var card = document.createElement("article");
      card.className = "material-card";

      var isDownloading = state.downloadingId === material.id;
      var actionHtml;
      if (!state.unlocked) {
        actionHtml =
          '<button type="button" class="btn btn--outline btn--block" data-request-access>' +
          ICONS.lock +
          " Bloqueado</button>";
      } else if (isDownloading) {
        actionHtml =
          '<button type="button" class="btn btn--primary btn--block" disabled><span class="spinner"></span> Preparando...</button>';
      } else {
        actionHtml =
          '<button type="button" class="btn btn--primary btn--block" data-download="' +
          material.id +
          '">' +
          ICONS.download +
          " Baixar material</button>";
      }

      card.innerHTML =
        '<div class="material-card__blur">' +
        '<div class="material-card__head">' +
        '<span class="material-card__icon">' +
        (ICONS[material.icon] || ICONS.book) +
        "</span>" +
        '<span class="material-card__type">' +
        material.file_type +
        "</span>" +
        "</div>" +
        '<h3 class="material-card__title">' +
        material.title +
        "</h3>" +
        '<p class="material-card__desc">' +
        (material.description || "") +
        "</p>" +
        "</div>" +
        '<div class="material-card__action">' +
        actionHtml +
        "</div>";

      grid.appendChild(card);
    });

    var desc = document.getElementById("materiais-desc");
    if (!state.materialsLoaded) {
      desc.textContent = "Carregando materiais...";
    } else {
      desc.textContent = state.unlocked
        ? "Acesso liberado. Baixe quantas vezes quiser."
        : "Os downloads são liberados automaticamente após o preenchimento do formulário.";
    }

    grid.querySelectorAll("[data-download]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var material = state.materials.filter(function (m) {
          return m.id === btn.getAttribute("data-download");
        })[0];
        handleDownload(material);
      });
    });

    grid.querySelectorAll("[data-request-access]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        scrollToId("formulario");
      });
    });
  }

  function loadMaterials() {
    return rpc("lp_list_materials", { p_lp_slug: LP_SLUG })
      .then(function (materials) {
        state.materials = (materials || []).slice().sort(function (a, b) {
          return (a.sort_order || 0) - (b.sort_order || 0);
        });
        state.materialsLoaded = true;
        renderMateriais();
      })
      .catch(function (err) {
        state.materialsLoaded = true;
        renderMateriais();
        toast("Não foi possível carregar os materiais. Tente novamente.", "error");
      });
  }

  function handleDownload(material) {
    if (!material || !state.unlocked || state.downloadingId) return;

    var token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      lockAccess();
      toast("Sua sessão expirou. Faça o cadastro novamente.", "error");
      return;
    }

    state.downloadingId = material.id;
    renderMateriais();

    rpc("lp_register_download", { p_token: token, p_material_id: material.id })
      .then(function (res) {
        state.downloadingId = null;
        renderMateriais();
        if (res && res.download_url) {
          window.location.href = res.download_url;
        } else {
          toast("Link de download indisponível no momento.", "error");
        }
      })
      .catch(function (err) {
        state.downloadingId = null;
        renderMateriais();
        if (err.code === "28000") {
          lockAccess();
          toast("Sua sessão expirou. Faça o cadastro novamente.", "error");
        } else {
          toast("Não foi possível gerar o link. Tente novamente.", "error");
        }
      });
  }

  /* ============ Render header / hero (bloqueado x liberado) ============ */
  function renderUnlockAwareUI() {
    var unlocked = state.unlocked;

    var headerBtn = document.querySelector('[data-scroll-target="unlock-aware"]');
    headerBtn.textContent = unlocked ? "Acessar materiais" : "Liberar acesso";

    var heroCtaText = document.getElementById("hero-cta-text");
    heroCtaText.textContent = unlocked ? "Acessar meus materiais" : "Preencher e desbloquear";

    var loginState = document.getElementById("form-login-state");
    var lockedState = document.getElementById("form-locked-state");
    var unlockedState = document.getElementById("form-unlocked-state");

    if (unlocked) {
      loginState.hidden = true;
      lockedState.hidden = true;
      unlockedState.hidden = false;
      document.getElementById("unlocked-name").textContent = (state.leadName || "").split(" ")[0];
    } else if (state.viewMode === "login") {
      loginState.hidden = false;
      lockedState.hidden = true;
      unlockedState.hidden = true;
    } else {
      loginState.hidden = true;
      lockedState.hidden = false;
      unlockedState.hidden = true;
    }
  }

  function refreshUI() {
    renderUnlockAwareUI();
    renderMateriais();
  }

  function unlockAccess(leadName) {
    // Só marca a hora na primeira vez — recarregar a página dentro da janela
    // de 15min não deve "renovar" o cronômetro.
    if (!localStorage.getItem(UNLOCKED_AT_KEY)) {
      localStorage.setItem(UNLOCKED_AT_KEY, String(Date.now()));
    }
    state.unlocked = true;
    state.leadName = leadName;
    refreshUI();
  }

  function lockAccess() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(UNLOCKED_AT_KEY);
    state.unlocked = false;
    state.leadName = null;
    refreshUI();
  }

  function isSessionExpired() {
    var unlockedAt = localStorage.getItem(UNLOCKED_AT_KEY);
    if (!unlockedAt) return false;
    return Date.now() - Number(unlockedAt) > SESSION_TIMEOUT_MS;
  }

  /* ============ Scroll helpers ============ */
  function scrollToId(id) {
    var el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  document.querySelectorAll("[data-scroll-target]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var target = btn.getAttribute("data-scroll-target");
      if (target === "unlock-aware") {
        scrollToId(state.unlocked ? "materiais" : "formulario");
      } else {
        scrollToId(target);
      }
    });
  });

  /* ============ UTMs / origem ============ */
  function captureTrackingParams() {
    var params = new URLSearchParams(window.location.search);
    var fields = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "fbclid"];
    var out = {};
    fields.forEach(function (key) {
      var value = params.get(key);
      if (value) out[key] = value;
    });
    out.referrer = document.referrer || null;
    out.landing_page = window.location.href;
    return out;
  }

  /* ============ Validação do formulário ============ */
  function validate(values) {
    var errors = {};

    if (!values.full_name || values.full_name.trim().length < 3) {
      errors.nome_completo = "Informe seu nome completo";
    }
    if (!values.job_title || values.job_title.trim().length < 2) {
      errors.cargo = "Informe seu cargo";
    }
    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!values.email || !emailRe.test(values.email.trim())) {
      errors.email = "E-mail inválido";
    }
    var phoneRe = /^[\d\s()+-]+$/;
    var phone = (values.phone || "").trim();
    if (phone.length < 10 || phone.length > 20 || !phoneRe.test(phone)) {
      errors.telefone = "Telefone inválido";
    }
    if (!values.company || values.company.trim().length < 2) {
      errors.empresa = "Informe o nome da empresa";
    }
    if (values.consent_given !== true) {
      errors.consentimento = "É necessário aceitar a política de privacidade";
    }

    return errors;
  }

  function clearFieldErrors() {
    ["nome_completo", "cargo", "email", "telefone", "empresa", "consentimento"].forEach(function (
      name
    ) {
      var errorEl = document.getElementById("error-" + name);
      if (errorEl) errorEl.textContent = "";
      var input = document.getElementById(name);
      if (input && input.type !== "checkbox") input.removeAttribute("aria-invalid");
    });
  }

  function showFieldErrors(errors) {
    Object.keys(errors).forEach(function (name) {
      var errorEl = document.getElementById("error-" + name);
      if (errorEl) errorEl.textContent = errors[name];
      var input = document.getElementById(name);
      if (input && input.type !== "checkbox") input.setAttribute("aria-invalid", "true");
    });
  }

  var form = document.getElementById("lead-form");
  var submitBtn = document.getElementById("submit-btn");
  var submitBtnOriginalHtml = submitBtn.innerHTML;

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    var values = {
      full_name: document.getElementById("nome_completo").value,
      job_title: document.getElementById("cargo").value,
      email: document.getElementById("email").value,
      phone: document.getElementById("telefone").value,
      company: document.getElementById("empresa").value,
      consent_given: document.getElementById("consentimento").checked,
    };

    var errors = validate(values);
    clearFieldErrors();

    if (Object.keys(errors).length > 0) {
      showFieldErrors(errors);
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Enviando...';

    var payload = Object.assign(
      {
        full_name: values.full_name.trim(),
        job_title: values.job_title.trim(),
        email: values.email.trim().toLowerCase(),
        phone: values.phone.trim(),
        company: values.company.trim(),
        consent_given: true,
      },
      captureTrackingParams()
    );

    fetch(REGISTER_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(function (r) {
        return r.json().then(function (data) {
          if (!r.ok || !data || !data.success) {
            throw new Error((data && data.error) || "register_failed");
          }
          return data;
        });
      })
      .then(function (res) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = submitBtnOriginalHtml;

        localStorage.setItem(TOKEN_KEY, res.access_token);
        unlockAccess(res.full_name || payload.full_name);

        toast("Cadastro confirmado! Materiais liberados.", "success");
        setTimeout(function () {
          scrollToId("materiais");
        }, 300);
      })
      .catch(function () {
        submitBtn.disabled = false;
        submitBtn.innerHTML = submitBtnOriginalHtml;
        toast("Não foi possível concluir o cadastro. Tente novamente.", "error");
      });
  });

  /* ============ Login (usuário já cadastrado) ============
     Não libera acesso na hora: manda { full_name, email } pro backend
     (api/send-login.php), que registra/atualiza o lead via lp_register_lead e
     envia por e-mail (Resend) um link com o access_token. O acesso só é
     concedido quando a pessoa clica no link recebido (ver "Magic link" abaixo,
     na seção Init). Exige o backend em PHP publicado — não funciona no
     servidor estático de dev. */
  document.querySelectorAll("[data-show-login]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      state.viewMode = "login";
      refreshUI();
    });
  });
  document.querySelectorAll("[data-show-cadastro]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      state.viewMode = "cadastro";
      refreshUI();
    });
  });

  var loginForm = document.getElementById("login-form");
  var loginSubmitBtn = document.getElementById("login-submit-btn");
  var loginSubmitBtnOriginalHtml = loginSubmitBtn.innerHTML;

  function clearLoginErrors() {
    ["login_email"].forEach(function (name) {
      var errorEl = document.getElementById("error-" + name);
      if (errorEl) errorEl.textContent = "";
      var input = document.getElementById(name);
      if (input) input.removeAttribute("aria-invalid");
    });
  }

  loginForm.addEventListener("submit", function (event) {
    event.preventDefault();

    var email = document.getElementById("login_email").value.trim().toLowerCase();
    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    clearLoginErrors();
    if (!email || !emailRe.test(email)) {
      document.getElementById("error-login_email").textContent = "E-mail inválido";
      document.getElementById("login_email").setAttribute("aria-invalid", "true");
      return;
    }

    loginSubmitBtn.disabled = true;
    loginSubmitBtn.innerHTML = '<span class="spinner"></span> Enviando...';

    fetch(LOGIN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email }),
    })
      .then(function (r) {
        return r.json().then(function (data) {
          if (!r.ok || !data || !data.success) {
            var err = new Error((data && data.error) || "send_failed");
            err.code = data && data.error;
            throw err;
          }
          return data;
        });
      })
      .then(function () {
        loginSubmitBtn.disabled = false;
        loginSubmitBtn.innerHTML = loginSubmitBtnOriginalHtml;
        loginForm.reset();
        toast("Enviamos um link de acesso para " + email + ". Confira sua caixa de entrada.", "success");
      })
      .catch(function (err) {
        loginSubmitBtn.disabled = false;
        loginSubmitBtn.innerHTML = loginSubmitBtnOriginalHtml;
        if (err.code === "email_not_found") {
          document.getElementById("error-login_email").textContent =
            "E-mail não encontrado. Faça o cadastro completo abaixo.";
          document.getElementById("login_email").setAttribute("aria-invalid", "true");
        } else if (err.code === "rate_limited") {
          toast("Muitas tentativas. Aguarde um minuto e tente de novo.", "error");
        } else {
          toast("Não foi possível enviar o e-mail agora. Tente novamente em instantes.", "error");
        }
      });
  });

  /* ============ Magic link (clique no e-mail enviado pelo Resend) ============ */
  function consumeMagicLinkToken() {
    var params = new URLSearchParams(window.location.search);
    var token = params.get("login_token");
    if (!token) return null;

    params.delete("login_token");
    var cleanUrl =
      window.location.pathname + (params.toString() ? "?" + params.toString() : "") + window.location.hash;
    window.history.replaceState({}, "", cleanUrl);

    return token;
  }

  /* ============ Init ============ */
  document.getElementById("year").textContent = new Date().getFullYear();
  refreshUI();
  loadMaterials();

  var magicToken = consumeMagicLinkToken();
  var savedToken = magicToken || localStorage.getItem(TOKEN_KEY);

  if (magicToken) {
    // Clique no e-mail é sempre um desbloqueio novo: reinicia os 15min.
    localStorage.removeItem(UNLOCKED_AT_KEY);
  } else if (savedToken && isSessionExpired()) {
    // Sessão salva neste navegador, mas passou dos 15min: trava de novo
    // sem nem chamar o banco (o token em si continua válido por 180 dias
    // no servidor — isso é só o limite de sessão deste navegador).
    lockAccess();
    savedToken = null;
  }

  if (savedToken) {
    rpc("lp_validate_token", { p_token: savedToken })
      .then(function (res) {
        if (res && res.valid) {
          localStorage.setItem(TOKEN_KEY, savedToken);
          unlockAccess(res.full_name);
          if (magicToken) {
            toast("Acesso liberado pelo link enviado por e-mail!", "success");
            setTimeout(function () {
              scrollToId("materiais");
            }, 300);
          }
        } else {
          localStorage.removeItem(TOKEN_KEY);
          if (magicToken) toast("Este link expirou. Peça um novo acesso abaixo.", "error");
        }
      })
      .catch(function () {
        /* falha de rede não deve travar a página; usuário pode se cadastrar novamente */
      });
  }

  // Se a aba ficar aberta além dos 15min, trava sozinho sem precisar recarregar.
  setInterval(function () {
    if (state.unlocked && isSessionExpired()) {
      lockAccess();
      toast("Sua sessão de 15 minutos expirou. Acesse de novo pra continuar baixando.", "info");
    }
  }, 15000);
})();
