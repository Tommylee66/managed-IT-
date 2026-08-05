"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export function SalesAgentGuide() {
  const t = useTranslations("guide");
  const [current, setCurrent] = useState(0);

  const stepLabels = [
    t("stepIntro"),
    t("stepLogin"),
    t("stepDashboard"),
    t("stepCustomer"),
    t("stepQuoteForm"),
    t("stepQuoteResult"),
    t("stepContractCreate"),
    t("stepContractDetail"),
    t("stepChangeRequest"),
    t("stepCommission"),
    t("stepClosing"),
  ];
  const last = stepLabels.length - 1;

  function go(i: number) {
    setCurrent(Math.max(0, Math.min(last, i)));
  }

  return (
    <div className="bct-guide">
      <style>{GUIDE_CSS}</style>
      <div className="g-wrap">
        <div className="g-shell">
          <div className="g-masthead">
            <div className="g-brand">
              <div className="g-logo">BCT</div>
              <div>
                <h1>{t("brandTitle")}</h1>
                <p>{t("brandSubtitle")}</p>
              </div>
            </div>
            <div className="g-progress-pill">{t("progress", { current: current + 1, total: stepLabels.length })}</div>
          </div>

          <div className="g-layout">
            <nav className="g-rail" aria-label="steps">
              {stepLabels.map((label, i) => (
                <button
                  key={label}
                  type="button"
                  className={`g-rail-item${i === current ? " active" : ""}${i < current ? " done" : ""}`}
                  onClick={() => go(i)}
                >
                  <span className="g-rail-num">{i + 1}</span>
                  <span>{label}</span>
                </button>
              ))}
            </nav>

            <main className="g-panel">
              {current === 0 && <StepIntro t={t} />}
              {current === 1 && <StepLogin t={t} />}
              {current === 2 && <StepDashboard t={t} />}
              {current === 3 && <StepCustomer t={t} />}
              {current === 4 && <StepQuoteForm t={t} />}
              {current === 5 && <StepQuoteResult t={t} />}
              {current === 6 && <StepContractCreate t={t} />}
              {current === 7 && <StepContractDetail t={t} />}
              {current === 8 && <StepChangeRequest t={t} />}
              {current === 9 && <StepCommission t={t} />}
              {current === 10 && <StepClosing t={t} />}

              <div className="g-nav-row">
                <button type="button" className="g-nav-btn prev" disabled={current === 0} onClick={() => go(current - 1)}>
                  {t("prev")}
                </button>
                <button type="button" className="g-nav-btn next" onClick={() => go(current === last ? 0 : current + 1)}>
                  {current === last ? t("restart") : t("next")}
                </button>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}

type T = ReturnType<typeof useTranslations>;

function StepIntro({ t }: { t: T }) {
  return (
    <section className="g-step">
      <p className="g-eyebrow">{t("step0Eyebrow")}</p>
      <h2>{t("step0Title")}</h2>
      <p className="g-lede">{t("step0Lede")}</p>
      <div className="g-tip">
        <b>{t("step0TipTitle")}</b>
        <br />
        {t("step0TipBody")}
      </div>
      <div className="g-menu-grid" style={{ maxWidth: 520 }}>
        <div className="g-menu-section">
          <h4>{t("mockSectionCustomerSales")}</h4>
          <div className="g-menu-card"><span className="g-ic">🏢</span>{t("mockMenuCustomers")}</div>
          <div className="g-menu-card"><span className="g-ic">💰</span>{t("mockMenuMyCommission")}</div>
        </div>
        <div className="g-menu-section">
          <h4>{t("mockSectionAppContract")}</h4>
          <div className="g-menu-card"><span className="g-ic">🔎</span>{t("mockMenuLookup")}</div>
          <div className="g-menu-card"><span className="g-ic">🧾</span>{t("mockMenuNewApplication")}</div>
          <div className="g-menu-card"><span className="g-ic">📄</span>{t("mockMenuContract")}</div>
          <div className="g-menu-card"><span className="g-ic">🔁</span>{t("mockMenuChangeRequest")}</div>
        </div>
      </div>
    </section>
  );
}

