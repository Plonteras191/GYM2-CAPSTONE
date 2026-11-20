import { useEffect, useState } from 'react';
import { FiAlertTriangle, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { aiEngineFetch } from '../../utils/aiEngine';

// Enrollment problems found by the AI engine (Gesture Engine/gallery_health.py):
// members the camera cannot recognise, duplicate records, and look-alikes.
// Hidden when there is nothing to fix or the engine is offline.
const REFRESH_MS = 60000;

export default function GalleryHealthBanner() {
  const [report, setReport] = useState(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await aiEngineFetch('/gallery_health');
        if (!response.ok) return;
        const data = await response.json();
        if (!cancelled) setReport(data);
      } catch {
        // Engine offline: the camera feed already says so.
      }
    };
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => { cancelled = true; clearInterval(timer); };
  }, []);

  if (!report?.ready) return null;
  const lines = [
    ...report.unrecognizable.map(m => `${m.name} cannot be recognised: ${m.status === 'missing' ? 'face photo missing' : 'no usable face in the photos'}. Re-enroll their face.`),
    ...report.duplicate_names.map(d => `"${d.name}" has ${d.member_ids.length} member records (${d.member_ids.map(id => `#${id}`).join(', ')}). Delete the extra one so check-ins go to the right record.`),
    ...report.look_alikes.filter(p => p.level === 'likely_confused').map(p => `${p.members[0].name} and ${p.members[1].name} look very alike to the camera. Re-enroll both in good light.`),
  ];
  if (lines.length === 0) return null;

  return (
    <div role="status" className="mb-3 rounded-xl border border-warn/40 bg-warn-soft px-4 py-3 text-[13px] text-warn">
      <button
        type="button"
        onClick={() => setExpanded(value => !value)}
        aria-expanded={expanded}
        className="flex w-full items-center gap-2 text-left font-medium"
      >
        <FiAlertTriangle size={16} className="shrink-0" />
        <span className="flex-1">
          Face recognition: {lines.length} enrollment {lines.length === 1 ? 'problem' : 'problems'} to fix
        </span>
        {expanded ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
      </button>
      {expanded && (
        <ul className="mt-2 list-disc space-y-1 pl-8 text-ink-2">
          {lines.map(line => <li key={line}>{line}</li>)}
        </ul>
      )}
    </div>
  );
}
