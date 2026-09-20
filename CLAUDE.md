# CLAUDE.md

이 파일은 Claude Code(claude.ai/code)가 이 저장소에서 작업할 때 참고하는 안내 문서입니다.

@AGENTS.md

**BCT Total IT Care** — 인도네시아 managed-IT 업체를 위한 사내 ERP(견적 → 계약 → 개통 → 청구).
Next.js 16 + React 19 + Supabase 기반. 옆 디렉터리 `../gajione`은 전혀 별개의 프로젝트이며
`../CLAUDE.md`를 참고할 것.

## 명령어

```bash
npm run dev      # next dev (포트 3000)
npm run build    # next build
npm run lint     # eslint (flat config, eslint-config-next)
npx tsc --noEmit # 타입 체크 — 전용 npm 스크립트는 없음
```

테스트 프레임워크는 없다. `scripts/concurrency-test.mjs`는 numbering RPC만 단독으로 검증하는
스크립트다: `node --env-file=.env.local scripts/concurrency-test.mjs` (service-role 키 필요).

Supabase CLI는 devDependency로 들어 있다(`npx supabase ...`). 마이그레이션은
`supabase/migrations/`에 있으며 호스팅된 프로젝트에 직접 적용한다 — 이 환경에는 로컬 Docker
Postgres가 없고, 그래서 타입도 수작업으로 관리한다(아래 참고).

환경 변수(`.env.local`, 현재는 플레이스홀더): `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`,
`CREDENTIAL_ENCRYPTION_KEY`(정확히 32바이트로 디코딩되는 base64).

## 아키텍처

### 서로 독립적인 3중 권한 계층
권한은 한 곳에서 처리되지 않는다. 변경할 때는 보통 세 계층을 모두 고려해야 한다.

1. **경로 차단** — `src/proxy.ts`(Next 16에서 middleware가 개명된 것)가 먼저 next-intl을 돌리고,
   이어서 `updateSession()`, 마지막으로 `src/lib/auth/permissions.ts`의
   `canAccessPath(role, path)`를 호출한다. 페이지를 추가하면 `proxy.ts`의 `PROTECTED_PREFIXES`와
   `permissions.ts`의 `ALL_ROLE_PATHS` + 역할별 목록에 **둘 다** 추가해야 한다.
2. **행 단위(Row-level)** — Postgres RLS(`supabase/migrations/*_rls_policies.sql`,
   `*_sales_agent_scoping.sql`에서 확장). 기본 규칙은 "활성 직원은 운영 테이블을 읽고 쓸 수 있고,
   삭제는 `master`만"이다. `sales_agent`는 추가로 customers/quotes/contracts/change_requests에서
   자신에게 연결된 `profiles.agent_code` 행으로만 범위가 제한되며, 연결되지 않은 sales_agent는
   아무것도 보지 못한다.
3. **필드 단위 마스킹** — RLS로는 컬럼을 제한할 수 없으므로 `src/lib/masking/staff-masking.ts`
   (부분 노출 / 구간화 / 완전 삭제)를 **data-access 계층 안에서** 적용한다. 컴포넌트에서는
   절대 처리하지 않는다.

역할: `master`(최대 2개, `MAX_MASTER_ACCOUNTS`), `admin_dept`, `activation_dept`, `sales_agent`.

### data-access 계층
모든 테이블 조회는 `src/lib/data-access/<table>.ts`를 거친다. 규약상 함수는
`(supabase, ..., role)`을 받아 이미 마스킹된 행을 돌려주고, `...Raw()` 변형만 마스킹되지 않은
원본을 돌려주며 이는 서버 내부용(견적→계약 변환, 출력/PDF 렌더링)으로만 쓴다. 마스킹 후 원가·마진
값은 `NaN`이 되므로, UI는 숫자 필드가 아니라 별도의 구간화된 문자열 요약
(예: `summarizeQuoteForStaff`)을 사용해야 한다.

### 서버 액션과 계산
각 라우트 폴더는 `actions.ts`(`'use server'`)를 함께 둔다. 가격 계산은 **항상** 마스킹되지 않은
요율을 사용해 서버에서 수행한다. 클라이언트는 `{catalogId, qty}` 형태의 선택값만 보내고, 이미
마스킹이 끝난 미리보기(`calculateQuotePreviewAction`)만 받는다.

