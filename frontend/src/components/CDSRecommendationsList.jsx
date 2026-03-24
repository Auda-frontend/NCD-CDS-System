import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  parseMedicationForDisplay,
  medSelectionKey,
  migrateLegacyMedKey,
  shouldPromptFdcAvailability,
} from '../utils/cdsMedicationDisplay';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/** Normalize decision object from API (snake_case vs camelCase). */
function normDecision(d) {
  if (!d || typeof d !== 'object') return null;
  return {
    diagnosis: d.diagnosis ?? null,
    stage: d.stage ?? null,
    sub_classification: d.sub_classification ?? d.subClassification ?? null,
    medications: Array.isArray(d.medications) ? d.medications : [],
    tests: Array.isArray(d.tests) ? d.tests : [],
    patient_advice: d.patient_advice ?? d.patientAdvice ?? null,
    needs_referral: !!(d.needs_referral ?? d.needsReferral),
    referral_reason: d.referral_reason ?? d.referralReason ?? null,
    confidence_level: d.confidence_level ?? d.confidenceLevel ?? null,
  };
}

/**
 * Expand raw medication strings into selectable lines (OR options = separate lines).
 */
function medicationStringsToSelectableLines(rawStrings, recId, decisionIndex, lineCounterRef) {
  const lines = [];
  const list = Array.isArray(rawStrings) ? rawStrings : [];
  for (const raw of list) {
    const s = typeof raw === 'string' ? raw : raw?.name || '';
    if (!s.trim()) continue;
    const parsed = parseMedicationForDisplay(s);
    let added = false;

    for (const item of parsed.items) {
      if (item.type === 'note') {
        lines.push({
          kind: 'note',
          text: item.text,
          decisionIndex,
        });
        continue;
      }
      if (item.type === 'line') {
        const key = medSelectionKey(recId, decisionIndex, lineCounterRef.value++);
        lines.push({
          kind: 'selectable',
          text: item.text,
          key,
          parsed: parseMedicationForDisplay(item.text),
          fdcPrompt: shouldPromptFdcAvailability(item.text),
          decisionIndex,
        });
        added = true;
        continue;
      }
      if (item.type === 'choose_one' && item.options?.length) {
        item.options.forEach((opt) => {
          const key = medSelectionKey(recId, decisionIndex, lineCounterRef.value++);
          lines.push({
            kind: 'selectable',
            text: opt,
            key,
            parsed: parseMedicationForDisplay(opt),
            fdcPrompt: shouldPromptFdcAvailability(opt),
            decisionIndex,
            groupLabel: item.label,
          });
        });
        added = true;
      }
    }

    if (!added && s.trim()) {
      const key = medSelectionKey(recId, decisionIndex, lineCounterRef.value++);
      lines.push({
        kind: 'selectable',
        text: s,
        key,
        parsed,
        fdcPrompt: parsed.fdcPrompt,
        decisionIndex,
      });
    }
  }
  return lines;
}