function StepLogin({ t }: { t: T }) {
  return (
    <section className="g-step">
      <p className="g-eyebrow">{t("step1Eyebrow")}</p>
      <h2>{t("step1Title")}</h2>
      <p className="g-lede">{t("step1Lede")}</p>
      <div className="g-frame">
        <div className="g-frame-bar"><span /><span /><span /></div>
        <div className="g-frame-body">
          <div style={{ display: "flex", justifyContent: "center", padding: "36px 16px" }}>
            <div className="g-login-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <b style={{ fontSize: 14 }}>{t("mockAppName")}</b>
                <span className="g-mock-pill">{t("mockLanguagePill")}</span>
              </div>
              <p style={{ fontSize: 11.5, color: "var(--guide-muted)", margin: "0 0 14px" }}>{t("mockLoginPrompt")}</p>
              <div className="g-field" style={{ marginBottom: 10 }}><label>{t("mockEmailLabel")}</label><div className="g-val">agent03@bct.co.id</div></div>
              <div className="g-field" style={{ marginBottom: 8 }}><label>{t("mockPasswordLabel")}</label><div className="g-val">••••••••••••</div></div>
              <p style={{ fontSize: 10.5, color: "var(--guide-teal)", textAlign: "right", margin: "0 0 12px" }}>{t("mockForgotPassword")}</p>
              <div className="g-btn primary" style={{ width: "100%", justifyContent: "center" }}>{t("mockLoginButton")}</div>
            </div>
          </div>
        </div>
      </div>
      <div className="g-tip warn">
        <b>{t("step1TipTitle")}</b>
        <br />
        {t("step1TipBody")}
      </div>
    </section>
  );
}

function StepDashboard({ t }: { t: T }) {
  return (
    <section className="g-step">
      <p className="g-eyebrow">{t("step2Eyebrow")}</p>
      <h2>{t("step2Title")}</h2>
      <p className="g-lede">{t("step2Lede")}</p>
      <div className="g-frame">
        <div className="g-frame-bar"><span /><span /><span /></div>
        <div className="g-frame-body">
          <div className="g-mock-topbar">
            <span className="g-mock-logo">{t("mockAppName")}</span>
            <div className="g-mock-actions"><span>{t("mockStaffBadge")}</span><span className="g-mock-pill">{t("mockHomeButton")}</span><span>{t("mockLanguagePill")}</span><span>{t("mockLogout")}</span></div>
          </div>
          <div className="g-mock-pad">
            <div className="g-mock-hero">
              <h3>{t("mockHeroTitle")}</h3>
              <p>{t("mockHeroSubtitle")}</p>
              <div className="g-stat-row">
                <div className="g-stat-card"><div className="l">{t("mockStatNewCustomers")}</div><div className="v">0</div></div>
                <div className="g-stat-card"><div className="l">{t("mockStatNewContracts")}</div><div className="v">0</div></div>
                <div className="g-stat-card"><div className="l">{t("mockStatActiveAgents")}</div><div className="v">4</div></div>
                <div className="g-stat-card"><div className="l">{t("mockStatPendingActivation")}</div><div className="v">0</div></div>
              </div>
            </div>
            <div className="g-menu-grid">
              <div className="g-menu-section">
                <h4>{t("mockSectionCustomerSales")}</h4>
                <div className="g-menu-card"><span className="g-ic">🏢</span>{t("mockMenuCustomers")}</div>
                <div className="g-menu-card highlight"><span className="g-ic">💰</span>{t("mockMenuMyCommission")}</div>
              </div>
              <div className="g-menu-section">
                <h4>{t("mockSectionAppContract")}</h4>
                <div className="g-menu-card"><span className="g-ic">🔎</span>{t("mockMenuLookup")}</div>
                <div className="g-menu-card"><span className="g-ic">🧾</span>{t("mockMenuNewApplication")}</div>
                <div className="g-menu-card"><span className="g-ic">📄</span>{t("mockMenuContract")}</div>
                <div className="g-menu-card"><span className="g-ic">🔁</span>{t("mockMenuChangeRequest")}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="g-tip">
        <b>{t("step2TipTitle")}</b>
        <br />
        {t("step2TipBody")}
      </div>
    </section>
  );
}

