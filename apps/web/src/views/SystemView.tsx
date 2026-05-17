import { Activity, ArrowRight, Building2, Database, FileText, LayoutDashboard, ShieldCheck, Sparkles, UserRound } from "lucide-react";

import { Badge, FlowArrow, FlowNode, MetricTile } from "../components/ui";
import { systemCopy, systemWorkflowSteps } from "../copy";
import {
  derivedFeatureRows,
  derivedReasonIdByModelColumn,
  featureMappingIdByRequestField,
  featureSourceIdByRequestField,
  mlFeatureMapRows
} from "../featureMapping";
import {
  formatAuthMode,
  formatMlApiTargetCaption,
  formatMlIntegration,
  formatScoringMode,
  formatScoringModeCaption,
  formatStorageMode,
  formatWebAppMode
} from "../formatters";
import type { AppLanguage, DemoSummary } from "../types";
export function SystemView({
  apiBaseUrl,
  isLoading,
  language,
  summary,
}: {
  apiBaseUrl: string;
  isLoading: boolean;
  language: AppLanguage;
  summary: DemoSummary | null;
}) {
  const copy = systemCopy[language];
  const featureCountsLabel =
    language === "id"
      ? "Jumlah field dan kolom model"
      : "Feature mapping counts";
  const apiUrlValue =
    apiBaseUrl === "Same origin"
      ? language === "id"
        ? "Origin yang sama"
        : "Same origin"
      : "API";

  return (
    <section className="view-stack">
      <section className="page-intro">
        <div>
          <p className="eyebrow">{copy.pageEyebrow}</p>
          <h1>{copy.pageTitle}</h1>
          <p>{copy.pageDescription}</p>
        </div>
        <Badge tone={isLoading ? "warning" : "positive"}>
          {isLoading ? copy.loading : copy.loaded}
        </Badge>
      </section>

      <section className="system-grid">
        <MetricTile
          icon={<Database aria-hidden="true" size={20} />}
          label={copy.metricStorage}
          value={formatStorageMode(summary?.integration.database, language)}
          caption={copy.metricStorageCaption}
        />
        <MetricTile
          icon={<Sparkles aria-hidden="true" size={20} />}
          label={copy.metricMlApi}
          value={formatMlIntegration(summary?.integration.ml_api, language)}
          caption={formatMlApiTargetCaption(
            summary?.integration.ml_api_base_url,
            language,
          )}
        />
        <MetricTile
          icon={<ShieldCheck aria-hidden="true" size={20} />}
          label={copy.metricScoring}
          value={formatScoringMode(
            summary?.integration.ml_scoring_mode,
            language,
          )}
          caption={formatScoringModeCaption(summary, language)}
        />
        <MetricTile
          icon={<LayoutDashboard aria-hidden="true" size={20} />}
          label={copy.metricWebApp}
          value={formatWebAppMode(summary?.integration.web_app, language)}
          caption={
            summary?.integration.web_dist_available
              ? copy.metricWebCaptionReady
              : copy.metricWebCaptionDev
          }
        />
        <MetricTile
          icon={<ShieldCheck aria-hidden="true" size={20} />}
          label={copy.metricAuth}
          value={formatAuthMode(summary?.integration.auth, language)}
          caption={copy.metricAuthCaption}
        />
        <MetricTile
          icon={<Activity aria-hidden="true" size={20} />}
          label={copy.metricApiUrl}
          value={apiUrlValue}
          caption={apiBaseUrl}
        />
      </section>

      <section className="architecture-panel">
        <div>
          <p className="eyebrow">{copy.architectureEyebrow}</p>
          <h2>{copy.architectureTitle}</h2>
          <p>{copy.architectureDescription}</p>
        </div>
        <div className="architecture-flow">
          <FlowNode
            icon={<UserRound aria-hidden="true" size={18} />}
            label={copy.flowMember}
          />
          <FlowArrow />
          <FlowNode
            icon={<Building2 aria-hidden="true" size={18} />}
            label={copy.flowBackend}
          />
          <FlowArrow />
          <FlowNode
            icon={<Sparkles aria-hidden="true" size={18} />}
            label={copy.flowMl}
          />
          <FlowArrow />
          <FlowNode
            icon={<ShieldCheck aria-hidden="true" size={18} />}
            label={copy.flowOfficer}
          />
        </div>
      </section>

      <section className="workflow-explain-panel">
        <div className="feature-map-heading">
          <div>
            <p className="eyebrow">{copy.workflowEyebrow}</p>
            <h2>{copy.workflowTitle}</h2>
            <p>{copy.workflowDescription}</p>
          </div>
        </div>

        <div className="workflow-explain-grid">
          {systemWorkflowSteps.map((step) => (
            <article key={step.title.en}>
              <strong>{step.title[language]}</strong>
              <p>{step.copy[language]}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="feature-map-panel">
        <div className="feature-map-heading">
          <div>
            <p className="eyebrow">{copy.featureEyebrow}</p>
            <h2>{copy.featureTitle}</h2>
            <p>{copy.featureDescription}</p>
          </div>
          <Badge tone="positive">{copy.verifiedBadge}</Badge>
        </div>

        <div className="feature-count-strip" aria-label={featureCountsLabel}>
          <div>
            <span>{copy.countProduct}</span>
            <strong>14 fields</strong>
            <small>{copy.countProductCaption}</small>
          </div>
          <ArrowRight aria-hidden="true" size={18} />
          <div>
            <span>{copy.countRequest}</span>
            <strong>19 fields</strong>
            <small>{copy.countRequestCaption}</small>
          </div>
          <ArrowRight aria-hidden="true" size={18} />
          <div>
            <span>{copy.countModel}</span>
            <strong>25 columns</strong>
            <small>{copy.countModelCaption}</small>
          </div>
        </div>

        <div className="mapping-note">
          <FileText aria-hidden="true" size={19} />
          <p>{copy.mappingNote}</p>
        </div>

        <div className="mapping-table-wrap">
          <table className="mapping-table">
            <caption>{copy.mappingCaption}</caption>
            <thead>
              <tr>
                <th>{copy.requestFieldHeader}</th>
                <th>{copy.sourceHeader}</th>
                <th>{copy.mappingHeader}</th>
                <th>{copy.impactHeader}</th>
              </tr>
            </thead>
            <tbody>
              {mlFeatureMapRows.map((row) => (
                <tr key={row.requestField}>
                  <td>
                    <code>{row.requestField}</code>
                  </td>
                  <td>
                    {language === "id"
                      ? (featureSourceIdByRequestField[row.requestField] ??
                        row.source)
                      : row.source}
                  </td>
                  <td>
                    {language === "id"
                      ? (featureMappingIdByRequestField[row.requestField] ??
                        row.mapping)
                      : row.mapping}
                  </td>
                  <td>{row.modelColumns}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="feature-map-panel compact">
        <div className="feature-map-heading">
          <div>
            <p className="eyebrow">{copy.derivedEyebrow}</p>
            <h2>{copy.derivedTitle}</h2>
            <p>{copy.derivedDescription}</p>
          </div>
          <Badge tone="neutral">{copy.engineeredBadge}</Badge>
        </div>

        <div className="derived-grid">
          {derivedFeatureRows.map((row) => (
            <article key={row.modelColumn}>
              <strong>{row.modelColumn}</strong>
              <code>{row.formula}</code>
              <p>
                {language === "id"
                  ? (derivedReasonIdByModelColumn[row.modelColumn] ??
                    row.reason)
                  : row.reason}
              </p>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}