import { getTranslations, setRequestLocale } from "next-intl/server";
import { getSessionContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { listCustomers } from "@/lib/data-access/customers";
import { listContracts } from "@/lib/data-access/contracts";
import { listAgents } from "@/lib/data-access/agents";
import { formatRupiah } from "@/lib/utils/currency";
import { MenuCard } from "@/components/home/menu-card";
import { MenuSection } from "@/components/home/menu-section";
import { MiniBarChart } from "@/components/home/mini-bar-chart";
import { DualBarChart } from "@/components/home/dual-bar-chart";
import { KpiStrip } from "@/components/home/kpi-strip";

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function lastMonths(count: number) {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (count - 1 - i), 1);
    return { date: d, key: monthKey(d) };
  });
}

function lastYears(count: number) {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => now.getFullYear() - (count - 1 - i));
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await getSessionContext();
  const supabase = await createClient();
  const [customers, contracts, agents, { data: terminationPlans }, tHome, tNav] = await Promise.all([
    listCustomers(supabase, session!.role),
    listContracts(supabase, session!.role),
    listAgents(supabase, session!.role),
    supabase.from("termination_plans").select("term_date, saved_at"),
    getTranslations("home"),
    getTranslations("nav"),
  ]);
  const terminations = terminationPlans ?? [];

  const currentMonth = monthKey(new Date());
  const statNewCustomers = customers.filter((c) => c.created_at.startsWith(currentMonth)).length;
  const statNewContracts = contracts.filter((c) => c.created_at.startsWith(currentMonth)).length;
  const statActiveAgents = agents.filter((a) => a.active).length;
  const statPendingActivation = contracts.filter((c) => c.status !== "activated").length;

  const activeContracts = contracts.filter((c) => c.status !== "terminated");
  const thisMonthMrr = activeContracts.reduce((s, c) => s + c.monthly_fee, 0);
  const monthsElapsedThisYear = new Date().getMonth() + 1;
  const yearRevenue = thisMonthMrr * monthsElapsedThisYear;

  const months = lastMonths(6);
  const revenueByMonth = months.map(({ date, key }) => ({
    label: date.toLocaleDateString(locale, { month: "short" }),
    value: contracts.filter((c) => c.created_at.startsWith(key)).reduce((s, c) => s + c.monthly_fee, 0),
  }));
  const signupCancelByMonth = months.map(({ date, key }) => ({
    label: date.toLocaleDateString(locale, { month: "short" }),
    signups: contracts.filter((c) => c.start_date.startsWith(key)).length,
    cancellations: terminations.filter((t) => (t.saved_at ?? "").startsWith(key)).length,
  }));

  const years = lastYears(3);
  const revenueByYear = years.map((year) => ({
    label: String(year),
    value: contracts
      .filter((c) => c.start_date.startsWith(String(year)))
      .reduce((s, c) => s + c.monthly_fee, 0),
  }));

  const isMaster = session!.role === "master";

  const p = (path: string) => `/${locale}${path}`;

  return (
    <div className="flex flex-col gap-5">
      <div
        className="rounded-3xl p-6 text-white shadow-lg"
        style={{ background: "linear-gradient(135deg,#063d5d,#0f7897)" }}
      >
        <h2 className="text-2xl font-bold">{tHome("heroTitle")}</h2>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-white/85">{tHome("heroDescription")}</p>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: tHome("statNewCustomers"), value: statNewCustomers },
            { label: tHome("statNewContracts"), value: statNewContracts },
            { label: tHome("statActiveAgents"), value: statActiveAgents },
            { label: tHome("statPendingActivation"), value: statPendingActivation },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-white/20 bg-white/10 p-3">
              <span className="text-xs text-white/80">{s.label}</span>
              <b className="mt-1 block text-xl">{s.value}</b>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.2fr_1fr_1fr]">
        <div className="rounded-2xl border border-border bg-card p-3.5 shadow-sm">
          <h3 className="text-sm font-semibold">{tHome("chartMonthlyTitle")}</h3>
          <p className="mb-2 text-[11px] text-muted-foreground">{tHome("chartMonthlyCaption")}</p>
          <KpiStrip
            items={[
              { label: tHome("kpiMrr"), value: formatRupiah(thisMonthMrr) },
              { label: tHome("kpiYearRevenue"), value: formatRupiah(yearRevenue) },
              { label: tHome("kpiActiveContracts"), value: String(activeContracts.length) },
              { label: tHome("kpiTerminations"), value: String(terminations.length) },
            ]}
          />
          <MiniBarChart data={revenueByMonth} color="green" formatValue={(v) => formatRupiah(v)} />
        </div>
        <div className="rounded-2xl border border-border bg-card p-3.5 shadow-sm">
          <h3 className="text-sm font-semibold">{tHome("chartAnnualTitle")}</h3>
          <p className="mb-1 text-[11px] text-muted-foreground">{tHome("chartAnnualCaption")}</p>
          <MiniBarChart data={revenueByYear} formatValue={(v) => formatRupiah(v)} />
        </div>
        <div className="rounded-2xl border border-border bg-card p-3.5 shadow-sm">
          <h3 className="text-sm font-semibold">{tHome("chartSignupCancelTitle")}</h3>
          <p className="mb-1 text-[11px] text-muted-foreground">{tHome("chartSignupCancelCaption")}</p>
          <DualBarChart data={signupCancelByMonth} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.05fr_1.25fr_1.05fr_0.95fr]">
        <MenuSection title={tHome("sectionCustomerSales")}>
          <MenuCard href={p("/customers")} icon="🏢" color="blue" title={tNav("customers")} description={tHome("cardCustomersDesc")} />
          <MenuCard href={p("/agents")} icon="🧑‍💼" color="blue" title={tNav("agents")} description={tHome("cardAgentsDesc")} />
          {isMaster && (
            <MenuCard href={p("/admin/staff")} icon="👤" color="blue" title={tNav("adminStaff")} description={tHome("cardAdminStaffDesc")} />
          )}
        </MenuSection>

        <MenuSection title={tHome("sectionApplicationContract")}>
          <MenuCard href={p("/applications")} icon="🔎" color="purple" title={tNav("applications")} description={tHome("cardApplicationsDesc")} />
          <MenuCard href={p("/quotes")} icon="🧾" color="purple" title={tNav("quotes")} description={tHome("cardQuotesDesc")} />
          <MenuCard href={p("/contracts")} icon="📄" color="purple" title={tNav("contracts")} description={tHome("cardContractsDesc")} />
          <MenuCard href={p("/change-requests")} icon="🔁" color="purple" title={tNav("changeRequests")} description={tHome("cardChangeRequestsDesc")} />
        </MenuSection>

        <MenuSection title={tHome("sectionOperations")}>
          <MenuCard href={p("/activations")} icon="🛠️" color="orange" title={tNav("activations")} description={tHome("cardActivationsDesc")} />
          <MenuCard href={p("/assets")} icon="🧰" color="orange" title={tNav("assets")} description={tHome("cardAssetsDesc")} />
          <MenuCard href={p("/service-logs")} icon="📝" color="orange" title={tNav("serviceLogs")} description={tHome("cardServiceLogsDesc")} />
          <MenuCard href={p("/termination")} icon="⚠️" color="orange" title={tNav("termination")} description={tHome("cardTerminationDesc")} />
        </MenuSection>

        <MenuSection title={tHome("sectionBillingAdmin")}>
          <MenuCard href={p("/invoices")} icon="💳" color="green" title={tNav("invoices")} description={tHome("cardInvoicesDesc")} />
          {isMaster && (
            <>
              <MenuCard href={p("/admin/approvals")} icon="✅" color="green" title={tNav("adminApprovals")} description={tHome("cardAdminApprovalsDesc")} />
              <MenuCard href={p("/admin/equipment")} icon="📦" color="green" title={tNav("adminEquipment")} description={tHome("cardAdminEquipmentDesc")} />
              <MenuCard href={p("/admin/rates")} icon="⚙️" color="green" title={tNav("adminRates")} description={tHome("cardAdminRatesDesc")} />
              <MenuCard href={p("/admin/audit-log")} icon="📋" color="green" title={tNav("adminAuditLog")} description={tHome("cardAdminAuditLogDesc")} />
            </>
          )}
        </MenuSection>
      </div>
    </div>
  );
}