function StepCustomer({ t }: { t: T }) {
  return (
    <section className="g-step">
      <p className="g-eyebrow">{t("step3Eyebrow")}</p>
      <h2>{t("step3Title")}</h2>
      <p className="g-lede">{t("step3Lede")}</p>
      <div className="g-frame">
        <div className="g-frame-bar"><span /><span /><span /></div>
        <div className="g-frame-body">
          <div className="g-mock-pad">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <b style={{ fontSize: 14 }}>{t("mockCustomerListTitle")}</b>
              <span className="g-btn primary">{t("mockNewCustomerButton")}</span>
            </div>
            <table className="g-mock-table">
              <tbody>
                <tr><th>{t("mockColCode")}</th><th>{t("mockColCustomerName")}</th><th>{t("mockColManager")}</th><th>{t("mockColContact")}</th><th>{t("mockColEmail")}</th><th>{t("mockColStatus")}</th></tr>
                <tr>
                  <td>CUS002</td><td>PT. Sung Shin Best Indonesia</td><td>-</td>
                  <td className="masked">***</td><td className="masked">***@***.***</td>
                  <td><span className="g-badge neutral">{t("mockStatusUncontracted")}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <p className="g-lede" style={{ marginTop: 2 }}>{t("step3Lede2")}</p>
      <div className="g-frame">
        <div className="g-frame-bar"><span /><span /><span /></div>
        <div className="g-frame-body">
          <div className="g-mock-pad" style={{ maxWidth: 420, margin: "0 auto" }}>
            <b style={{ fontSize: 13 }}>{t("mockCustomerRegisterTitle")}</b>
            <div className="g-field" style={{ margin: "10px 0" }}><label>{t("mockCustomerNameLabel")}</label><div className="g-val filled">({t("mockExampleTag")}) {t("mockExampleCompany")}</div></div>
            <div className="g-field-row">
              <div className="g-field"><label>{t("mockManagerLabel")}</label><div className="g-val filled">Budi Santoso</div></div>
              <div className="g-field"><label>{t("mockContactLabel")}</label><div className="g-val filled">081234567890</div></div>
            </div>
            <div className="g-field" style={{ marginBottom: 10 }}><label>{t("mockAgentLabel")}</label><div className="g-val locked">AGT003 - Heedo Park ({t("mockAutoTag")})</div></div>
            <div className="g-btn primary" style={{ width: "100%", justifyContent: "center" }}>{t("mockRegisterButton")}</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StepQuoteForm({ t }: { t: T }) {
  return (
    <section className="g-step">
      <p className="g-eyebrow">{t("step4Eyebrow")}</p>
      <h2>{t("step4Title")}</h2>
      <p className="g-lede">{t("step4Lede")}</p>
      <div className="g-frame">
        <div className="g-frame-bar"><span /><span /><span /></div>
        <div className="g-frame-body">
          <div className="g-mock-pad">
            <div className="g-field" style={{ marginBottom: 10 }}><label>{t("mockCustomerFieldLabel")}</label><div className="g-val filled">CUS002 - PT. Sung Shin Best Indonesia</div></div>
            <div className="g-field" style={{ marginBottom: 10 }}><label>{t("mockAgentFieldLabel")}</label><div className="g-val locked">AGT003 - Heedo Park ({t("mockAutoTag")})</div></div>
            <div className="g-field-row">
              <div className="g-field"><label>{t("mockContractMonthsLabel")}</label><div className="g-val filled">36</div></div>
              <div className="g-field"><label>{t("mockEmployeeCountLabel")}</label><div className="g-val filled">20</div></div>
            </div>
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--guide-muted)", margin: "12px 0 4px" }}>{t("mockEquipmentSectionLabel")}</p>
            <div className="g-checklist-row">
              <div className="g-chk on" />
              <div><div className="name">TP LINK EAP110 <span style={{ fontWeight: 400, color: "var(--guide-muted)" }}>{t("mockCategoryAP")}</span></div><div className="desc">{t("mockDescriptionAP")}</div></div>
              <div className="price">Rp 22,000{t("perMonthSuffix")}</div>
            </div>
            <div className="g-checklist-row">
              <div className="g-chk" />
              <div><div className="name">Mikrotik CCR2004-16G-2S+ <span style={{ fontWeight: 400, color: "var(--guide-muted)" }}>{t("mockCategoryRouter")}</span></div></div>
              <div className="price">Rp 500,000{t("perMonthSuffix")}</div>
            </div>
            <div style={{ marginTop: 12, textAlign: "right" }}><span className="g-btn primary">{t("mockCalculateButton")}</span></div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StepQuoteResult({ t }: { t: T }) {
  return (
    <section className="g-step">
      <p className="g-eyebrow">{t("step5Eyebrow")}</p>
      <h2>{t("step5Title")}</h2>
      <p className="g-lede">{t("step5Lede")}</p>
      <div className="g-frame">
        <div className="g-frame-bar"><span /><span /><span /></div>
        <div className="g-frame-body">
          <div className="g-mock-pad">
            <div className="g-result-card">
              <div className="l">{t("mockMonthlyTotal")}</div>
              <div className="v">Rp 5,463,420</div>
              <div className="ppn">PPN &nbsp; Rp 541,420</div>
            </div>
            <table className="g-mock-table">
              <tbody>
                <tr><th>{t("mockRowItem")}</th><th style={{ textAlign: "right" }}>{t("mockRowMonthlyAmount")}</th></tr>
                <tr><td>{t("mockRowManagedIT")}</td><td style={{ textAlign: "right" }}>Rp 4,900,000</td></tr>
                <tr><td>{t("mockRowVisitCost")}</td><td style={{ textAlign: "right" }}>Rp 0</td></tr>
                <tr><td>TP LINK EAP110</td><td style={{ textAlign: "right" }}>Rp 22,000</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="g-tip">
        <b>{t("step5TipTitle")}</b>
        <br />
        {t("step5TipBody")}
      </div>
    </section>
  );
}

function StepContractCreate({ t }: { t: T }) {
  return (
    <section className="g-step">
      <p className="g-eyebrow">{t("step6Eyebrow")}</p>
      <h2>{t("step6Title")}</h2>
      <p className="g-lede">{t("step6Lede")}</p>
      <div className="g-doc-frame">
        <div className="g-doc-topbar" />
        <div className="g-doc-body">
          <div className="g-doc-head">
            <div className="g-doc-logo" />
            <div>
              <div className="k">{t("mockDocOrgLine")}</div>
              <div className="t">{t("mockDocTitle")}</div>
              <div className="s">{t("mockDocSubtitle")}</div>
            </div>
          </div>
          <table className="g-mock-table">
            <tbody>
              <tr><th>{t("mockDocColService")}</th><th style={{ textAlign: "right" }}>{t("mockDocColMonthlyAmount")}</th></tr>
              <tr><td>{t("mockRowManagedIT")}</td><td style={{ textAlign: "right" }}>Rp 4.900.000</td></tr>
              <tr><td>TP LINK EAP110</td><td style={{ textAlign: "right" }}>Rp 22.000</td></tr>
              <tr><td><b>{t("mockDocRowTotal")}</b></td><td style={{ textAlign: "right" }}><b>Rp 4.922.000</b></td></tr>
            </tbody>
          </table>
          <p style={{ fontSize: 10.5, color: "var(--guide-muted)", marginTop: 10 }}>{t("mockDocCaption")}</p>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--guide-card)", border: "1px solid var(--guide-line)", borderRadius: 12, padding: "12px 16px" }}>
        <div>
          <b style={{ fontSize: 13 }}>{t("mockQuoteFooterLabel")}</b>
          <div style={{ fontSize: 11, color: "var(--guide-muted)" }}>{t("mockQuoteFooterSummary")}</div>
        </div>
        <span className="g-btn primary">{t("mockCreateContractButton")}</span>
      </div>
    </section>
  );
}

function StepContractDetail({ t }: { t: T }) {
  return (
    <section className="g-step">
      <p className="g-eyebrow">{t("step7Eyebrow")}</p>
      <h2>{t("step7Title")}</h2>
      <p className="g-lede">{t("step7Lede")}</p>
      <div className="g-frame">
        <div className="g-frame-bar"><span /><span /><span /></div>
        <div className="g-frame-body">
          <div className="g-mock-pad contract-body">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <b style={{ fontSize: 15 }}>CTR20260805-001</b>
              <span className="g-badge good">{t("mockContractStatusDone")}</span>
            </div>
            <div className="g-info-grid">
              <div><div className="k">{t("mockInfoCustomer")}</div><div className="v">PT. Sung Shin Best Indonesia</div></div>
              <div><div className="k">{t("mockInfoMonthlyFee")}</div><div className="v">Rp 4,922,000</div></div>
              <div><div className="k">{t("mockInfoPeriod")}</div><div className="v">36</div></div>
              <div><div className="k">{t("mockInfoBillingStart")}</div><div className="v">2026-08-05</div></div>
            </div>
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--guide-muted)", margin: "14px 0 6px" }}>{t("mockCommissionLabel")}</p>
            <p style={{ fontSize: 12, color: "var(--guide-muted-2)", margin: 0 }}>{t("mockCommissionHidden")}</p>
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--guide-muted)", margin: "14px 0 6px" }}>{t("mockAvailableActionsLabel")}</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span className="g-btn ghost">{t("mockActivationButton")}</span>
              <span className="g-btn ghost">{t("mockChangeRequestButton")}</span>
              <span className="g-btn ghost">{t("mockTerminationButton")}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="g-tip">
        <b>{t("step7TipTitle")}</b>
        <br />
        {t("step7TipBody")}
      </div>
    </section>
  );
}

