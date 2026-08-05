"use client";

import { useState } from "react";

const STEP_LABELS = [
  "시작하기",
  "로그인",
  "대시보드",
  "고객 등록",
  "견적 작성",
  "견적 결과",
  "계약 생성",
  "계약 확인",
  "변경 요청",
  "내 수수료",
  "마무리",
];

export function SalesAgentGuide() {
  const [current, setCurrent] = useState(0);
  const last = STEP_LABELS.length - 1;

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
                <h1>영업대리점 사용 가이드</h1>
                <p>BCT Total IT Care · 단계별로 따라 하면 끝나요</p>
              </div>
            </div>
            <div className="g-progress-pill">{current + 1} / {STEP_LABELS.length} 단계</div>
          </div>

          <div className="g-layout">
            <nav className="g-rail" aria-label="단계 목록">
              {STEP_LABELS.map((label, i) => (
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
              {current === 0 && <StepIntro />}
              {current === 1 && <StepLogin />}
              {current === 2 && <StepDashboard />}
              {current === 3 && <StepCustomer />}
              {current === 4 && <StepQuoteForm />}
              {current === 5 && <StepQuoteResult />}
              {current === 6 && <StepContractCreate />}
              {current === 7 && <StepContractDetail />}
              {current === 8 && <StepChangeRequest />}
              {current === 9 && <StepCommission />}
              {current === 10 && <StepClosing />}

              <div className="g-nav-row">
                <button type="button" className="g-nav-btn prev" disabled={current === 0} onClick={() => go(current - 1)}>
                  이전
                </button>
                <button type="button" className="g-nav-btn next" onClick={() => go(current === last ? 0 : current + 1)}>
                  {current === last ? "처음으로" : "다음"}
                </button>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepIntro() {
  return (
    <section className="g-step">
      <p className="g-eyebrow">시작하기</p>
      <h2>이 가이드로 무엇을 할 수 있나요?</h2>
      <p className="g-lede">
        이 가이드는 영업대리점(sales_agent) 계정으로 로그인했을 때 실제로 보게 될 화면을 그대로 따라가며, 고객 등록부터 계약, 수수료
        확인까지 전체 흐름을 안내합니다. 왼쪽 목록을 클릭하거나 아래 &quot;다음&quot; 버튼으로 이동하세요.
      </p>
      <div className="g-tip">
        <b>영업대리점 계정으로 할 수 있는 일</b>
        <br />① 고객 등록 및 조회 · ② 견적 작성 · ③ 계약 확인 · ④ 변경 요청 등록 · ⑤ 본인의 수수료 현황 확인. 이 다섯 가지 외의
        메뉴(요율 설정, 직원 관리 등)는 관리자 전용이라 보이지 않습니다.
      </div>
      <div className="g-menu-grid" style={{ maxWidth: 520 }}>
        <div className="g-menu-section">
          <h4>① 고객·영업 관리</h4>
          <div className="g-menu-card"><span className="g-ic">🏢</span>고객/등록</div>
          <div className="g-menu-card"><span className="g-ic">💰</span>내 수수료 현황</div>
        </div>
        <div className="g-menu-section">
          <h4>② 신청·견적·계약</h4>
          <div className="g-menu-card"><span className="g-ic">🔎</span>조회</div>
          <div className="g-menu-card"><span className="g-ic">🧾</span>신규신청(견적 작업)</div>
          <div className="g-menu-card"><span className="g-ic">📄</span>계약</div>
          <div className="g-menu-card"><span className="g-ic">🔁</span>변경 요청</div>
        </div>
      </div>
    </section>
  );
}

function StepLogin() {
  return (
    <section className="g-step">
      <p className="g-eyebrow">1단계</p>
      <h2>로그인하기</h2>
      <p className="g-lede">
        관리자로부터 받은 이메일과 임시 비밀번호로 로그인합니다. 언어는 오른쪽 위에서 한국어 / Bahasa Indonesia / English 중 선택할 수
        있습니다.
      </p>
      <div className="g-frame">
        <div className="g-frame-bar"><span /><span /><span /></div>
        <div className="g-frame-body">
          <div style={{ display: "flex", justifyContent: "center", padding: "36px 16px" }}>
            <div className="g-login-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <b style={{ fontSize: 14 }}>BCT Total IT Care</b>
                <span className="g-mock-pill">한국어 ▾</span>
              </div>
              <p style={{ fontSize: 11.5, color: "var(--guide-muted)", margin: "0 0 14px" }}>직원 계정으로 로그인하세요</p>
              <div className="g-field" style={{ marginBottom: 10 }}><label>이메일</label><div className="g-val">agent03@bct.co.id</div></div>
              <div className="g-field" style={{ marginBottom: 8 }}><label>비밀번호</label><div className="g-val">••••••••••••</div></div>
              <p style={{ fontSize: 10.5, color: "var(--guide-teal)", textAlign: "right", margin: "0 0 12px" }}>비밀번호를 잊으셨나요?</p>
              <div className="g-btn primary" style={{ width: "100%", justifyContent: "center" }}>로그인</div>
            </div>
          </div>
        </div>
      </div>
      <div className="g-tip warn">
        <b>처음 로그인이라면</b>
        <br />관리자가 알려준 임시 비밀번호를 그대로 입력해 로그인한 뒤, 안전을 위해 가급적 빠른 시일 내에 &quot;비밀번호를 잊으셨나요?&quot;를
        눌러 본인만 아는 비밀번호로 바꿔두세요.
      </div>
    </section>
  );
}

function StepDashboard() {
  return (
    <section className="g-step">
      <p className="g-eyebrow">2단계</p>
      <h2>대시보드 살펴보기</h2>
      <p className="g-lede">
        로그인하면 가장 먼저 보이는 화면입니다. 위쪽에는 이번 달 실적 요약이, 아래쪽에는 실제로 사용할 메뉴 카드가 나옵니다.
        영업대리점 계정에는 딱 필요한 메뉴만 두 묶음으로 깔끔하게 보입니다.
      </p>
      <div className="g-frame">
        <div className="g-frame-bar"><span /><span /><span /></div>
        <div className="g-frame-body">
          <div className="g-mock-topbar">
            <span className="g-mock-logo">BCT Total IT Care</span>
            <div className="g-mock-actions"><span>직원</span><span className="g-mock-pill">첫화면</span><span>한국어 ▾</span><span>로그아웃</span></div>
          </div>
          <div className="g-mock-pad">
            <div className="g-mock-hero">
              <h3>업무 메뉴</h3>
              <p>필요한 업무로 바로 이동하세요.</p>
              <div className="g-stat-row">
                <div className="g-stat-card"><div className="l">당월 신규 고객</div><div className="v">0</div></div>
                <div className="g-stat-card"><div className="l">당월 확정 계약</div><div className="v">0</div></div>
                <div className="g-stat-card"><div className="l">활성 영업사원</div><div className="v">4</div></div>
                <div className="g-stat-card"><div className="l">당월 개통 대기</div><div className="v">0</div></div>
              </div>
            </div>
            <div className="g-menu-grid">
              <div className="g-menu-section">
                <h4>① 고객 · 영업 관리</h4>
                <div className="g-menu-card"><span className="g-ic">🏢</span>고객/등록</div>
                <div className="g-menu-card highlight"><span className="g-ic">💰</span>내 수수료 현황</div>
              </div>
              <div className="g-menu-section">
                <h4>② 신청 · 견적 · 계약</h4>
                <div className="g-menu-card"><span className="g-ic">🔎</span>조회</div>
                <div className="g-menu-card"><span className="g-ic">🧾</span>신규신청(견적 작업)</div>
                <div className="g-menu-card"><span className="g-ic">📄</span>계약</div>
                <div className="g-menu-card"><span className="g-ic">🔁</span>변경 요청</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="g-tip">
        <b>다른 메뉴가 안 보여요</b>
        <br />정상입니다. 요율 설정, 직원 관리 같은 관리자 전용 메뉴는 영업대리점 계정에는 아예 나타나지 않습니다. 빈 칸 없이 실제로
        쓸 수 있는 메뉴만 표시됩니다.
      </div>
    </section>
  );
}

function StepCustomer() {
  return (
    <section className="g-step">
      <p className="g-eyebrow">3단계</p>
      <h2>고객 등록하기</h2>
      <p className="g-lede">
        &quot;① 고객·영업 관리 → 고객/등록&quot;으로 들어가면 지금까지 내가 담당한 고객 목록이 보입니다. 오른쪽 위 &quot;새 고객&quot;
        버튼으로 신규 고객을 등록할 수 있습니다.
      </p>
      <div className="g-frame">
        <div className="g-frame-bar"><span /><span /><span /></div>
        <div className="g-frame-body">
          <div className="g-mock-pad">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <b style={{ fontSize: 14 }}>고객</b>
              <span className="g-btn primary">새 고객</span>
            </div>
            <table className="g-mock-table">
              <tbody>
                <tr><th>코드</th><th>고객명</th><th>담당자</th><th>연락처</th><th>이메일</th><th>상태</th></tr>
                <tr>
                  <td>CUS002</td><td>PT. Sung Shin Best Indonesia</td><td>-</td>
                  <td className="masked">***</td><td className="masked">***@***.***</td>
                  <td><span className="g-badge neutral">미계약</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <p className="g-lede" style={{ marginTop: 2 }}>
        &quot;새 고객&quot; 버튼을 누르면 아래와 같은 등록 창이 열립니다. <b style={{ color: "var(--guide-ink)" }}>담당 영업 대리점은
        자동으로 내 대리점으로 고정</b>되어 있어서, 별도로 고를 필요가 없습니다.
      </p>
      <div className="g-frame">
        <div className="g-frame-bar"><span /><span /><span /></div>
        <div className="g-frame-body">
          <div className="g-mock-pad" style={{ maxWidth: 420, margin: "0 auto" }}>
            <b style={{ fontSize: 13 }}>고객 등록</b>
            <div className="g-field" style={{ margin: "10px 0" }}><label>고객명</label><div className="g-val filled">(예시) PT. Contoh Jaya</div></div>
            <div className="g-field-row">
              <div className="g-field"><label>담당자</label><div className="g-val filled">Budi Santoso</div></div>
              <div className="g-field"><label>연락처</label><div className="g-val filled">081234567890</div></div>
            </div>
            <div className="g-field" style={{ marginBottom: 10 }}><label>담당 영업 대리점</label><div className="g-val locked">AGT003 - Heedo Park (자동)</div></div>
            <div className="g-btn primary" style={{ width: "100%", justifyContent: "center" }}>등록</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StepQuoteForm() {
  return (
    <section className="g-step">
      <p className="g-eyebrow">4단계</p>
      <h2>견적 작성하기</h2>
      <p className="g-lede">
        &quot;② 신청·견적·계약 → 신규신청(견적 작업)&quot;에서 고객을 선택하고 계약 조건을 입력합니다. 여기서도 영업 대리점은 자동으로
        내 이름으로 고정됩니다.
      </p>
      <div className="g-frame">
        <div className="g-frame-bar"><span /><span /><span /></div>
        <div className="g-frame-body">
          <div className="g-mock-pad">
            <div className="g-field" style={{ marginBottom: 10 }}><label>고객</label><div className="g-val filled">CUS002 - PT. Sung Shin Best Indonesia</div></div>
            <div className="g-field" style={{ marginBottom: 10 }}><label>영업 대리점</label><div className="g-val locked">AGT003 - Heedo Park (자동)</div></div>
            <div className="g-field-row">
              <div className="g-field"><label>계약 개월수</label><div className="g-val filled">36</div></div>
              <div className="g-field"><label>직원/PC 수</label><div className="g-val filled">20</div></div>
            </div>
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--guide-muted)", margin: "12px 0 4px" }}>③ 추가 장비 선택</p>
            <div className="g-checklist-row">
              <div className="g-chk on" />
              <div><div className="name">TP LINK EAP110 <span style={{ fontWeight: 400, color: "var(--guide-muted)" }}>[AP(무선망)]</span></div><div className="desc">OMADA 300Mbps Wireless N Mount AP</div></div>
              <div className="price">Rp 22,000/월</div>
            </div>
            <div className="g-checklist-row">
              <div className="g-chk" />
              <div><div className="name">Mikrotik CCR2004-16G-2S+ <span style={{ fontWeight: 400, color: "var(--guide-muted)" }}>[라우터]</span></div></div>
              <div className="price">Rp 500,000/월</div>
            </div>
            <div style={{ marginTop: 12, textAlign: "right" }}><span className="g-btn primary">계산하기</span></div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StepQuoteResult() {
  return (
    <section className="g-step">
      <p className="g-eyebrow">5단계</p>
      <h2>견적 결과 확인하기</h2>
      <p className="g-lede">
        &quot;계산하기&quot;를 누르면 오른쪽에 월 청구액이 항목별로 바로 계산되어 나타납니다. PPN(부가세)도 자동으로 포함되어
        표시됩니다.
      </p>
      <div className="g-frame">
        <div className="g-frame-bar"><span /><span /><span /></div>
        <div className="g-frame-body">
          <div className="g-mock-pad">
            <div className="g-result-card">
              <div className="l">월 합계</div>
              <div className="v">Rp 5,463,420</div>
              <div className="ppn">PPN &nbsp; Rp 541,420</div>
            </div>
            <table className="g-mock-table">
              <tbody>
                <tr><th>항목</th><th style={{ textAlign: "right" }}>월 금액</th></tr>
                <tr><td>Managed IT 기본 서비스</td><td style={{ textAlign: "right" }}>Rp 4,900,000</td></tr>
                <tr><td>월 1회 방문점검 원가 반영</td><td style={{ textAlign: "right" }}>Rp 0</td></tr>
                <tr><td>TP LINK EAP110</td><td style={{ textAlign: "right" }}>Rp 22,000</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="g-tip">
        <b>저장하는 것을 잊지 마세요</b>
        <br />결과가 마음에 들면 아래쪽 &quot;견적 저장&quot; 버튼을 꼭 눌러야 견적번호가 생성되고 이후 계약으로 진행할 수 있습니다.
      </div>
    </section>
  );
}

function StepContractCreate() {
  return (
    <section className="g-step">
      <p className="g-eyebrow">6단계</p>
      <h2>견적 저장 → 계약 생성</h2>
      <p className="g-lede">
        견적을 저장하면 견적번호(QUO...)가 생기고, 고객에게 보여줄 인쇄용 견적서도 바로 만들 수 있습니다. 고객이 계약을 확정하면 같은
        화면에서 &quot;계약 생성&quot; 버튼 하나로 정식 계약이 만들어집니다.
      </p>
      <div className="g-doc-frame">
        <div className="g-doc-topbar" />
        <div className="g-doc-body">
          <div className="g-doc-head">
            <div className="g-doc-logo" />
            <div>
              <div className="k">PT. Bumi Cerdas Teknology · Managed IT Services</div>
              <div className="t">Penawaran Layanan Managed IT BCT</div>
              <div className="s">Quotation No. QUO20260805-001 · BCT Managed IT 서비스 견적서</div>
            </div>
          </div>
          <table className="g-mock-table">
            <tbody>
              <tr><th>서비스</th><th style={{ textAlign: "right" }}>월 금액</th></tr>
              <tr><td>Managed IT 기본 서비스</td><td style={{ textAlign: "right" }}>Rp 4.900.000</td></tr>
              <tr><td>TP LINK EAP110</td><td style={{ textAlign: "right" }}>Rp 22.000</td></tr>
              <tr><td><b>월 청구액 소계</b></td><td style={{ textAlign: "right" }}><b>Rp 4.922.000</b></td></tr>
            </tbody>
          </table>
          <p style={{ fontSize: 10.5, color: "var(--guide-muted)", marginTop: 10 }}>
            인도네시아어가 먼저, 한국어가 그 아래 함께 표시되는 이중언어 문서입니다.
          </p>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--guide-card)", border: "1px solid var(--guide-line)", borderRadius: 12, padding: "12px 16px" }}>
        <div>
          <b style={{ fontSize: 13 }}>견적 QUO20260805-001</b>
          <div style={{ fontSize: 11, color: "var(--guide-muted)" }}>월 합계 Rp 4,922,000 · 36개월</div>
        </div>
        <span className="g-btn primary">계약 생성</span>
      </div>
    </section>
  );
}

function StepContractDetail() {
  return (
    <section className="g-step">
      <p className="g-eyebrow">7단계</p>
      <h2>계약 확인하기</h2>
      <p className="g-lede">
        &quot;계약 생성&quot;을 누르면 계약번호(CTR...)가 자동으로 만들어지고, &quot;② 신청·견적·계약 → 계약&quot; 메뉴에서 언제든
        다시 확인할 수 있습니다. 여기서 개통 등록, 변경 요청, 해지 처리도 시작합니다.
      </p>
      <div className="g-frame">
        <div className="g-frame-bar"><span /><span /><span /></div>
        <div className="g-frame-body">
          <div className="g-mock-pad">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <b style={{ fontSize: 15 }}>계약 CTR20260805-001</b>
              <span className="g-badge good">계약완료</span>
            </div>
            <div className="g-info-grid">
              <div><div className="k">고객</div><div className="v">PT. Sung Shin Best Indonesia</div></div>
              <div><div className="k">월 청구금액</div><div className="v">Rp 4,922,000</div></div>
              <div><div className="k">기간</div><div className="v">36개월</div></div>
              <div><div className="k">과금 시작일</div><div className="v">2026-08-05</div></div>
            </div>
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--guide-muted)", margin: "14px 0 6px" }}>영업 수수료</p>
            <p style={{ fontSize: 12, color: "var(--guide-muted-2)", margin: 0 }}>관리자만 조회 가능</p>
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--guide-muted)", margin: "14px 0 6px" }}>이 화면에서 바로 할 수 있는 것</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span className="g-btn ghost">개통 등록</span>
              <span className="g-btn ghost">변경 요청 등록</span>
              <span className="g-btn ghost">해지 신청</span>
            </div>
          </div>
        </div>
      </div>
      <div className="g-tip">
        <b>수수료 금액은 여기서 안 보여요</b>
        <br />계약서 화면의 &quot;영업 수수료&quot;는 관리자만 조회할 수 있도록 가려져 있습니다. 내 수수료가 궁금하면 10단계
        &quot;내 수수료 현황&quot; 메뉴를 이용하세요 — 거기서는 내 몫만 정확히 볼 수 있습니다.
      </div>
    </section>
  );
}

function StepChangeRequest() {
  return (
    <section className="g-step">
      <p className="g-eyebrow">8단계</p>
      <h2>변경 요청 등록하기</h2>
      <p className="g-lede">
        계약 후에 장비나 서비스를 추가/변경해야 하면, 계약 상세 화면의 &quot;변경 요청 등록&quot; 버튼으로 시작합니다.
        &quot;② 신청·견적·계약 → 변경 요청&quot;에서 지금까지의 변경 이력을 모아볼 수 있습니다.
      </p>
      <div className="g-frame">
        <div className="g-frame-bar"><span /><span /><span /></div>
        <div className="g-frame-body">
          <div className="g-mock-pad">
            <b style={{ fontSize: 14 }}>변경 요청</b>
            <p style={{ fontSize: 12, color: "var(--guide-muted)", margin: "6px 0 14px" }}>
              계약 상세 페이지에서 &quot;변경 요청&quot;을 눌러 새 변경 요청을 등록하세요.
            </p>
            <table className="g-mock-table">
              <tbody>
                <tr><th>변경번호</th><th>고객</th><th>계약번호</th><th>유형</th><th>변경 전</th><th>변경 후</th></tr>
              </tbody>
            </table>
            <p style={{ textAlign: "center", fontSize: 12, color: "var(--guide-muted-2)", padding: "16px 0" }}>변경 요청 내역이 없습니다.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function StepCommission() {
  return (
    <section className="g-step">
      <p className="g-eyebrow">9단계</p>
      <h2>내 수수료 현황 확인하기</h2>
      <p className="g-lede">
        &quot;① 고객·영업 관리 → 내 수수료 현황&quot;에서 내가 지금까지 유치한 모든 고객의 계약별 누적 수수료와 월별 이력을 한눈에 볼
        수 있습니다. 다른 영업대리점의 수수료는 보이지 않고, 오직 내 몫만 표시됩니다.
      </p>
      <div className="g-frame">
        <div className="g-frame-bar"><span /><span /><span /></div>
        <div className="g-frame-body">
          <div className="g-mock-pad">
            <div className="g-stat-row" style={{ marginTop: 0 }}>
              <div className="g-stat-card soft"><div className="l">유치한 고객 수</div><div className="v">1</div></div>
              <div className="g-stat-card soft"><div className="l">활성 계약 수</div><div className="v">1</div></div>
              <div className="g-stat-card soft" style={{ gridColumn: "span 2" }}><div className="l">누적 수수료 (현재까지)</div><div className="v">Rp 428,690</div></div>
            </div>
            <div style={{ marginTop: 14, border: "1px solid var(--guide-line)", borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <b style={{ fontSize: 13 }}>PT. Sung Shin Best Indonesia <span style={{ fontWeight: 400, color: "var(--guide-muted)", fontSize: 11 }}>CTR20260805-001</span></b>
                <span className="g-badge good">계약완료</span>
              </div>
              <div className="g-info-grid" style={{ marginTop: 10 }}>
                <div><div className="k">계약 시작일</div><div className="v" style={{ fontSize: 12 }}>2026-08-05</div></div>
                <div><div className="k">월 수수료 (100%)</div><div className="v" style={{ fontSize: 12 }}>Rp 492,200</div></div>
                <div><div className="k">월 수수료 (50%)</div><div className="v" style={{ fontSize: 12 }}>Rp 246,100</div></div>
                <div><div className="k">누적 수수료</div><div className="v" style={{ fontSize: 12 }}>Rp 428,690</div></div>
              </div>
              <div className="g-expand">▸ 월별 내역 보기 (1개월)</div>
            </div>
          </div>
        </div>
      </div>
      <div className="g-tip">
        <b>이력 포함이란?</b>
        <br />&quot;월별 내역 보기&quot;를 펼치면 계약을 시작한 달부터 이번 달까지, 달마다 실제로 얼마씩 쌓였는지 전부 확인할 수
        있습니다.
      </div>
    </section>
  );
}

function StepClosing() {
  return (
    <section className="g-step">
      <p className="g-eyebrow">마지막 단계</p>
      <h2>정리하며</h2>
      <p className="g-lede">여기까지가 영업대리점 계정으로 할 수 있는 전체 업무 흐름입니다. 순서를 다시 한 번 정리하면 아래와 같습니다.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 520 }}>
        <div className="g-tip">1 고객 등록 → 2 견적 작성 → 3 견적 저장 → 4 계약 생성 → 5 필요 시 변경 요청 → 6 내 수수료 현황에서 확인</div>
      </div>
      <p className="g-lede" style={{ marginTop: 16 }}>
        화면이 헷갈리거나 문제가 생기면 언제든 관리자에게 문의하세요. 로그인 정보(이메일/비밀번호)는 남에게 알려주지 말고, 자리를
        비울 땐 반드시 오른쪽 위 &quot;로그아웃&quot;을 눌러주세요.
      </p>
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
