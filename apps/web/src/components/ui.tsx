import { CheckCircle2, ChevronRight, FileCheck2 } from "lucide-react";
import type { ReactNode } from "react";

export function MetricTile({
  caption,
  icon,
  label,
  value
}: {
  caption: string;
  icon: ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <article className="metric-tile">
      <span>{icon}</span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <small>{caption}</small>
      </div>
    </article>
  );
}

export function MiniMetric({ label, tone, value }: { label: string; tone?: string; value: string | number }) {
  return (
    <div className={`mini-metric ${tone ?? ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function WorkflowCard({ copy, icon, title }: { copy: string; icon: ReactNode; title: string }) {
  return (
    <article className="workflow-card">
      <span>{icon}</span>
      <h3>{title}</h3>
      <p>{copy}</p>
    </article>
  );
}

export function ProofPill({ label }: { label: string }) {
  return (
    <span className="proof-pill">
      <CheckCircle2 aria-hidden="true" size={15} />
      {label}
    </span>
  );
}

export function StepBadge({ active, label, number }: { active?: boolean; label: string; number: string }) {
  return (
    <div className={`step-badge ${active ? "active" : ""}`}>
      <span>{number}</span>
      <strong>{label}</strong>
    </div>
  );
}

export function Field({ children, label, wide }: { children: ReactNode; label: string; wide?: boolean }) {
  return (
    <label className={wide ? "field wide" : "field"}>
      <span>{label}</span>
      {children}
    </label>
  );
}

export function FormSection({
  children,
  description,
  eyebrow,
  title
}: {
  children: ReactNode;
  description: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <section className="form-section">
      <div className="form-section-heading">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
        </div>
        <p>{description}</p>
      </div>
      <div className="form-grid">{children}</div>
    </section>
  );
}

export function Badge({ children, tone }: { children: ReactNode; tone: string }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

export function SidebarMetric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="sidebar-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function ProfileItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="profile-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="review-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function FlowNode({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flow-node">
      {icon}
      <span>{label}</span>
    </div>
  );
}

export function FlowArrow() {
  return <ChevronRight aria-hidden="true" className="flow-arrow" size={18} />;
}

export function StatusStep({
  copy,
  state,
  title
}: {
  copy: string;
  state: "complete" | "current" | "waiting";
  title: string;
}) {
  return (
    <div className={`status-step ${state}`}>
      <span>{state === "complete" ? <CheckCircle2 aria-hidden="true" size={16} /> : <FileCheck2 aria-hidden="true" size={16} />}</span>
      <div>
        <strong>{title}</strong>
        <p>{copy}</p>
      </div>
    </div>
  );
}
