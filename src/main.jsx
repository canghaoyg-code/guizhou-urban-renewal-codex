import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { CalendarDays, ExternalLink, FileSearch, Landmark, RefreshCw, Search } from 'lucide-react';
import { fallbackInfo } from './data/projectData';
import './styles.css';

function formatDateTime(value) {
  if (!value) return '待更新';

  try {
    return new Intl.DateTimeFormat('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function normalizeInfo(info) {
  return {
    ...fallbackInfo,
    ...info,
    projectSources: info?.projectSources?.length ? info.projectSources : fallbackInfo.projectSources,
    policySources: info?.policySources?.length ? info.policySources : fallbackInfo.policySources,
    projects: info?.projects?.length ? info.projects : fallbackInfo.projects,
    policies: info?.policies?.length ? info.policies : fallbackInfo.policies,
  };
}

function includesText(value, keyword) {
  return String(value || '').toLowerCase().includes(keyword);
}

function App() {
  const [info, setInfo] = useState(fallbackInfo);
  const [query, setQuery] = useState('');
  const [loadState, setLoadState] = useState('读取内置样例');

  useEffect(() => {
    let active = true;

    fetch(`./data/public-info.json?t=${Date.now()}`, { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (!active) return;
        setInfo(normalizeInfo(data));
        setLoadState('已读取每日采集数据');
      })
      .catch(() => {
        if (!active) return;
        setInfo(fallbackInfo);
        setLoadState('使用内置样例数据');
      });

    return () => {
      active = false;
    };
  }, []);

  const keyword = query.trim().toLowerCase();
  const projects = useMemo(() => {
    if (!keyword) return info.projects;
    return info.projects.filter((project) => {
      return [
        project.title,
        project.city,
        project.district,
        project.projectType,
        project.ownerUnit,
        project.address,
        project.currentStatus,
        project.summary,
      ].some((field) => includesText(field, keyword));
    });
  }, [info.projects, keyword]);

  const policies = useMemo(() => {
    if (!keyword) return info.policies;
    return info.policies.filter((policy) => {
      return [
        policy.title,
        policy.sourceName,
        policy.issuingBody,
        policy.policyLevel,
        policy.topic,
        policy.summary,
      ].some((field) => includesText(field, keyword));
    });
  }, [info.policies, keyword]);

  return (
    <main className="app">
      <section className="hero">
        <div>
          <p className="eyebrow">Public Notice Registry</p>
          <h1>规划项目公示信息台账</h1>
          <p className="hero-text">
            每日自动抓取公示项目与政策信息，页面仅展示项目基础信息和政策详情，作为后续人工研判前的干净线索池。
          </p>
        </div>
        <div className="status-card">
          <RefreshCw size={24} />
          <span>{loadState}</span>
          <strong>{formatDateTime(info.lastUpdated)}</strong>
        </div>
      </section>

      <section className="summary-grid" aria-label="采集概览">
        <div className="summary-item">
          <span>项目公示源</span>
          <strong>{info.projectSources.length}</strong>
        </div>
        <div className="summary-item">
          <span>政策来源</span>
          <strong>{info.policySources.length}</strong>
        </div>
        <div className="summary-item">
          <span>项目详情</span>
          <strong>{projects.length}</strong>
        </div>
        <div className="summary-item">
          <span>政策详情</span>
          <strong>{policies.length}</strong>
        </div>
      </section>

      <section className="toolbar" aria-label="信息检索">
        <Search size={18} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索项目、地区、单位、政策主题"
        />
      </section>

      <section className="source-band">
        <SourceList title="项目抓取源" sources={info.projectSources} />
        <SourceList title="政策抓取源" sources={info.policySources} />
      </section>

      <section className="content-section">
        <div className="section-heading">
          <FileSearch size={20} />
          <h2>项目公示详情</h2>
        </div>
        <div className="card-list">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
          {!projects.length && <EmptyState text="没有匹配的项目公示。" />}
        </div>
      </section>

      <section className="content-section">
        <div className="section-heading">
          <Landmark size={20} />
          <h2>政策详情</h2>
        </div>
        <div className="card-list">
          {policies.map((policy) => (
            <PolicyCard key={policy.id} policy={policy} />
          ))}
          {!policies.length && <EmptyState text="没有匹配的政策信息。" />}
        </div>
      </section>
    </main>
  );
}

function SourceList({ title, sources }) {
  return (
    <article className="source-panel">
      <h2>{title}</h2>
      <div className="source-list">
        {sources.map((source) => (
          <a key={source.id} href={source.url} target="_blank" rel="noreferrer">
            <span>{source.name}</span>
            <small>{source.scope}</small>
            <ExternalLink size={15} />
          </a>
        ))}
      </div>
    </article>
  );
}

function ProjectCard({ project }) {
  const fields = [
    ['地区', `${project.city || '待补充'} · ${project.district || '待补充'}`],
    ['类型', project.projectType],
    ['公示日期', project.disclosureDate],
    ['业主单位', project.ownerUnit],
    ['项目地址', project.address],
    ['当前状态', project.currentStatus],
    ['用地属性', project.landUse],
    ['更新范围', project.renewalScope],
  ];

  return (
    <article className="detail-card">
      <div className="card-topline">
        <span>{project.sourceName}</span>
        <span>{project.currentStatus}</span>
      </div>
      <h3>{project.title}</h3>
      <p>{project.summary}</p>
      <dl className="detail-grid">
        {fields.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value || '待补充'}</dd>
          </div>
        ))}
      </dl>
      <DetailRows rows={project.details} />
      <a className="source-link" href={project.sourceUrl} target="_blank" rel="noreferrer">
        打开原文来源
        <ExternalLink size={15} />
      </a>
    </article>
  );
}

function PolicyCard({ policy }) {
  const fields = [
    ['发布日期', policy.publishDate],
    ['发布单位', policy.issuingBody],
    ['政策层级', policy.policyLevel],
    ['主题', policy.topic],
  ];

  return (
    <article className="detail-card policy-card">
      <div className="card-topline">
        <span>{policy.sourceName}</span>
        <span>{policy.policyLevel}</span>
      </div>
      <h3>{policy.title}</h3>
      <p>{policy.summary}</p>
      <dl className="detail-grid">
        {fields.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value || '待补充'}</dd>
          </div>
        ))}
      </dl>
      <ul className="point-list">
        {(policy.keyPoints || []).map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
      <a className="source-link" href={policy.sourceUrl} target="_blank" rel="noreferrer">
        打开政策原文
        <ExternalLink size={15} />
      </a>
    </article>
  );
}

function DetailRows({ rows = [] }) {
  if (!rows.length) return null;

  return (
    <dl className="row-list">
      {rows.map((row) => (
        <div key={row.label}>
          <dt>{row.label}</dt>
          <dd>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function EmptyState({ text }) {
  return (
    <div className="empty-state">
      <CalendarDays size={22} />
      <span>{text}</span>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
