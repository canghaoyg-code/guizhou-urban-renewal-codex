import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import {
  Activity, CalendarDays, CheckCircle2, ClipboardCheck, Database, ExternalLink,
  FileSearch, Filter, Link as LinkIcon, MapPin, Radar, RefreshCw
} from 'lucide-react';
import { futureModules, publicProjects, publicSources, sevenDayPlan } from './data/projectData';
import './styles.css';

function getSource(project) {
  return publicSources.find((source) => source.id === project.sourceId);
}

function getCompleteness(project) {
  const match = project.baseInfo.find((item) => item.label === '资料完整度')?.value.match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function App() {
  const [city, setCity] = useState('全部');
  const [projectType, setProjectType] = useState('全部');
  const [sourceId, setSourceId] = useState('全部');
  const [selectedProjectId, setSelectedProjectId] = useState(publicProjects[0].id);

  const filtered = useMemo(() => {
    return publicProjects.filter((project) => {
      const cityMatch = city === '全部' || project.city === city;
      const typeMatch = projectType === '全部' || project.projectType === projectType;
      const sourceMatch = sourceId === '全部' || project.sourceId === sourceId;
      return cityMatch && typeMatch && sourceMatch;
    });
  }, [city, projectType, sourceId]);

  const selectedProject = publicProjects.find((project) => project.id === selectedProjectId) || publicProjects[0];
  const selectedSource = getSource(selectedProject);
  const completeness = getCompleteness(selectedProject);
  const pendingMetricCount = selectedProject.surroundingMetrics.filter((metric) => metric.status !== '样例').length;

  const cityOptions = ['全部', ...new Set(publicProjects.map((project) => project.city))];
  const typeOptions = ['全部', ...new Set(publicProjects.map((project) => project.projectType))];
  const sourceOptions = ['全部', ...publicSources.map((source) => source.id)];

  const completenessData = publicProjects.map((project) => ({
    name: project.district,
    completeness: getCompleteness(project),
  }));

  const metricChartData = selectedProject.surroundingMetrics.map((metric) => ({
    name: metric.name,
    value: metric.value,
    unit: metric.unit,
  }));

  return (
    <main className="app">
      <section className="hero">
        <div>
          <p className="eyebrow">Public Notice Project Intelligence · Guizhou</p>
          <h1>贵州城市更新公示项目基础信息工作台</h1>
          <p className="hero-text">
            固定抓取政府公示和公共资源页面，打开项目原文后填充基础信息，并把人流、空铺率、竞品、停车等周边数据纳入同一套可视化面板。
          </p>
        </div>
        <div className="hero-card">
          <Database size={28} />
          <div>
            <span>当前工作重点</span>
            <strong>基础档案</strong>
          </div>
          <div className="mini-grid">
            <p>固定公示源：{publicSources.length}个</p>
            <p>样例项目：{publicProjects.length}个</p>
            <p>核心接口：原文抽取</p>
            <p>下一步：现场补数</p>
          </div>
        </div>
      </section>

      <section className="kpis">
        <div className="kpi">
          <span>公示源</span>
          <strong>{publicSources.length}</strong>
          <p>白名单页面与解析器</p>
        </div>
        <div className="kpi">
          <span>项目池</span>
          <strong>{filtered.length}</strong>
          <p>按条件筛选后的项目</p>
        </div>
        <div className="kpi">
          <span>当前完整度</span>
          <strong>{completeness}%</strong>
          <p>{selectedProject.title}</p>
        </div>
        <div className="kpi">
          <span>待补周边数据</span>
          <strong>{pendingMetricCount}</strong>
          <p>需要现场或接口补齐</p>
        </div>
      </section>

      <section className="panel">
        <div className="section-title">
          <RefreshCw size={20} />
          <h2>固定抓取源</h2>
        </div>
        <div className="source-grid">
          {publicSources.map((source) => (
            <article className="source-card" key={source.id}>
              <div>
                <p className="tag">{source.status} · {source.cadence}</p>
                <h3>{source.name}</h3>
                <p>{source.scope}</p>
              </div>
              <div className="source-meta">
                <span>解析器：{source.parser}</span>
                <span>字段：{source.fields.length}项</span>
              </div>
              <a href={source.url} target="_blank" rel="noreferrer">
                打开公示页面
                <ExternalLink size={15} />
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="panel filters">
        <div className="section-title">
          <Filter size={20} />
          <h2>项目筛选器</h2>
        </div>
        <div className="filter-row">
          <label>
            城市
            <select value={city} onChange={(event) => setCity(event.target.value)}>
              {cityOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
          <label>
            类型
            <select value={projectType} onChange={(event) => setProjectType(event.target.value)}>
              {typeOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
          <label>
            来源
            <select value={sourceId} onChange={(event) => setSourceId(event.target.value)}>
              {sourceOptions.map((option) => (
                <option key={option} value={option}>
                  {option === '全部' ? '全部' : publicSources.find((source) => source.id === option)?.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="grid two">
        <div className="panel">
          <div className="section-title">
            <FileSearch size={20} />
            <h2>公示项目池</h2>
          </div>
          <div className="project-list">
            {filtered.map((project) => (
              <article
                className={`project-row ${selectedProject.id === project.id ? 'selected' : ''}`}
                key={project.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedProjectId(project.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    setSelectedProjectId(project.id);
                  }
                }}
              >
                <div>
                  <p className="tag">{project.city} · {project.district} · {project.projectType}</p>
                  <h3>{project.title}</h3>
                  <p>{project.summary}</p>
                </div>
                <div className="row-status">
                  <strong>{getCompleteness(project)}%</strong>
                  <span>{project.dataStatus}</span>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="section-title">
            <Activity size={20} />
            <h2>资料完整度</h2>
          </div>
          <div className="chart">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={completenessData}>
                <CartesianGrid stroke="#dce3ec" strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="completeness" name="资料完整度" fill="#2d6f8f" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="grid two details-grid">
        <div className="panel">
          <div className="section-title">
            <ClipboardCheck size={20} />
            <h2>项目基础信息面板</h2>
          </div>
          <div className="detail-head">
            <div>
              <p className="tag">{selectedProject.currentStatus} · {selectedProject.disclosureDate}</p>
              <h3>{selectedProject.title}</h3>
              <p>{selectedProject.address}</p>
            </div>
            <div className="status-pill">{selectedProject.dataStatus}</div>
          </div>
          <div className="detail-list">
            <span>来源：{selectedSource?.name}</span>
            <span>业主/主管：{selectedProject.ownerUnit}</span>
            <span>用途：{selectedProject.landUse}</span>
            <span>区县：{selectedProject.city} · {selectedProject.district}</span>
            <span>更新范围：{selectedProject.renewalScope}</span>
            <span>原文链接：<a href={selectedProject.sourceUrl} target="_blank" rel="noreferrer">打开</a></span>
          </div>
          <div className="base-grid">
            {selectedProject.baseInfo.map((item) => (
              <div className="base-item" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
          <div className="signals">
            {selectedProject.tags.map((tag) => <span key={tag}>{tag}</span>)}
          </div>
        </div>

        <div className="panel">
          <div className="section-title">
            <MapPin size={20} />
            <h2>周边数据接口</h2>
          </div>
          <div className="metric-list">
            {selectedProject.surroundingMetrics.map((metric) => (
              <div className="metric-item" key={metric.name}>
                <div>
                  <span>{metric.name}</span>
                  <strong>{metric.value}{metric.unit}</strong>
                </div>
                <p>{metric.status} · {metric.source}</p>
              </div>
            ))}
          </div>
          <div className="chart compact-chart">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={metricChartData}>
                <CartesianGrid stroke="#dce3ec" strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip formatter={(value, name, props) => [`${value}${props.payload.unit}`, '指标值']} />
                <Line type="monotone" dataKey="value" name="指标值" stroke="#1f6b4a" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="grid two">
        <div className="panel">
          <div className="section-title">
            <CalendarDays size={20} />
            <h2>7天数据行动表</h2>
          </div>
          <div className="timeline">
            {sevenDayPlan.map((day) => (
              <div className="timeline-item" key={day.day}>
                <div className="day">D{day.day}</div>
                <div>
                  <h3>{day.title}</h3>
                  <p>{day.output}</p>
                  <div className="interface-name">
                    <LinkIcon size={15} />
                    {day.interfaceName}
                  </div>
                  <div className="tasks">
                    {day.tasks.map((task) => <span key={task}>{task}</span>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="section-title">
            <Radar size={20} />
            <h2>后续功能补足</h2>
          </div>
          <div className="checklist single">
            {futureModules.map((item) => (
              <div className="check-item" key={item}>
                <CheckCircle2 size={18} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