function ClassExpansionCallout({ expansions }) {
  if (!expansions?.length) return null;
  return (
    <div className="mt-2 space-y-2">
      {expansions.map((ex) => (
        <div
          key={ex.title}
          className="text-xs bg-amber-50 border border-amber-200 rounded-md px-3 py-2 text-amber-900"
        >
          <div className="font-semibold mb-1">{ex.title}</div>
          <ul className="list-disc list-inside text-amber-800">
            {ex.examples.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function SelectableMedicationRow({
  line,
  checked,
  isProcessed,
  fdcAvailable,
  onToggleMed,
  onFdcChange,
}) {
  const { text, key, parsed, fdcPrompt, groupLabel } = line;

  return (
    <div
      className={`border border-gray-200 rounded-lg p-4 ${isProcessed ? 'bg-green-50' : 'bg-gray-50'}`}
    >
      {groupLabel && (
        <p className="text-xs font-semibold text-indigo-700 mb-2 uppercase tracking-wide">
          {groupLabel}
        </p>
      )}
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 whitespace-pre-wrap break-words">{text}</div>
          <ClassExpansionCallout expansions={parsed.classExpansions} />
          {fdcPrompt && (
            <label className="mt-3 flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 rounded border-gray-300"
                checked={!!fdcAvailable[key]}
                onChange={(e) => onFdcChange(key, e.target.checked)}
              />
              <span>
                <span className="font-medium">Fixed-dose / combination product:</span> confirm if this
                strength or single-pill combination is <em>available at your facility</em> before
                ordering. (If not available, choose an alternative from the options above or use separate
                tablets per local protocol.)
              </span>
            </label>
          )}
          {isProcessed && (
            <div className="text-xs text-green-600 font-medium mt-2">✓ Prescription Created</div>
          )}
        </div>
        <label className="flex items-center space-x-2 text-sm text-gray-700 shrink-0">
          <input
            type="checkbox"
            checked={checked || isProcessed}
            disabled={checked || isProcessed}
            onChange={() => onToggleMed(key)}
          />
          <span>{isProcessed ? 'Created' : 'Select'}</span>
        </label>
      </div>
    </div>
  );
}

const CDSRecommendationsList = ({ recommendations, visit, patient, onRefresh, aiPending = false }) => {
  const [creatingPrescription, setCreatingPrescription] = useState(false);
  const [selectedMeds, setSelectedMeds] = useState({});
  const [selectedTests, setSelectedTests] = useState({});
  const [processedMeds, setProcessedMeds] = useState({});
  const [processedTests, setProcessedTests] = useState({});
  const [fdcAvailable, setFdcAvailable] = useState({});
  const [explanationOpen, setExplanationOpen] = useState({});
  const [showFullExplanation, setShowFullExplanation] = useState({});

  const migrateStoredMap = useCallback((map) => {
    const next = {};
    Object.keys(map || {}).forEach((k) => {
      next[migrateLegacyMedKey(k)] = map[k];
    });
    return next;
  }, []);

  useEffect(() => {
    if (visit?.id) {
      const visitKey = `cds_selections_${visit.id}`;
      const saved = localStorage.getItem(visitKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setSelectedMeds(migrateStoredMap(parsed.selectedMeds || {}));
          setSelectedTests(parsed.selectedTests || {});
          setProcessedMeds(migrateStoredMap(parsed.processedMeds || {}));
          setProcessedTests(parsed.processedTests || {});
          setFdcAvailable(parsed.fdcAvailable || {});
        } catch (e) {
          console.error('Error loading saved CDS selections:', e);
        }
      }
    }
  }, [visit?.id, migrateStoredMap]);

  useEffect(() => {
    if (visit?.id) {
      const visitKey = `cds_selections_${visit.id}`;
      const state = {
        selectedMeds,
        selectedTests,
        processedMeds,
        processedTests,
        fdcAvailable,
      };
      localStorage.setItem(visitKey, JSON.stringify(state));
    }
  }, [visit?.id, selectedMeds, selectedTests, processedMeds, processedTests, fdcAvailable]);

  const uniqueRecommendations = useMemo(() => {
    const seen = new Set();
    return (recommendations || []).filter((rec) => {
      const key = JSON.stringify({
        risk: rec.risk_classification || '',
        notes: rec.notes || '',
        meds: rec.recommended_medications || [],
        tests: rec.recommended_tests || [],
        src: rec.source || '',
      });
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [recommendations]);

  const primaryRec = uniqueRecommendations[0] || null;
  const recId = primaryRec?.id || 'rec';
  const primaryExplanationsPending =
    Array.isArray(primaryRec?.explanations) && primaryRec.explanations.length === 0;

  const clinicalDecisions = useMemo(() => {
    const raw = visit?.clinical_decisions;
    if (!Array.isArray(raw) || raw.length === 0) return [];
    return raw.map(normDecision).filter(Boolean);
  }, [visit?.clinical_decisions]);

  const useGroupedByDiagnosis = clinicalDecisions.length > 0;

  /** Per-decision: meds + tests structure for UI */
  const decisionPanels = useMemo(() => {
    if (!useGroupedByDiagnosis) return [];

    const lineCounter = { value: 0 };
    return clinicalDecisions.map((dec, decIdx) => {
      const medLines = medicationStringsToSelectableLines(dec.medications, recId, decIdx, lineCounter);
      const tests = (dec.tests || []).map((t, i) => ({
        test_name: typeof t === 'string' ? t : t?.test_name || t?.name || '',
        reason: typeof t === 'object' ? t?.reason : null,
        key: `${recId}|d${decIdx}|t${i}`,
        index: i,
      }));

      return {
        dec,
        decIdx,
        medLines,
        tests: tests.filter((t) => t.test_name),
      };
    });
  }, [useGroupedByDiagnosis, clinicalDecisions, recId]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const bpCategory = () => {
    const sys = visit?.physical_examination?.systole ?? visit?.systole;
    const dia = visit?.physical_examination?.diastole ?? visit?.diastole;
    if (!sys || !dia) return null;
    if (sys < 120 && dia < 80) return 'Normal BP';
    if (sys < 130 && dia < 80) return 'Elevated BP';
    if ((sys >= 130 && sys <= 139) || (dia >= 80 && dia <= 89)) return 'Stage 1 Hypertension';
    if (sys >= 140 || dia >= 90) return 'Stage 2 Hypertension';
    return null;
  };

  const diabetesStatus = () => {
    const hasDiabetes = visit?.medical_history?.diabetes;
    if (!hasDiabetes) return null;
    const hba1c = visit?.investigations?.hba1c;
    if (hba1c) {
      if (hba1c >= 10) return `Diabetes (HbA1c ${hba1c}%, very high)`;
      if (hba1c >= 8) return `Diabetes (HbA1c ${hba1c}%, high)`;
      if (hba1c >= 6.5) return `Diabetes (HbA1c ${hba1c}%, above target)`;
      return `Diabetes (HbA1c ${hba1c}%)`;
    }
    return 'Diabetes (history noted)';
  };

  const toggleMed = (key) => {
    const nk = migrateLegacyMedKey(key);
    setSelectedMeds((prev) => {
      const next = { ...prev };
      if (processedMeds[nk] || next[nk]) return next;
      next[nk] = true;
      return next;
    });
  };

  const toggleTest = (key) => {
    setSelectedTests((prev) => {
      const next = { ...prev };
      if (processedTests[key] || next[key]) return next;
      next[key] = true;
      return next;
    });
  };

  const handleFdcChange = (key, checked) => {
    setFdcAvailable((prev) => ({ ...prev, [key]: checked }));
  };

  const handleCreateSelectedPrescriptions = async () => {
    if (!visit) return;
    const selected = [];

    const collectFromLines = (medLines) => {
      medLines.forEach((line) => {
        if (line.kind !== 'selectable') return;
        const nk = migrateLegacyMedKey(line.key);
        if (selectedMeds[nk]) {
          let notes = '';
          if (line.fdcPrompt) {
            notes = fdcAvailable[nk]
              ? 'FDC/combination: confirmed available at facility.'
              : 'FDC/combination: not confirmed available — verify formulary or use separate agents.';
          }
          selected.push({
            medication: line.text,
            notes,
          });
        }
      });
    };

    if (useGroupedByDiagnosis) {
      decisionPanels.forEach((p) => collectFromLines(p.medLines));
    } else {
      uniqueRecommendations.forEach((rec) => {
        const lineCounter = { value: 0 };
        const rid = rec.id || 'rec';
        const names = (rec.recommended_medications || []).map((m) => m?.name).filter(Boolean);
        const lines = medicationStringsToSelectableLines(names, rid, 0, lineCounter);
        collectFromLines(lines);
      });
    }

    if (selected.length === 0) {
      alert('Please select at least one medication to create prescriptions.');
      return;
    }

    setCreatingPrescription(true);
    try {
      for (const item of selected) {
        const prescriptionData = {
          visit_id: visit.id,
          medication: item.medication,
          dose: '',
          frequency: '',
          notes: item.notes || '',
          source: 'AI_CDS',
          reason: item.notes || `Recommended by CDS`,
          status: 'DRAFT',
        };

        const response = await fetch(`${API_BASE_URL}/prescriptions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(prescriptionData),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: response.statusText }));
          throw new Error(errorData.detail || response.statusText);
        }
      }

      alert(`Created ${selected.length} prescription(s) successfully.`);
      setProcessedMeds((prev) => ({ ...prev, ...selectedMeds }));
      setSelectedMeds({});
      onRefresh?.();
    } catch (error) {
      console.error('Error creating prescriptions:', error);
      alert(`Failed to create prescriptions: ${error.message}`);
    } finally {
      setCreatingPrescription(false);
    }
  };

  const handleCreateSelectedTests = async () => {
    if (!visit) return;
    const selected = [];
    const urgentKeys = new Set();

    const collectTests = (tests) => {
      tests.forEach((test) => {
        const isUrgent = (test.test_name || '').toLowerCase().includes('urgent');
        if (isUrgent) urgentKeys.add(test.key);
        if (selectedTests[test.key]) {
          selected.push({ test, key: test.key });
        }
      });
    };

    if (useGroupedByDiagnosis) {
      decisionPanels.forEach((p) => collectTests(p.tests));
    } else {
      uniqueRecommendations.forEach((rec) => {
        const rid = rec.id || 'rec';
        const tests = (rec.recommended_tests || []).map((test, i) => ({
          test_name: test.test_name || '',
          reason: test.reason,
          key: `${rid}|d0|t${i}`,
        }));
        collectTests(tests);
      });
    }

    if (selected.length === 0) {
      alert('Please select at least one test.');
      return;
    }

    if (urgentKeys.size > 0) {
      const selectedUrgentCount = selected.filter((item) => urgentKeys.has(item.key)).length;
      if (selectedUrgentCount !== urgentKeys.size) {
        alert('All urgent tests (highlighted in red) must be selected before saving.');
        return;
      }
    }

    setCreatingPrescription(true);
    try {
      const payload = {
        tests: selected.map(({ test }) => ({
          visit_id: visit.id,
          type: test.test_name || 'Unknown Test',
          value: null,
          unit: null,
          status: 'PENDING',
          observed_at: null,
          reference_range: null,
          code: null,
          notes: test.reason || '',
          investigation_data: null,
          recommendation_id: null,
        })),
      };

      const response = await fetch(`${API_BASE_URL}/test-results/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(errorData.detail || response.statusText);
      }

      alert(`Saved ${selected.length} test(s) successfully.`);
      setProcessedTests((prev) => ({ ...prev, ...selectedTests }));
      setSelectedTests({});
      onRefresh?.();
    } catch (error) {
      console.error('Error saving tests:', error);
      alert(`Failed to save tests: ${error.message}`);
    } finally {
      setCreatingPrescription(false);
    }
  };

  const renderExplanationBlock = (expl, exIdx, recommendation) => {
    if (!expl) return null;
    const recKey = recommendation?.id || 'rec';
    const sectionKey = `${recKey}-${exIdx}`;
    const isOpen = explanationOpen[sectionKey];
    const showFullClinician = showFullExplanation[`${sectionKey}-clinician`];
    const showFullPatient = showFullExplanation[`${sectionKey}-patient`];
    const clinicianText = showFullClinician
      ? expl.clinician_explanation || expl.clinician_summary || ''
      : expl.clinician_summary || expl.clinician_explanation || '';
    const patientText = showFullPatient
      ? expl.patient_explanation || expl.patient_summary || ''
      : expl.patient_summary || expl.patient_explanation || '';
    const hasFullClinician = !!(
      expl.clinician_explanation &&
      expl.clinician_explanation !== (expl.clinician_summary || '')
    );
    const hasFullPatient = !!(
      expl.patient_explanation &&
      expl.patient_explanation !== (expl.patient_summary || '')
    );

    return (
      <div key={sectionKey} className="mb-4 last:mb-0">
        <button
          type="button"
          onClick={() => setExplanationOpen((prev) => ({ ...prev, [sectionKey]: !prev[sectionKey] }))}
          className="flex items-center justify-between w-full text-left py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
        >
          <span className="text-sm font-semibold text-gray-900">AI Explanation</span>
          <span className="text-gray-500 text-sm">{isOpen ? '▼' : '▶'}</span>
        </button>
        {isOpen && (
          <div className="mt-2 pl-2 border-l-2 border-slate-200 space-y-4">
            {(expl.clinician_summary || expl.clinician_explanation) && (
              <div>
                <h5 className="text-sm font-semibold text-gray-800 mb-1">For clinician</h5>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{clinicianText}</p>
                {hasFullClinician && (
                  <button
                    type="button"
                    onClick={() =>
                      setShowFullExplanation((prev) => ({
                        ...prev,
                        [`${sectionKey}-clinician`]: !prev[`${sectionKey}-clinician`],
                      }))
                    }
                    className="mt-1 text-xs text-blue-600 hover:text-blue-800"
                  >
                    {showFullClinician ? 'Show summary' : 'Show full explanation'}
                  </button>
                )}
              </div>
            )}
            {(expl.patient_summary || expl.patient_explanation) && (
              <div>
                <h5 className="text-sm font-semibold text-gray-800 mb-1">For patient</h5>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{patientText}</p>
                {hasFullPatient && (
                  <button
                    type="button"
                    onClick={() =>
                      setShowFullExplanation((prev) => ({
                        ...prev,
                        [`${sectionKey}-patient`]: !prev[`${sectionKey}-patient`],
                      }))
                    }
                    className="mt-1 text-xs text-blue-600 hover:text-blue-800"
                  >
                    {showFullPatient ? 'Show summary' : 'Show full explanation'}
                  </button>
                )}
              </div>
            )}
            {expl.sources && expl.sources.length > 0 && (
              <p className="text-xs text-gray-500">Sources: {expl.sources.join('; ')}</p>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderDecisionCard = (panel, recommendation) => {
    const { dec, decIdx, medLines, tests } = panel;
    const expl = recommendation?.explanations?.[decIdx];

    return (
      <div
        key={`dec-${decIdx}`}
        className="border-2 border-blue-100 rounded-xl p-5 bg-gradient-to-b from-white to-slate-50/80 shadow-sm"
      >
        <div className="flex flex-wrap items-baseline gap-2 mb-2">
          <h3 className="text-lg font-bold text-gray-900">{dec.diagnosis || 'Clinical decision'}</h3>
          {dec.stage && (
            <span className="text-sm font-medium text-blue-800 bg-blue-100 px-2 py-0.5 rounded-md">
              {dec.stage}
            </span>
          )}
          {dec.sub_classification && (
            <span className="text-sm font-medium text-purple-800 bg-purple-100 px-2 py-0.5 rounded-md">
              {dec.sub_classification}
            </span>
          )}
          {dec.confidence_level && (
            <span className="text-xs text-gray-500">Confidence: {dec.confidence_level}</span>
          )}
        </div>
        {dec.needs_referral && (
          <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-900">
            <span className="font-semibold">Referral suggested</span>
            {dec.referral_reason && <span>: {dec.referral_reason}</span>}
          </div>
        )}

        {dec.patient_advice && (
          <div className="mb-4 p-3 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-800">
            <span className="font-semibold text-gray-900">Advice: </span>
            {dec.patient_advice}
          </div>
        )}

        {medLines.some((l) => l.kind === 'selectable') && (
          <div className="mb-4">
            <h4 className="text-md font-semibold text-gray-900 mb-2">Medications</h4>
            <p className="text-xs text-gray-600 mb-3">
              Lines split by <strong>OR</strong> are separate options; choose the regimen you will use.
              Class names (e.g. ACE inhibitor) show examples below — select a specific drug per your
              formulary.
            </p>
            <div className="space-y-3">
              {medLines.map((line, idx) => {
                if (line.kind === 'note') {
                  return (
                    <div
                      key={`note-${decIdx}-${idx}`}
                      className="text-sm text-gray-700 bg-gray-100/80 border border-dashed border-gray-300 rounded-lg px-3 py-2"
                    >
                      {line.text}
                    </div>
                  );
                }
                const nk = migrateLegacyMedKey(line.key);
                const checked = !!selectedMeds[nk];
                const isProcessed = !!processedMeds[nk];
                return (
                  <SelectableMedicationRow
                    key={line.key}
                    line={line}
                    checked={checked}
                    isProcessed={isProcessed}
                    fdcAvailable={fdcAvailable}
                    onToggleMed={toggleMed}
                    onFdcChange={handleFdcChange}
                  />
                );
              })}
            </div>
          </div>
        )}

        {tests.length > 0 && (
          <div className="mb-4">
            <h4 className="text-md font-semibold text-gray-900 mb-2">Tests for this decision</h4>
            <div className="space-y-2">
              {tests.map((test) => {
                const checked = !!selectedTests[test.key];
                const isProcessed = !!processedTests[test.key];
                const isUrgent = (test.test_name || '').toLowerCase().includes('urgent');
                return (
                  <div
                    key={test.key}
                    className={`border border-gray-200 rounded-lg p-3 ${
                      isProcessed ? 'bg-green-50' : isUrgent ? 'bg-red-50' : 'bg-blue-50'
                    }`}
                  >
                    <div className="font-medium text-gray-900 mb-1">{test.test_name}</div>
                    {test.reason && <div className="text-sm text-gray-600 italic">{test.reason}</div>}
                    {isProcessed && (
                      <div className="text-xs text-green-600 font-medium mt-1">✓ Test Ordered</div>
                    )}
                    <label className="mt-2 inline-flex items-center space-x-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={checked || isProcessed}
                        disabled={checked || isProcessed}
                        onChange={() => toggleTest(test.key)}
                      />
                      <span>{isProcessed ? 'Ordered' : 'Select'}</span>
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {expl && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            {renderExplanationBlock(expl, decIdx, recommendation)}
          </div>
        )}
        {!expl && primaryExplanationsPending && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-3 text-sm text-blue-700">
              <span className="inline-block h-4 w-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
              <span>AI explanation for this decision is being prepared...</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderLegacyRecommendationCard = (recommendation) => {
    const rid = recommendation.id || 'rec';
    const lineCounter = { value: 0 };
    const names = (recommendation.recommended_medications || []).map((m) => m?.name).filter(Boolean);
    const cardMedLines = medicationStringsToSelectableLines(names, rid, 0, lineCounter);
    const cardTests = (recommendation.recommended_tests || []).map((test, i) => ({
      test_name: test.test_name || '',
      reason: test.reason,
      key: `${rid}|d0|t${i}`,
      index: i,
    }));

    return (
    <div
      key={recommendation.id}
      className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Recommendation #{recommendation.id?.substring(0, 8)}...
          </h3>
          <p className="text-sm text-gray-500">
            Created: {formatDate(recommendation.created_at)} | Source: {recommendation.source || 'Drools'}
          </p>
          <p className="text-xs text-amber-700 mt-2 bg-amber-50 border border-amber-100 rounded px-2 py-1 inline-block">
            Visit has no stored clinical decisions — showing flat list. Re-run &quot;Get Recommendations&quot;
            from the visit form to refresh structured data.
          </p>
        </div>
      </div>

      {recommendation.risk_classification && (
        <div className="mb-4">
          <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-yellow-100 text-yellow-800">
            Risk: {recommendation.risk_classification}
          </span>
        </div>
      )}

      {cardMedLines.some((l) => l.kind === 'selectable') && (
        <div className="mb-4">
          <h4 className="text-md font-semibold text-gray-900 mb-2">Recommended Medications</h4>
          <div className="space-y-3">
            {cardMedLines.map((line, idx) => {
              if (line.kind === 'note') {
                return (
                  <div
                    key={`ln-${idx}`}
                    className="text-sm text-gray-700 bg-gray-100/80 border border-dashed border-gray-300 rounded-lg px-3 py-2"
                  >
                    {line.text}
                  </div>
                );
              }
              const nk = migrateLegacyMedKey(line.key);
              return (
                <SelectableMedicationRow
                  key={line.key}
                  line={line}
                  checked={!!selectedMeds[nk]}
                  isProcessed={!!processedMeds[nk]}
                  fdcAvailable={fdcAvailable}
                  onToggleMed={toggleMed}
                  onFdcChange={handleFdcChange}
                />
              );
            })}
          </div>
        </div>
      )}

      {cardTests.length > 0 && (
        <div className="mb-4">
          <h4 className="text-md font-semibold text-gray-900 mb-3">Recommended Tests</h4>
          <div className="space-y-2">
            {cardTests.map((test) => {
              const checked = !!selectedTests[test.key];
              const isProcessed = !!processedTests[test.key];
              const isUrgent = (test.test_name || '').toLowerCase().includes('urgent');
              return (
                <div
                  key={test.key}
                  className={`border border-gray-200 rounded-lg p-3 ${
                    isProcessed ? 'bg-green-50' : isUrgent ? 'bg-red-50' : 'bg-blue-50'
                  }`}
                >
                  <div className="font-medium text-gray-900 mb-1">{test.test_name}</div>
                  {test.reason && <div className="text-sm text-gray-600 italic">{test.reason}</div>}
                  {isProcessed && (
                    <div className="text-xs text-green-600 font-medium mt-1">✓ Test Ordered</div>
                  )}
                  <label className="mt-2 inline-flex items-center space-x-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={checked || isProcessed}
                      disabled={checked || isProcessed}
                      onChange={() => toggleTest(test.key)}
                    />
                    <span>{isProcessed ? 'Ordered' : 'Select'}</span>
                  </label>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {recommendation.notes && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h5 className="text-sm font-medium text-gray-900 mb-1">Notes:</h5>
          <p className="text-sm text-gray-600">{recommendation.notes}</p>
        </div>
      )}

      {recommendation.explanations?.filter(Boolean).length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          {recommendation.explanations.filter(Boolean).map((expl, exIdx) =>
            renderExplanationBlock(expl, exIdx, recommendation)
          )}
        </div>
      )}
      {Array.isArray(recommendation.explanations) && recommendation.explanations.length === 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-3 text-sm text-blue-700">
            <span className="inline-block h-4 w-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
            <span>AI explanations are being prepared...</span>
          </div>
        </div>
      )}
    </div>
    );
  };

  const legacyHasRows = useMemo(() => {
    if (useGroupedByDiagnosis) return true;
    return uniqueRecommendations.some((rec) => {
      const meds = rec.recommended_medications?.length > 0;
      const tests = rec.recommended_tests?.length > 0;
      return meds || tests;
    });
  }, [useGroupedByDiagnosis, uniqueRecommendations]);

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">CDS Recommendations</h2>
          <p className="text-sm text-gray-600">
            Visit ID: {visit.id?.substring(0, 8)}... | {patient?.full_name || 'Unknown Patient'} |{' '}
            {formatDate(visit.visit_date)}
          </p>
          {patient && (
            <div className="text-xs text-gray-500 mt-1">
              Patient: {patient.full_name} | Gender: {patient.gender || 'N/A'} | Phone:{' '}
              {patient.phone || 'N/A'}
            </div>
          )}
          <div className="flex flex-wrap gap-2 mt-2">
            {bpCategory() && (
              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                {bpCategory()}
              </span>
            )}
            {diabetesStatus() && (
              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                {diabetesStatus()}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onRefresh}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={handleCreateSelectedPrescriptions}
            disabled={creatingPrescription}
            className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {creatingPrescription ? 'Creating...' : 'Create Prescription(s)'}
          </button>
          <button
            type="button"
            onClick={handleCreateSelectedTests}
            disabled={creatingPrescription}
            className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {creatingPrescription ? 'Working...' : 'Save Selected Tests'}
          </button>
        </div>
      </div>

      <div className="p-6">
        {!uniqueRecommendations.length ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🤖</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No CDS Recommendations</h3>
            <p className="text-gray-500 mb-4">
              No recommendations found for this visit. Generate recommendations from the visit form.
            </p>
            {visit.consultation?.chief_complaint && (
              <div className="text-sm text-gray-400">
                Chief Complaint: {visit.consultation.chief_complaint}
              </div>
            )}
          </div>
        ) : useGroupedByDiagnosis ? (
          <div className="space-y-6">
            {primaryRec && (
              <div className="text-sm text-gray-600 border-b border-gray-100 pb-4">
                <span className="font-medium text-gray-800">Record:</span> #
                {primaryRec.id?.substring(0, 8)}… · Created {formatDate(primaryRec.created_at)} · Source:{' '}
                {primaryRec.source || 'drools'}
                {primaryRec.risk_classification && (
                  <span className="ml-2 inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                    Risk: {primaryRec.risk_classification}
                  </span>
                )}
              </div>
            )}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900">
              <strong>Grouped by diagnosis:</strong> each card below is one clinical decision from the
              engine (e.g. hypertension vs diabetes). Medications split on <strong>OR</strong> are alternative
              choices — select the line you will prescribe.
            </div>
            {aiPending && (
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-sm text-indigo-900 flex items-center gap-3">
                <span className="inline-block h-4 w-4 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
                <span>
                  AI explanations are being generated in the background. You can continue other tasks while they load.
                </span>
              </div>
            )}
            {decisionPanels.map((panel) => renderDecisionCard(panel, primaryRec))}
            {primaryRec?.notes && (
              <div className="pt-4 border-t border-gray-200">
                <h5 className="text-sm font-medium text-gray-900 mb-1">Engine notes</h5>
                <p className="text-sm text-gray-600">{primaryRec.notes}</p>
              </div>
            )}
          </div>
        ) : legacyHasRows ? (
          <div className="space-y-6">{uniqueRecommendations.map(renderLegacyRecommendationCard)}</div>
        ) : (
          <div className="text-center py-8 text-gray-600">
            Recommendations exist but medication/test lists are empty. Check engine output or re-run
            evaluation.
          </div>
        )}
      </div>
    </div>
  );
};

export default CDSRecommendationsList;