function StepChangeRequest({ t }: { t: T }) {
  return (
    <section className="g-step">
      <p className="g-eyebrow">{t("step8Eyebrow")}</p>
      <h2>{t("step8Title")}</h2>
      <p className="g-lede">{t("step8Lede")}</p>
      <div className="g-frame">
        <div className="g-frame-bar"><span /><span /><span /></div>
        <div className="g-frame-body">
          <div className="g-mock-pad">
            <b style={{ fontSize: 14 }}>{t("mockChangeRequestTitle")}</b>
            <p style={{ fontSize: 12, color: "var(--guide-muted)", margin: "6px 0 14px" }}>{t("mockChangeRequestInstruction")}</p>
            <table className="g-mock-table">
              <tbody>
                <tr><th>{t("mockColChangeNo")}</th><th>{t("mockInfoCustomer")}</th><th>{t("mockColChangeContractNo")}</th><th>{t("mockColChangeType")}</th><th>{t("mockColChangeBefore")}</th><th>{t("mockColChangeAfter")}</th></tr>
              </tbody>
            </table>
            <p style={{ textAlign: "center", fontSize: 12, color: "var(--guide-muted-2)", padding: "16px 0" }}>{t("mockChangeRequestEmpty")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function StepCommission({ t }: { t: T }) {
  return (
    <section className="g-step">
      <p className="g-eyebrow">{t("step9Eyebrow")}</p>
      <h2>{t("step9Title")}</h2>
      <p className="g-lede">{t("step9Lede")}</p>
      <div className="g-frame">
        <div className="g-frame-bar"><span /><span /><span /></div>
        <div className="g-frame-body">
          <div className="g-mock-pad">
            <div className="g-stat-row" style={{ marginTop: 0 }}>
              <div className="g-stat-card soft"><div className="l">{t("mockStatCustomersBrought")}</div><div className="v">1</div></div>
              <div className="g-stat-card soft"><div className="l">{t("mockStatActiveContracts")}</div><div className="v">1</div></div>
              <div className="g-stat-card soft" style={{ gridColumn: "span 2" }}><div className="l">{t("mockStatTotalCommission")}</div><div className="v">Rp 428,690</div></div>
            </div>
            <div style={{ marginTop: 14, border: "1px solid var(--guide-line)", borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <b style={{ fontSize: 13 }}>PT. Sung Shin Best Indonesia <span style={{ fontWeight: 400, color: "var(--guide-muted)", fontSize: 11 }}>CTR20260805-001</span></b>
                <span className="g-badge good">{t("mockContractStatusDone")}</span>
              </div>
              <div className="g-info-grid" style={{ marginTop: 10 }}>
                <div><div className="k">{t("mockInfoContractStart")}</div><div className="v" style={{ fontSize: 12 }}>2026-08-05</div></div>
                <div><div className="k">{t("mockInfoFullCommission")}</div><div className="v" style={{ fontSize: 12 }}>Rp 492,200</div></div>
                <div><div className="k">{t("mockInfoHalfCommission")}</div><div className="v" style={{ fontSize: 12 }}>Rp 246,100</div></div>
                <div><div className="k">{t("mockInfoTotalCommission")}</div><div className="v" style={{ fontSize: 12 }}>Rp 428,690</div></div>
              </div>
              <div className="g-expand">{t("mockViewHistory", { count: 1 })}</div>
            </div>
          </div>
        </div>
      </div>
      <div className="g-tip">
        <b>{t("step9TipTitle")}</b>
        <br />
        {t("step9TipBody")}
      </div>
    </section>
  );
}

function StepClosing({ t }: { t: T }) {
  return (
    <section className="g-step">
      <p className="g-eyebrow">{t("step10Eyebrow")}</p>
      <h2>{t("step10Title")}</h2>
      <p className="g-lede">{t("step10Lede")}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 520 }}>
        <div className="g-tip">{t("step10Flow")}</div>
      </div>
      <p className="g-lede" style={{ marginTop: 16 }}>{t("step10Final")}</p>
    </section>
  );
}

const GUIDE_CSS = `
.bct-guide{
  --guide-navy:#063d5d;
  --guide-teal:#0f7897;
  --guide-paper:#f4f7f8;
  --guide-card:#ffffff;
  --guide-line:#dde4e7;
  --guide-line-strong:#c7d1d5;
  --guide-ink:#152229;
  --guide-muted:#5c7078;
  --guide-muted-2:#8397a0;
  --guide-accent-soft:#e7f2f4;
  --guide-accent-soft-2:#d8ecf0;
  --guide-good-bg:#eaf6ee;
  --guide-good-ink:#1f6f43;
  --guide-warn-bg:#fdf3e4;
  --guide-warn-ink:#8a5a10;
  --guide-shadow: 0 1px 2px rgba(6,61,93,.06), 0 8px 24px rgba(6,61,93,.08);
  font-family:-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR",system-ui,sans-serif;
  color:var(--guide-ink);
}
.bct-guide .g-wrap{background:var(--guide-paper);border-radius:20px;padding:24px 18px 40px}
.bct-guide .g-shell{max-width:1120px;margin:0 auto}
.bct-guide .g-masthead{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:20px;flex-wrap:wrap}
.bct-guide .g-brand{display:flex;align-items:center;gap:12px}
.bct-guide .g-logo{width:42px;height:42px;border-radius:12px;background:linear-gradient(135deg,var(--guide-navy),var(--guide-teal));display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:13px;flex-shrink:0}
.bct-guide .g-brand h1{font-size:18px;margin:0;font-weight:700;letter-spacing:-.01em}
.bct-guide .g-brand p{margin:2px 0 0;font-size:12px;color:var(--guide-muted)}
.bct-guide .g-progress-pill{font-size:12px;color:var(--guide-teal);background:var(--guide-accent-soft);border:1px solid var(--guide-accent-soft-2);border-radius:999px;padding:6px 14px;white-space:nowrap;font-variant-numeric:tabular-nums}
.bct-guide .g-layout{display:grid;grid-template-columns:220px 1fr;gap:20px;align-items:start}
@media (max-width:860px){.bct-guide .g-layout{grid-template-columns:1fr}}
.bct-guide .g-rail{background:var(--guide-card);border:1px solid var(--guide-line);border-radius:20px;padding:10px;box-shadow:var(--guide-shadow);position:sticky;top:16px;max-height:calc(100vh - 32px);overflow:auto}
@media (max-width:860px){.bct-guide .g-rail{position:static;max-height:none;display:flex;overflow-x:auto;gap:4px;padding:8px}}
.bct-guide .g-rail-item{display:flex;align-items:center;gap:10px;width:100%;text-align:left;border:none;background:transparent;border-radius:9px;padding:9px 10px;cursor:pointer;color:var(--guide-ink);font-size:13px;font-family:inherit}
@media (max-width:860px){.bct-guide .g-rail-item{width:auto;white-space:nowrap;flex-shrink:0}}
.bct-guide .g-rail-item:hover{background:var(--guide-accent-soft)}
.bct-guide .g-rail-item.active{background:var(--guide-navy);color:#fff}
.bct-guide .g-rail-num{width:22px;height:22px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;background:var(--guide-accent-soft);color:var(--guide-teal)}
.bct-guide .g-rail-item.active .g-rail-num{background:rgba(255,255,255,.22);color:#fff}
.bct-guide .g-rail-item.done .g-rail-num{background:var(--guide-good-bg);color:var(--guide-good-ink)}
.bct-guide .g-panel{background:var(--guide-card);border:1px solid var(--guide-line);border-radius:20px;box-shadow:var(--guide-shadow);padding:28px 30px 24px;min-height:540px;display:flex;flex-direction:column}
@media (max-width:640px){.bct-guide .g-panel{padding:20px 16px 18px}}
.bct-guide .g-eyebrow{font-size:11.5px;font-weight:700;letter-spacing:.06em;color:var(--guide-teal);text-transform:uppercase;margin:0 0 8px}
.bct-guide .g-step h2{font-size:21px;margin:0 0 10px;font-weight:700;letter-spacing:-.01em}
.bct-guide .g-lede{font-size:14px;line-height:1.65;color:var(--guide-muted);margin:0 0 18px;max-width:640px}
.bct-guide .g-tip{display:flex;gap:10px;align-items:flex-start;background:var(--guide-accent-soft);border:1px solid var(--guide-accent-soft-2);border-radius:9px;padding:11px 14px;margin:0 0 20px;font-size:12.5px;line-height:1.6}
.bct-guide .g-tip b{color:var(--guide-teal)}
.bct-guide .g-tip.warn{background:var(--guide-warn-bg);border-color:transparent;color:var(--guide-warn-ink)}
.bct-guide .g-tip.warn b{color:var(--guide-warn-ink)}
.bct-guide .g-frame{border:1px solid var(--guide-line-strong);border-radius:14px;overflow:hidden;background:var(--guide-paper);margin-bottom:18px}
.bct-guide .g-frame-bar{display:flex;align-items:center;gap:6px;padding:9px 12px;background:var(--guide-card);border-bottom:1px solid var(--guide-line)}
.bct-guide .g-frame-bar span{width:9px;height:9px;border-radius:50%;background:var(--guide-line-strong)}
.bct-guide .g-frame-body{background:#fbfcfd}
.bct-guide .g-login-card{width:300px;background:var(--guide-card);border:1px solid var(--guide-line);border-radius:16px;padding:20px;box-shadow:var(--guide-shadow)}
.bct-guide .g-mock-topbar{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 18px;background:var(--guide-card);border-bottom:1px solid var(--guide-line);font-size:12px;color:var(--guide-muted)}
.bct-guide .g-mock-logo{font-weight:700;color:var(--guide-ink);font-size:13px}
.bct-guide .g-mock-actions{display:flex;gap:10px;align-items:center;font-size:11px}
.bct-guide .g-mock-pill{background:var(--guide-accent-soft);color:var(--guide-teal);border-radius:8px;padding:4px 9px;font-weight:600}
.bct-guide .g-mock-pad{padding:18px}
.bct-guide .g-mock-hero{background:linear-gradient(135deg,var(--guide-navy),var(--guide-teal));color:#fff;border-radius:14px;padding:18px 20px;margin-bottom:14px}
.bct-guide .g-mock-hero h3{margin:0 0 4px;font-size:15px}
.bct-guide .g-mock-hero p{margin:0;font-size:11px;opacity:.85}
.bct-guide .g-stat-row{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:12px}
@media (max-width:520px){.bct-guide .g-stat-row{grid-template-columns:repeat(2,1fr)}}
.bct-guide .g-stat-card{background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.2);border-radius:10px;padding:8px 10px}
.bct-guide .g-stat-card.soft{background:var(--guide-accent-soft);border-color:var(--guide-accent-soft-2)}
.bct-guide .g-stat-card .l{font-size:10px;opacity:.85}
.bct-guide .g-stat-card.soft .l{opacity:1;color:var(--guide-muted)}
.bct-guide .g-stat-card .v{font-size:16px;font-weight:700;margin-top:2px}
.bct-guide .g-stat-card.soft .v{color:var(--guide-ink)}
.bct-guide .g-menu-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
@media (max-width:520px){.bct-guide .g-menu-grid{grid-template-columns:1fr}}
.bct-guide .g-menu-section{background:var(--guide-card);border:1px solid var(--guide-line);border-radius:12px;padding:10px 12px}
.bct-guide .g-menu-section h4{margin:0 0 8px;font-size:12px;border-bottom:1px solid var(--guide-line);padding-bottom:7px;font-weight:700}
.bct-guide .g-menu-card{display:flex;align-items:center;gap:9px;padding:7px 6px;border-radius:8px;font-size:12.5px}
.bct-guide .g-menu-card .g-ic{width:24px;height:24px;border-radius:7px;background:var(--guide-accent-soft);display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0}
.bct-guide .g-menu-card.highlight{background:var(--guide-good-bg);outline:2px solid var(--guide-good-ink)}
.bct-guide .g-field-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px}
@media (max-width:520px){.bct-guide .g-field-row{grid-template-columns:1fr}}
.bct-guide .g-field label{display:block;font-size:11px;color:var(--guide-muted);margin-bottom:4px;font-weight:600}
.bct-guide .g-val{border:1px solid var(--guide-line-strong);border-radius:8px;padding:8px 10px;font-size:12.5px;background:var(--guide-card);color:var(--guide-ink)}
.bct-guide .g-val.locked{background:var(--guide-accent-soft);color:var(--guide-teal);border-color:var(--guide-accent-soft-2);font-weight:600}
.bct-guide .g-val.filled{font-weight:600}
.bct-guide table.g-mock-table{width:100%;border-collapse:collapse;font-size:12px}
.bct-guide table.g-mock-table th{text-align:left;color:var(--guide-muted);font-weight:600;padding:8px 10px;border-bottom:1px solid var(--guide-line);font-size:11px}
.bct-guide table.g-mock-table td{padding:9px 10px;border-bottom:1px solid var(--guide-line)}
.bct-guide table.g-mock-table tr:last-child td{border-bottom:none}
.bct-guide .masked{letter-spacing:.05em;color:var(--guide-muted-2)}
.bct-guide .g-btn{display:inline-flex;align-items:center;gap:6px;border-radius:9px;padding:8px 14px;font-size:12.5px;font-weight:700;border:none}
.bct-guide .g-btn.primary{background:var(--guide-navy);color:#fff}
.bct-guide .g-btn.ghost{background:var(--guide-card);border:1px solid var(--guide-line-strong);color:var(--guide-ink)}
.bct-guide .g-checklist-row{display:flex;align-items:flex-start;gap:9px;padding:8px 6px;border-bottom:1px solid var(--guide-line);font-size:12px}
.bct-guide .g-checklist-row:last-child{border-bottom:none}
.bct-guide .g-checklist-row .name{font-weight:600}
.bct-guide .g-checklist-row .desc{color:var(--guide-muted);font-size:11px;margin-top:1px}
.bct-guide .g-checklist-row .price{margin-left:auto;font-weight:700;white-space:nowrap;font-variant-numeric:tabular-nums}
.bct-guide .g-chk{width:16px;height:16px;border-radius:4px;border:2px solid var(--guide-line-strong);flex-shrink:0;margin-top:1px}
.bct-guide .g-chk.on{background:var(--guide-navy);border-color:var(--guide-navy)}
.bct-guide .g-result-card{background:linear-gradient(135deg,var(--guide-navy),var(--guide-teal));color:#fff;border-radius:14px;padding:16px 18px;margin-bottom:12px}
.bct-guide .g-result-card .l{font-size:11px;opacity:.85}
.bct-guide .g-result-card .v{font-size:24px;font-weight:700;margin:2px 0 10px;font-variant-numeric:tabular-nums}
.bct-guide .g-result-card .ppn{display:inline-block;background:rgba(255,255,255,.16);border-radius:9px;padding:6px 12px;font-size:12px}
.bct-guide .g-badge{display:inline-block;border-radius:999px;padding:3px 10px;font-size:11px;font-weight:700}
.bct-guide .g-badge.good{background:var(--guide-good-bg);color:var(--guide-good-ink)}
.bct-guide .g-badge.neutral{background:var(--guide-accent-soft);color:var(--guide-teal)}
.bct-guide .g-doc-frame{border:1px solid var(--guide-line-strong);border-radius:12px;overflow:hidden;margin-bottom:16px}
.bct-guide .g-doc-topbar{height:6px;background:linear-gradient(90deg,var(--guide-navy),var(--guide-teal))}
.bct-guide .g-doc-body{padding:16px 18px;background:var(--guide-card)}
.bct-guide .g-doc-head{display:flex;align-items:center;gap:12px;margin-bottom:12px}
.bct-guide .g-doc-logo{width:36px;height:36px;border-radius:9px;background:linear-gradient(135deg,var(--guide-navy),var(--guide-teal));flex-shrink:0}
.bct-guide .g-doc-head .k{font-size:9.5px;letter-spacing:.06em;color:var(--guide-muted);text-transform:uppercase}
.bct-guide .g-doc-head .t{font-size:15px;font-weight:700}
.bct-guide .g-doc-head .s{font-size:11px;color:var(--guide-muted)}
.bct-guide .g-info-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
@media (max-width:640px){.bct-guide .g-info-grid{grid-template-columns:1fr 1fr}}
.bct-guide .g-info-grid .k{font-size:10.5px;color:var(--guide-muted)}
.bct-guide .g-info-grid .v{font-size:13px;font-weight:700;margin-top:2px}
.bct-guide .g-expand{border:1px solid var(--guide-line);border-radius:10px;padding:10px 12px;margin-top:8px;background:var(--guide-paper);font-size:12px;color:var(--guide-muted);font-weight:600}
.bct-guide .g-nav-row{margin-top:auto;padding-top:20px;display:flex;justify-content:space-between;gap:10px}
.bct-guide .g-nav-btn{font-family:inherit;font-size:13px;font-weight:700;border-radius:11px;padding:11px 20px;cursor:pointer;border:none}
.bct-guide .g-nav-btn.next{background:var(--guide-navy);color:#fff}
.bct-guide .g-nav-btn.prev{background:var(--guide-card);border:1px solid var(--guide-line-strong);color:var(--guide-ink)}
.bct-guide .g-nav-btn:disabled{opacity:.35;cursor:default}
`;
