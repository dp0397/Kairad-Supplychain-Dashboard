import React, { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/**
 * Pune Logistics Market Research & Tracking Dashboard
 * Single-file React component. Stack: React + Tailwind CSS + Recharts + react-leaflet.
 *
 * Drop into any Tailwind-configured project (with `leaflet` + `react-leaflet` installed)
 * and render <PuneLogisticsDashboard />. All state is mocked below — swap MARKET_DATA /
 * TRACKING_DATA for fetch() calls without changing markup.
 */

// ---------------------------------------------------------------------------
// Mock data — Market Overview
// ---------------------------------------------------------------------------

const MARKET_DATA = {
  regions: {
    Chakan: {
      metrics: {
        existingSpaceSqFt: 15000000,
        utilizedPercentage: 92,
        unfulfilledDemandSqFt: 2500000,
        dailyFreightTonnage: 45000,
      },
      industries: [
        { name: "Automotive OEMs", share: 45 },
        { name: "Auto-Ancillary", share: 30 },
        { name: "Engineering", share: 15 },
        { name: "Electronics", share: 7 },
        { name: "FMCG", share: 3 },
      ],
      logisticsMapping: [
        { client: "Bajaj Auto", industry: "Automotive", logisticsProvider: "Mahindra Logistics" },
        { client: "TVS Supply Chain", industry: "Logistics", logisticsProvider: "All India Transport" },
        { client: "Mercedes-Benz", industry: "Automotive", logisticsProvider: "DHL Supply Chain" },
        { client: "Bridgestone", industry: "Auto-Ancillary", logisticsProvider: "FM Logistic" },
      ],
    },
    Talegaon: {
      metrics: {
        existingSpaceSqFt: 8000000,
        utilizedPercentage: 88,
        unfulfilledDemandSqFt: 1200000,
        dailyFreightTonnage: 22000,
      },
      industries: [
        { name: "Automotive OEMs", share: 40 },
        { name: "E-commerce Fulfillment", share: 25 },
        { name: "FMCG", share: 20 },
        { name: "Pharma", share: 10 },
        { name: "Agri-Tech", share: 5 },
      ],
      logisticsMapping: [
        { client: "General Motors (Legacy)", industry: "Automotive", logisticsProvider: "TCI Supply Chain" },
        { client: "Amazon Fulfillment", industry: "E-commerce", logisticsProvider: "Delhivery" },
        { client: "L'Oréal", industry: "FMCG", logisticsProvider: "Navata SCS" },
      ],
    },
    Ranjangaon: {
      metrics: {
        existingSpaceSqFt: 11000000,
        utilizedPercentage: 95,
        unfulfilledDemandSqFt: 3100000,
        dailyFreightTonnage: 38000,
      },
      industries: [
        { name: "Automotive OEMs", share: 52 },
        { name: "Auto-Ancillary", share: 28 },
        { name: "Engineering", share: 12 },
        { name: "FMCG", share: 5 },
        { name: "Pharma", share: 3 },
      ],
      logisticsMapping: [
        { client: "Daimler India", industry: "Automotive", logisticsProvider: "DHL Supply Chain" },
        { client: "Bharat Forge", industry: "Engineering", logisticsProvider: "TCI Supply Chain" },
        { client: "Fiat India", industry: "Automotive", logisticsProvider: "Mahindra Logistics" },
      ],
    },
  },
};

// ---------------------------------------------------------------------------
// Mock data — Multimodal Live Tracking (ULIP / E-Way Bill integration)
// ---------------------------------------------------------------------------

const TRACKING_DATA = {
  EWB123456789: {
    summary: {
      containerId: "HLXU8123456",
      carrier: "CONCOR (Container Corporation of India)",
      vehicleNumber: "MH-12 GT 4521",
      origin: "Chakan MIDC, Pune",
      destination: "JNPT Port, Navi Mumbai",
      status: "In Transit - Rail",
      eta: "2026-08-05 18:00 IST",
    },
    mapCoordinates: {
      origin: [18.7513, 73.8348],
      destination: [18.9497, 72.9515],
      currentLocation: [18.895, 73.284],
    },
    milestones: [
      { time: "2026-08-04 08:00", node: "GSTN E-Way Bill", mode: "gstn", event: "E-Way Bill Generated at Origin" },
      { time: "2026-08-04 10:30", node: "Vahan/FASTag", mode: "road", event: "Crossed Khalapur Toll Plaza (Road)" },
      { time: "2026-08-04 12:45", node: "LDB/NLDS", mode: "container", event: "Inwarded at ICD Talegaon" },
      { time: "2026-08-04 14:15", node: "FOIS", mode: "rail", event: "Loaded onto CONCOR Rake - Departed for JNPT" },
    ],
  },
  EWB987654321: {
    summary: {
      containerId: "MSCU7789012",
      carrier: "Mahindra Logistics",
      vehicleNumber: "MH-14 BR 7788",
      origin: "Ranjangaon MIDC, Pune",
      destination: "ICD Talegaon",
      status: "In Transit - Road",
      eta: "2026-08-04 20:30 IST",
    },
    mapCoordinates: {
      origin: [18.7768, 74.2168],
      destination: [18.7331, 73.6742],
      currentLocation: [18.752, 73.91],
    },
    milestones: [
      { time: "2026-08-04 09:15", node: "GSTN E-Way Bill", mode: "gstn", event: "E-Way Bill Generated at Origin" },
      { time: "2026-08-04 11:00", node: "Vahan/FASTag", mode: "road", event: "Crossed Shikrapur Toll Plaza (Road)" },
    ],
  },
};

// ---------------------------------------------------------------------------
// Design tokens (fixed categorical order — never reassigned per-region)
// ---------------------------------------------------------------------------

const INDUSTRY_COLOR_ORDER = [
  "Automotive OEMs",
  "Auto-Ancillary",
  "Engineering",
  "E-commerce Fulfillment",
  "FMCG",
  "Electronics",
  "Pharma",
  "Agri-Tech",
];

const CATEGORICAL_HEX = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#4a3aa7", "#e34948"];

function industryColor(name) {
  const idx = INDUSTRY_COLOR_ORDER.indexOf(name);
  return CATEGORICAL_HEX[idx >= 0 ? idx : CATEGORICAL_HEX.length - 1];
}

// Fixed node -> mode color mapping used across the timeline, map legend, and markers.
const MODE_STYLES = {
  gstn: { label: "GSTN", color: "#2a78d6" },
  road: { label: "Road · FASTag", color: "#eb6834" },
  container: { label: "Container · ICD", color: "#1baf7a" },
  rail: { label: "Rail · FOIS", color: "#4a3aa7" },
};

const fmtSqFt = (n) => `${(n / 1_000_000).toFixed(2)}M sq ft`;
const fmtTonnage = (n) => `${(n / 1000).toFixed(1)}k tonnes/day`;
const fmtCompact = (n) => new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(n);

// ---------------------------------------------------------------------------
// Tab 1 subcomponents — Market Overview
// ---------------------------------------------------------------------------

function KpiCard({ eyebrow, value, unit, footnote, accent, children }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {eyebrow}
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span
          className="font-mono text-3xl font-semibold tabular-nums text-slate-900 dark:text-slate-50"
          style={accent ? { color: accent } : undefined}
        >
          {value}
        </span>
        {unit && <span className="text-sm text-slate-500 dark:text-slate-400">{unit}</span>}
      </div>
      {children}
      {footnote && <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">{footnote}</div>}
    </div>
  );
}

function UtilizationBar({ utilizedPct }) {
  const vacantPct = 100 - utilizedPct;
  return (
    <div className="mt-3">
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div className="h-full bg-[#2a78d6]" style={{ width: `${utilizedPct}%` }} title={`Utilized: ${utilizedPct}%`} />
        <div className="h-full bg-slate-300 dark:bg-slate-600" style={{ width: `${vacantPct}%` }} title={`Vacant: ${vacantPct}%`} />
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-[#2a78d6]" /> Utilized
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600" /> Vacant
        </span>
      </div>
    </div>
  );
}

function IndustriesChart({ industries }) {
  const data = [...industries].sort((a, b) => b.share - a.share);
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Top Industries by Demand Share</h3>
      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
        Share of leased warehousing space by end-use industry
      </p>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 24, bottom: 0, left: 8 }}>
            <CartesianGrid horizontal={false} stroke="#e1e0d9" strokeDasharray="3 3" />
            <XAxis
              type="number"
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
              tick={{ fontSize: 11, fill: "#898781" }}
              axisLine={{ stroke: "#c3c2b7" }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={150}
              tick={{ fontSize: 12, fill: "#52514e" }}
              axisLine={{ stroke: "#c3c2b7" }}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: "rgba(148,163,184,0.12)" }}
              formatter={(value) => [`${value}%`, "Share"]}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e1e0d9" }}
            />
            <Bar dataKey="share" radius={[0, 4, 4, 0]} barSize={18}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={industryColor(entry.name)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function LogisticsTable({ rows }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Anchor Clients &amp; 3PL Mapping</h3>
      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
        Primary logistics provider of choice, by anchor client
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[480px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
              <th className="py-2 pr-4 font-semibold">Client</th>
              <th className="py-2 pr-4 font-semibold">Industry</th>
              <th className="py-2 font-semibold">3PL / Logistics Provider</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.client} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                <td className="py-2.5 pr-4 font-medium text-slate-900 dark:text-slate-50">{row.client}</td>
                <td className="py-2.5 pr-4">
                  <span
                    className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                    style={{ backgroundColor: `${industryColor(row.industry)}1a`, color: industryColor(row.industry) }}
                  >
                    {row.industry}
                  </span>
                </td>
                <td className="py-2.5 font-mono text-slate-700 dark:text-slate-300">{row.logisticsProvider}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MarketOverviewTab() {
  const regionNames = Object.keys(MARKET_DATA.regions);
  const [region, setRegion] = useState(regionNames[0]);

  const data = useMemo(() => MARKET_DATA.regions[region], [region]);
  const { metrics, industries, logisticsMapping } = data;

  const shortfallPct = Math.round((metrics.unfulfilledDemandSqFt / metrics.existingSpaceSqFt) * 100);

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">Sub-Region Demand &amp; 3PL Overview</h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Warehousing demand, utilization, and provider mapping by corridor</p>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Sub-region</span>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="min-w-[220px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm focus:border-[#2a78d6] focus:outline-none focus:ring-2 focus:ring-[#2a78d6]/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
          >
            {regionNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard eyebrow="Existing Warehouse Space" value={fmtSqFt(metrics.existingSpaceSqFt).split(" ")[0]} unit="M sq ft">
          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">Grade A + B stock, {region}</div>
        </KpiCard>

        <KpiCard eyebrow="Utilized Space" value={`${metrics.utilizedPercentage}`} unit="%" accent="#2a78d6">
          <UtilizationBar utilizedPct={metrics.utilizedPercentage} />
        </KpiCard>

        <KpiCard
          eyebrow="Unfulfilled Demand"
          value={fmtCompact(metrics.unfulfilledDemandSqFt)}
          unit="sq ft"
          accent="#eb6834"
          footnote={`≈ ${shortfallPct}% of existing stock — expansion pressure`}
        />

        <KpiCard eyebrow="Daily Freight Volume" value={fmtTonnage(metrics.dailyFreightTonnage).split(" ")[0]} unit="tonnes / day" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <IndustriesChart industries={industries} />
        </div>
        <div className="lg:col-span-3">
          <LogisticsTable rows={logisticsMapping} />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 2 subcomponents — Multimodal Live Tracking
// ---------------------------------------------------------------------------

function pinIcon(color, label) {
  return L.divIcon({
    className: "",
    html: `<div style="
      background:${color}; color:#fff; font-size:10px; font-weight:700;
      width:26px; height:26px; border-radius:50% 50% 50% 0; transform:rotate(-45deg);
      display:flex; align-items:center; justify-content:center;
      border:2px solid #fff; box-shadow:0 1px 4px rgba(0,0,0,0.35);
    "><span style="transform:rotate(45deg)">${label}</span></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
    popupAnchor: [0, -26],
  });
}

const ORIGIN_ICON = pinIcon("#1baf7a", "O");
const DEST_ICON = pinIcon("#eb6834", "D");
const CURRENT_ICON = pinIcon("#2a78d6", "●");

function ShipmentMap({ coords }) {
  const { origin, destination, currentLocation } = coords;
  const center = currentLocation;

  return (
    <div className="h-80 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
      <MapContainer center={center} zoom={9} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Polyline positions={[origin, currentLocation, destination]} pathOptions={{ color: "#2a78d6", weight: 3, dashArray: "6 6" }} />
        <Marker position={origin} icon={ORIGIN_ICON}>
          <Popup>Origin</Popup>
        </Marker>
        <Marker position={destination} icon={DEST_ICON}>
          <Popup>Destination</Popup>
        </Marker>
        <Marker position={currentLocation} icon={CURRENT_ICON}>
          <Popup>Last Ping (Current Location)</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}

function ShipmentDetailsCard({ summary }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Shipment Details</h3>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div>
          <dt className="text-xs text-slate-500 dark:text-slate-400">Carrier</dt>
          <dd className="mt-0.5 font-medium text-slate-900 dark:text-slate-50">{summary.carrier}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500 dark:text-slate-400">Vehicle / Container</dt>
          <dd className="mt-0.5 font-mono text-slate-900 dark:text-slate-50">{summary.vehicleNumber}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500 dark:text-slate-400">Container ID</dt>
          <dd className="mt-0.5 font-mono text-slate-900 dark:text-slate-50">{summary.containerId}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500 dark:text-slate-400">Current Status</dt>
          <dd className="mt-0.5">
            <span className="inline-flex items-center rounded-full bg-[#2a78d6]/10 px-2.5 py-0.5 text-xs font-semibold text-[#2a78d6]">
              {summary.status}
            </span>
          </dd>
        </div>
        <div className="col-span-2 border-t border-slate-100 pt-3 dark:border-slate-800">
          <dt className="text-xs text-slate-500 dark:text-slate-400">Route</dt>
          <dd className="mt-0.5 text-slate-700 dark:text-slate-300">
            {summary.origin} <span className="text-slate-400">→</span> {summary.destination}
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="text-xs text-slate-500 dark:text-slate-400">Estimated Time of Arrival</dt>
          <dd className="mt-0.5 font-mono font-semibold text-slate-900 dark:text-slate-50">{summary.eta}</dd>
        </div>
      </dl>
    </div>
  );
}

function MilestoneTimeline({ milestones }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Journey Milestones</h3>
      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Cross-referenced against ULIP / national transport ministry nodes</p>

      <div className="mt-5 flex flex-wrap gap-3">
        {Object.entries(MODE_STYLES).map(([key, m]) => (
          <span key={key} className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: m.color }} />
            {m.label}
          </span>
        ))}
      </div>

      <ol className="mt-5 space-y-0">
        {milestones.map((m, i) => {
          const style = MODE_STYLES[m.mode] || MODE_STYLES.gstn;
          const isLast = i === milestones.length - 1;
          return (
            <li key={i} className="relative flex gap-4 pb-6 last:pb-0">
              {!isLast && <span className="absolute left-[9px] top-5 h-full w-px bg-slate-200 dark:bg-slate-700" />}
              <span
                className="mt-1 h-5 w-5 shrink-0 rounded-full border-2 border-white shadow dark:border-slate-900"
                style={{ backgroundColor: style.color }}
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
                    style={{ backgroundColor: `${style.color}1a`, color: style.color }}
                  >
                    {m.node}
                  </span>
                  <span className="font-mono text-[11px] text-slate-400">{m.time}</span>
                </div>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{m.event}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function TrackingTab() {
  const [query, setQuery] = useState("EWB123456789");
  const [activeId, setActiveId] = useState("EWB123456789");
  const [notFound, setNotFound] = useState(false);

  const record = activeId ? TRACKING_DATA[activeId] : null;

  const handleTrack = () => {
    const key = query.trim().toUpperCase();
    const match =
      TRACKING_DATA[key] ||
      Object.entries(TRACKING_DATA).find(([, v]) => v.summary.containerId.toUpperCase() === key)?.[1];
    if (match) {
      const foundKey = TRACKING_DATA[key] ? key : Object.keys(TRACKING_DATA).find((k) => TRACKING_DATA[k] === match);
      setActiveId(foundKey);
      setNotFound(false);
    } else {
      setNotFound(true);
    }
  };

  return (
    <div>
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">Multimodal Live Tracking</h2>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          ULIP-integrated load tracking across GSTN, FASTag/Vahan, LDB/NLDS, and FOIS nodes
        </p>
      </div>

      <div className="mt-5 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:flex-row sm:items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleTrack()}
          placeholder="Enter E-Way Bill Number or Container ID"
          className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono text-slate-900 shadow-sm focus:border-[#2a78d6] focus:outline-none focus:ring-2 focus:ring-[#2a78d6]/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
        />
        <button
          onClick={handleTrack}
          className="rounded-lg bg-[#2a78d6] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2166bd] active:bg-[#1c599f]"
        >
          Track Load
        </button>
      </div>

      {notFound && (
        <div className="mt-3 rounded-lg border border-[#eb6834]/30 bg-[#eb6834]/10 px-4 py-2 text-sm text-[#eb6834]">
          No shipment found for "{query}". Try EWB123456789 or EWB987654321.
        </div>
      )}

      {record && (
        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <ShipmentMap coords={record.mapCoordinates} />
          </div>
          <div className="lg:col-span-2">
            <ShipmentDetailsCard summary={record.summary} />
          </div>
          <div className="lg:col-span-5">
            <MilestoneTimeline milestones={record.milestones} />
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main dashboard
// ---------------------------------------------------------------------------

const TABS = [
  { key: "market", label: "Market Overview" },
  { key: "tracking", label: "Multimodal Live Tracking" },
];

export default function PuneLogisticsDashboard() {
  const [tab, setTab] = useState("market");

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8 dark:bg-slate-950 sm:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#2a78d6]">
          Market Research · Pune Logistics Corridor
        </div>
        <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-50">Logistics Market Research &amp; Tracking Dashboard</h1>

        <div className="mt-6 flex gap-1 border-b border-slate-200 dark:border-slate-800">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
                tab === t.key
                  ? "border-[#2a78d6] text-[#2a78d6]"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-6">{tab === "market" ? <MarketOverviewTab /> : <TrackingTab />}</div>
      </div>
    </div>
  );
}
