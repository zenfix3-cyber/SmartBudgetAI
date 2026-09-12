/* ============ SmartBudget AI — demo walkthrough & interactivity ============ */
(function () {
  "use strict";

  /* ---------- mobile nav ---------- */
  var navToggle = document.getElementById("navToggle");
  var navLinks = document.getElementById("navLinks");
  navToggle.addEventListener("click", function () { navLinks.classList.toggle("open"); });
  navLinks.addEventListener("click", function (e) {
    if (e.target.tagName === "A") navLinks.classList.remove("open");
  });

  /* ---------- scroll reveal ---------- */
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) { entry.target.classList.add("visible"); observer.unobserve(entry.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach(function (el) { observer.observe(el); });

  /* ---------- demo steps (Appendix M.6 walkthrough) ---------- */
  var STUDENT_MSG =
    "You're currently on track to exceed your monthly budget by approximately S$65. " +
    "Food spending is the main reason and is 25% higher than usual. Limiting food-delivery " +
    "spending to S$30 for the next 12 days would help you stay close to budget without " +
    "reducing your planned savings.";
  var WHY_TEXT =
    "Your recent food spending increased the projected monthly total above your budget. " +
    "Reason codes: SPENDING_VELOCITY_HIGH · CATEGORY_ANOMALY · SAVINGS_GOAL_AT_RISK.";

  var REQUEST_1 = {
    requestId: "req_001",
    eventType: "transaction.created",
    user: { userId: "12345", currency: "SGD", timezone: "Asia/Singapore" },
    financialContext: {
      monthlyBudget: 600,
      spentToDate: 445,
      daysRemaining: 12,
      categoryBudgets: { food: 220, transport: 100, entertainment: 80, other: 200 }
    },
    preferences: { notificationFrequency: "low" },
    consent: { analyzeTransactions: true, sendProactiveAlerts: true, executeFinancialActions: false }
  };

  var RESPONSE_1 = {
    requestId: "req_001",
    agent: "student_budget_guardian",
    status: "completed",
    evaluation: {
      riskLevel: "high",
      riskScore: 82,
      projectedMonthEndSpend: 665,
      projectedOverspend: 65,
      confidence: 0.86,
      primaryRiskCategory: "food",
      daysRemaining: 12
    },
    decision: {
      actionType: "category_adjustment_recommendation",
      authorization: "recommendation",
      requiresApproval: false
    },
    notification: {
      shouldNotify: true,
      channel: "in_app",
      deduplicationKey: "12345-food-overspend-2026-09",
      cooldownHours: 72
    },
    proposedAction: null,
    errors: []
  };

  var FEEDBACK = {
    requestId: "req_002",
    eventType: "recommendation.feedback",
    feedback: { recommendationId: "rec_001", response: "accepted" }
  };

  var steps = [
    {
      title: "Student adds a S$35 food-delivery order",
      actor: "Student",
      note: "An ordinary moment: one food-delivery order near the end of the month. The student doesn't think about budgets. The agent does.",
      jsonDir: "Base44 app", jsonEta: "POST /transactions",
      json: { id: "txn_987", category: "food", amount: 35, currency: "SGD", merchantType: "food_delivery" },
      run: function (ui) { ui.show("txnRow"); }
    },
    {
      title: "Base44 sends transaction.created to the agent",
      actor: "Base44 → RealRelay",
      note: "Base44 emits the event and calls POST /agent/evaluate with the full financial context — budget, spending, goal progress, preferences, and consent. Idempotency key attached; replay-safe.",
      jsonDir: "Base44 → RealRelay", jsonEta: "POST /agent/evaluate",
      json: REQUEST_1,
      run: function (ui) { ui.show("evalBadge"); }
    },
    {
      title: "Deterministic engine computes the risk",
      actor: "RealRelay (code, not LLM)",
      note: "Conventional code — never the LLM — projects month-end spend of S$665 vs the S$600 budget: S$65 projected overspend, risk score 82 (high), confidence 0.86.",
      jsonDir: "RealRelay → Base44", jsonEta: "200 OK · structured decision",
      json: RESPONSE_1,
      run: function (ui) {
        ui.hide("evalBadge");
        ui.marker(true);
        ui.projectionLabel("Projected month-end: S$665 · over budget");
        ui.spentWarn(true);
      }
    },
    {
      title: "Reasoning layer picks ONE intervention",
      actor: "RealRelay agent",
      note: "The agent selects a category-adjustment recommendation. It does NOT propose a transfer — consent.executeFinancialActions is false, so proposedAction stays null. Every recommendation is specific, measurable, achievable, and time-bounded.",
      jsonDir: "RealRelay → Base44", jsonEta: "decision + recommendation",
      json: {
        recommendation: {
          title: "Adjust food-delivery spending",
          message: "Limit food-delivery spending to S$30 for the next 12 days to stay close to your monthly budget.",
          suggestedAmount: 30,
          currency: "SGD",
          validUntil: "2026-09-24"
        },
        explanation: {
          reasonCodes: ["SPENDING_VELOCITY_HIGH", "CATEGORY_ANOMALY", "SAVINGS_GOAL_AT_RISK"],
          plainLanguage: "Your recent food spending increased the projected monthly total above your budget."
        },
        proposedAction: null
      },
      run: function () {}
    },
    {
      title: "Student sees the in-app alert",
      actor: "Base44 → Student",
      note: "The alert surfaces in under 2 seconds, phrased without judgment. Duplicate alerts are suppressed for 72 hours via the dedup key. An audit record is stored in Base44.",
      jsonDir: "Base44", jsonEta: "in_app notification",
      json: { channel: "in_app", shouldNotify: true, cooldownHours: 72, deduplicationKey: "12345-food-overspend-2026-09" },
      run: function (ui) {
        ui.show("alertCard");
        ui.alertMsg(STUDENT_MSG);
        ui.bell(true);
      }
    },
    {
      title: "Student accepts → feedback closes the loop",
      actor: "Student → Base44 → RealRelay",
      note: "Accept, dismiss, or modify — every response returns to /agent/feedback. The agent adapts tone, timing, and suggested amounts. It can never expand its own permissions. Learning stays per-user and within consent.",
      jsonDir: "Base44 → RealRelay", jsonEta: "POST /agent/feedback",
      json: FEEDBACK,
      run: function (ui) {
        ui.hide("alertCard");
        ui.show("acceptedCard");
        ui.bell(false);
      }
    }
  ];

  /* ---------- ui handle ---------- */
  var els = {
    txnRow: document.getElementById("txnRow"),
    evalBadge: document.getElementById("evalBadge"),
    alertCard: document.getElementById("alertCard"),
    acceptedCard: document.getElementById("acceptedCard"),
    marker: document.getElementById("barProjection"),
    projectionLabel: document.getElementById("projectionLabel"),
    barSpent: document.getElementById("barSpent"),
    appBell: document.getElementById("appBell"),
    alertMsg: document.getElementById("alertMsg"),
    whyLink: document.getElementById("whyLink"),
    whyText: document.getElementById("whyText"),
    acceptBtn: document.getElementById("acceptBtn"),
    jsonView: document.getElementById("jsonView"),
    jsonDir: document.getElementById("jsonDir"),
    jsonEta: document.getElementById("jsonEta"),
    demoNote: document.getElementById("demoNote"),
    demoSteps: document.getElementById("demoSteps"),
    spentValue: document.getElementById("spentValue")
  };

  var ui = {
    show: function (id) { var el = document.getElementById(id); if (el) el.hidden = false; },
    hide: function (id) { var el = document.getElementById(id); if (el) el.hidden = true; },
    marker: function (on) { els.marker.classList.toggle("show", on); },
    projectionLabel: function (t) { els.projectionLabel.textContent = t; },
    spentWarn: function (on) { els.barSpent.classList.toggle("warn", on); },
    bell: function (on) { els.appBell.classList.toggle("flash", on); },
    alertMsg: function (t) { els.alertMsg.textContent = t; }
  };

  /* ---------- json renderer ---------- */
  function escapeHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function renderJson(obj) {
    var raw = JSON.stringify(obj, null, 2);
    var html = escapeHtml(raw)
      .replace(/&quot;([^&]*?)&quot;(\s*:)/g, '<span class="k">"$1"</span>$2')
      .replace(/:\s&quot;([^&]*?)&quot;/g, ': <span class="s">"$1"</span>')
      .replace(/:\s(\d+(?:\.\d+)?)/g, ': <span class="n">$1</span>')
      .replace(/:\s(true|false)/g, ': <span class="b">$1</span>')
      .replace(/:\snull/g, ': <span class="z">null</span>');
    els.jsonView.innerHTML = html;
  }

  /* ---------- step engine ---------- */
  var current = -1;
  var playing = false;
  var timer = null;

  steps.forEach(function (s, i) {
    var li = document.createElement("li");
    li.innerHTML = '<span class="num">0' + (i + 1) + "</span><span>" + s.title + "</span>";
    li.addEventListener("click", function () { stop(); goTo(i); });
    els.demoSteps.appendChild(li);
  });

  function paintSteps() {
    Array.prototype.forEach.call(els.demoSteps.children, function (li, i) {
      li.classList.toggle("active", i === current);
      li.classList.toggle("done", i < current);
    });
  }

  function resetPhone() {
    ["txnRow", "evalBadge", "alertCard", "acceptedCard"].forEach(function (id) { ui.hide(id); });
    ui.marker(false);
    ui.spentWarn(false);
    ui.bell(false);
    ui.projectionLabel("18 days in · 12 to go");
    els.whyText.hidden = true;
  }

  function goTo(i) {
    if (i < 0 || i >= steps.length) return;
    current = i;
    resetPhone();
    for (var k = 0; k <= i; k++) steps[k].run(ui);
    els.demoNote.textContent = steps[i].note;
    els.jsonDir.textContent = steps[i].jsonDir;
    els.jsonEta.textContent = steps[i].jsonEta;
    renderJson(steps[i].json);
    paintSteps();
  }

  function next() {
    if (current + 1 >= steps.length) { stop(); goTo(0); return; }
    goTo(current + 1);
  }

  var playBtn = document.getElementById("demoPlay");
  function play() {
    playing = true;
    playBtn.textContent = "⏸ Pause";
    if (current === steps.length - 1) goTo(0);
    timer = setInterval(next, 3000);
  }
  function stop() {
    playing = false;
    playBtn.textContent = "▶ Play";
    clearInterval(timer);
  }

  playBtn.addEventListener("click", function () { playing ? stop() : play(); });
  document.getElementById("demoNext").addEventListener("click", function () { stop(); next(); });
  document.getElementById("demoReset").addEventListener("click", function () { stop(); goTo(-1); resetPhone(); paintSteps(); renderJson({ hint: "Press Play to run the six-step walkthrough, or click a step." }); els.demoNote.textContent = "This scenario uses fully synthetic data — the same walkthrough used in the RealRelay integration spec (Appendix M.6)."; current = -1; });

  els.acceptBtn.addEventListener("click", function () { stop(); goTo(5); });
  els.whyLink.addEventListener("click", function () {
    els.whyText.textContent = WHY_TEXT;
    els.whyText.hidden = !els.whyText.hidden;
  });

  /* initial state */
  goTo(-1);
  renderJson({ hint: "Press Play to run the six-step walkthrough, or click a step." });
  els.demoNote.textContent = "This scenario uses fully synthetic data — the same walkthrough used in the RealRelay integration spec (Appendix M.6).";
  paintSteps();
})();