### 업무 파이프라인
`applications → quotes → contracts → activations → invoices / service-logs / incident-logs →
change-requests → termination`. 계약 시점에 `quote_snapshot`(Quote 행 전체)이 동결되며, 이후
청구·수수료·해지 계산은 살아 있는 견적이 아니라 이 스냅샷을 읽는다.

### 가격·수수료 엔진 (`src/lib/calc/`)
레거시 단일 파일 앱에서 1:1로 이식했다. 하드코딩된 상수(`250000`, `1500000`,
`POST_TERM_EQUIPMENT_RATE = 0.7`, 30.4375일 월 등)는 원본 엔진의 업무 규칙이지 "정리"하거나
`rates`에서 유도할 대상이 **아니다**. 수수료는 계약 기간 동안 100%, 이후에는 기한 없이 50%다
(`src/components/documents/agent-agreement-clauses.ts`의 대리점 계약 조항과 대응하므로 둘을
항상 함께 맞출 것).

### 번호 채번
반드시 `src/lib/numbering/index.ts`만 사용한다. 순번은 `next_number(p_scope)` Postgres RPC에서
받아온다(원자적 upsert라 동시 제출에도 안전). 엄격한 순서가 필요 없는 경우에는 타임스탬프 기반
ID를 쓴다. 클라이언트에서 행 개수를 세어 번호를 만드는 방식은 절대 쓰지 않는다.

### 타입
`src/types/domain.ts`는 `supabase/migrations/*.sql`을 그대로 반영하도록 수작업으로 관리한다 —
이 환경에서는 Docker가 없어 `supabase gen types`를 돌릴 수 없다. 마이그레이션을 추가하는 변경에
항상 함께 수정할 것.

### 문서와 PDF
출력 라우트(`.../print/page.tsx`)가 `src/components/documents/*`를 서버에서 렌더링한다.
`PrintButton`은 `GET /api/documents/pdf?path=...`를 호출하고, 이 라우트가 호출자의 쿠키를 실어
해당 출력 URL을 puppeteer-core로 다시 가져온다(Vercel에서는 `@sparticuz/chromium`, 로컬에서는
설치된 Chrome). 놓치면 바로 문제가 되는 제약:
- 새 출력 문서를 추가하면 라우트의 `ALLOWED_PATH_PATTERN` 허용 목록도 넓혀야 한다.
- `src/lib/pdf/generate-document-pdf.ts`의 `page.pdf()` 여백은 `src/app/globals.css`의
  `@page { margin }` 값과 일치해야 한다. 어긋나면 강제 페이지 분리 시 본문이 헤더와 겹친다.
- Chromium 바이너리를 위해 `next.config.ts`에 `serverExternalPackages`와
  `outputFileTracingIncludes`가 필요하다.

### 다국어(i18n)
`next-intl`을 쓰며 로케일은 `['ko','id','en']`, **기본값은 `id`**, `localePrefix: 'always'`다 —
따라서 모든 페이지가 `src/app/[locale]/` 아래에 있다. UI 문자열은
`src/i18n/messages/{ko,id,en}.json` 세 파일 모두에 같은 키 구조로 넣어야 하고, 서버 페이지는
`setRequestLocale(locale)`을 호출한다. 일부 업무 데이터는 DB에도 다국어로 저장된다
(서비스 카탈로그 i18n 컬럼).

### 기타
- UI는 shadcn/ui "new-york" + Tailwind v4 (`src/components/ui/`, 설정은 `components.json`,
  tailwind.config 파일 없음).
- `getSessionContext()`를 React `cache()`로 감싼 것은 의도적이다 — 동시에 실행된 `getUser()`
  호출들이 일회용 refresh token을 두고 경쟁하면 세션이 무작위로 null이 되는 현상이 생긴다.
- 서비스 크리덴셜 비밀번호는 앱 단에서 AES-256-GCM으로 암호화한다
  (`src/lib/crypto/credential-encryption.ts`). 키는 Postgres에 절대 저장되지 않는다.
- 관리자 행위는 `log_audit()` security-definer RPC로 기록한다. `audit_log`에는 직접
  insert/update/delete 정책이 없다.
- `createAdminClient()`(service role)는 서버 전용이며, 호출 전에 반드시 활성 `master`인지
  확인해야 한다.
