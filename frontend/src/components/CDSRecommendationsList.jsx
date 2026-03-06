import React, { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const CDSRecommendationsList = ({ recommendations, visit, patient, onRefresh }) => {
  const [creatingPrescription, setCreatingPrescription] = useState(false);
  const [selectedMeds, setSelectedMeds] = useState({});
  const [selectedTests, setSelectedTests] = useState({});
  const [processedMeds, setProcessedMeds] = useState({});
  const [processedTests, setProcessedTests] = useState({});
  // Collapsible AI explanation: key = `${recId}-${explanationIndex}`, value = true when expanded
  const [explanationOpen, setExplanationOpen] = useState({});
  // Per-explanation, show full text (false = summary): key = `${recId}-${exIdx}-clinician|patient`
  const [showFullExplanation, setShowFullExplanation] = useState({});

  // Load persisted state on component mount
  useEffect(() => {
    if (visit?.id) {
      const visitKey = `cds_selections_${visit.id}`;
      const saved = localStorage.getItem(visitKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setSelectedMeds(parsed.selectedMeds || {});
          setSelectedTests(parsed.selectedTests || {});
          setProcessedMeds(parsed.processedMeds || {});
          setProcessedTests(parsed.processedTests || {});
        } catch (e) {
          console.error('Error loading saved CDS selections:', e);
        }
      }

    }
  }, [visit?.id]);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (visit?.id) {
      const visitKey = `cds_selections_${visit.id}`;
      const state = {
        selectedMeds,
        selectedTests,
        processedMeds,
        processedTests
      };
      localStorage.setItem(visitKey, JSON.stringify(state));
    }
  }, [visit?.id, selectedMeds, selectedTests, processedMeds, processedTests]);

  // Deduplicate recommendations (backend may return repeated entries)
  const uniqueRecommendations = React.useMemo(() => {
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
    // Optional intensity: use HbA1c if present
    const hba1c = visit?.investigations?.hba1c;
    if (hba1c) {
      if (hba1c >= 10) return `Diabetes (HbA1c ${hba1c}%, very high)`;
      if (hba1c >= 8) return `Diabetes (HbA1c ${hba1c}%, high)`;
      if (hba1c >= 6.5) return `Diabetes (HbA1c ${hba1c}%, above target)`;
      return `Diabetes (HbA1c ${hba1c}%)`;
    }
    return 'Diabetes (history noted)';
  };

  const toggleMed = (recId, medIdx) => {
    setSelectedMeds((prev) => {
      const key = `${recId}:${medIdx}`;
      const next = { ...prev };
      // Once chosen or processed, keep it locked
      if (processedMeds[key] || next[key]) return next;

      next[key] = true;
      return next;
    });
  };

  const toggleTest = (recId, testIdx) => {
    setSelectedTests((prev) => {
      const key = `${recId}:${testIdx}`;
      const next = { ...prev };
      // Once chosen or processed, keep it locked
      if (processedTests[key] || next[key]) return next;

      next[key] = true;
      return next;
    });
  };

  const handleCreateSelectedPrescriptions = async () => {
    if (!visit) return;
    const selected = [];
    uniqueRecommendations.forEach((rec) => {
      (rec.recommended_medications || []).forEach((med, idx) => {
        const key = `${rec.id || 'rec'}:${idx}`;
        if (selectedMeds[key]) {
          selected.push({ rec, med, idx });
        }
      });
    });

    if (selected.length === 0) {
      alert('Please select at least one medication to create prescriptions.');
      return;
    }

    setCreatingPrescription(true);
    try {
      for (const item of selected) {
        const { med } = item;
        const prescriptionData = {
          visit_id: visit.id,
          medication: med.name,
          dose: med.dosage || '',
          frequency: med.frequency || '',
          notes: med.reason || '',
          source: 'AI_CDS',
          reason: med.reason || `Recommended by CDS`,
          status: 'DRAFT'
        };

        const response = await fetch(`${API_BASE_URL}/prescriptions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(prescriptionData),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: response.statusText }));
          throw new Error(errorData.detail || response.statusText);
        }
      }

      alert(`Created ${selected.length} prescription(s) successfully.`);
      // Mark selected meds as processed instead of resetting
      setProcessedMeds((prev) => ({ ...prev, ...selectedMeds }));
      setSelectedMeds({});
      onRefresh();
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

    uniqueRecommendations.forEach((rec) => {
      (rec.recommended_tests || []).forEach((test, idx) => {
        const key = `${rec.id || 'rec'}:${idx}`;
        // Detect urgent tests by name, e.g. "ECG - urgent"
        const isUrgent = (test.test_name || '').toLowerCase().includes('urgent');
        if (isUrgent) {
          urgentKeys.add(key);
        }
        if (selectedTests[key]) {
          selected.push({ rec, test, idx, key });
        }
      });
    });

    if (selected.length === 0) {
      alert('Please select at least one test.');
      return;
    }

    // Enforce: all urgent tests must be selected before saving
    if (urgentKeys.size > 0) {
      const selectedUrgentCount = selected.filter(item => urgentKeys.has(item.key)).length;
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
      // Mark selected tests as processed instead of resetting
      setProcessedTests((prev) => ({ ...prev, ...selectedTests }));
      setSelectedTests({});
      onRefresh();
    } catch (error) {
      console.error('Error saving tests:', error);
      alert(`Failed to save tests: ${error.message}`);
    } finally {
      setCreatingPrescription(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            CDS Recommendations
          </h2>
          <p className="text-sm text-gray-600">
            Visit ID: {visit.id?.substring(0, 8)}... | {patient?.full_name || 'Unknown Patient'} | {formatDate(visit.visit_date)}
          </p>
          {patient && (
            <div className="text-xs text-gray-500 mt-1">
              Patient: {patient.full_name} | Gender: {patient.gender || 'N/A'} | Phone: {patient.phone || 'N/A'}
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
            onClick={onRefresh}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Refresh
          </button>
          <button
            onClick={handleCreateSelectedPrescriptions}
            disabled={creatingPrescription}
            className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {creatingPrescription ? 'Creating...' : 'Create Prescription(s)'}
          </button>
          <button
            onClick={handleCreateSelectedTests}
            disabled={creatingPrescription}
            className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {creatingPrescription ? 'Working...' : 'Save Selected Tests'}
          </button>
        </div>
      </div>

      <div className="p-6">
        {uniqueRecommendations.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🤖</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No CDS Recommendations
            </h3>
            <p className="text-gray-500 mb-4">
              No recommendations found for this visit. Generate recommendations from the visit form.
            </p>
            {visit.consultation?.chief_complaint && (
              <div className="text-sm text-gray-400">
                Chief Complaint: {visit.consultation.chief_complaint}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {uniqueRecommendations.map((recommendation) => (
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
                  </div>
                </div>

                {/* Risk Classification */}
                {recommendation.risk_classification && (
                  <div className="mb-4">
                    <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      Risk: {recommendation.risk_classification}
                    </span>
                  </div>
                )}

                {/* Recommended Medications */}
                {recommendation.recommended_medications && recommendation.recommended_medications.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-md font-semibold text-gray-900 mb-3">Recommended Medications</h4>
                    <div className="space-y-3">
                      {recommendation.recommended_medications.map((med, index) => {
                        const key = `${recommendation.id || 'rec'}:${index}`;
                        const checked = !!selectedMeds[key];
                        const isProcessed = !!processedMeds[key];
                        return (
                        <div
                          key={index}
                          className={`border border-gray-200 rounded-lg p-4 ${isProcessed ? 'bg-green-50' : 'bg-gray-50'}`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 mb-1">
                                {med.name}
                              </div>
                              {med.dosage && (
                                <div className="text-sm text-gray-600 mb-1">
                                  <span className="font-medium">Dosage:</span> {med.dosage}
                                </div>
                              )}
                              {med.frequency && (
                                <div className="text-sm text-gray-600 mb-1">
                                  <span className="font-medium">Frequency:</span> {med.frequency}
                                </div>
                              )}
                              {med.reason && (
                                <div className="text-sm text-gray-600 mt-2 italic">
                                  <span className="font-medium">Reason:</span> {med.reason}
                                </div>
                              )}
                              {isProcessed && (
                                <div className="text-xs text-green-600 font-medium mt-2">
                                  ✓ Prescription Created
                                </div>
                              )}
                            </div>
                            <label className="ml-4 flex items-center space-x-2 text-sm text-gray-700">
                              <input
                                type="checkbox"
                                checked={checked || isProcessed}
                                disabled={checked || isProcessed}
                                onChange={() => toggleMed(recommendation.id || 'rec', index)}
                              />
                              <span>{isProcessed ? 'Created' : 'Select'}</span>
                            </label>
                          </div>
                        </div>
                      )})}
                    </div>
                  </div>
                )}

                {/* Recommended Tests */}
                {recommendation.recommended_tests && recommendation.recommended_tests.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-md font-semibold text-gray-900 mb-3">Recommended Tests</h4>
                    <div className="space-y-2">
                      {recommendation.recommended_tests.map((test, index) => {
                        const key = `${recommendation.id || 'rec'}:${index}`;
                        const checked = !!selectedTests[key];
                        const isProcessed = !!processedTests[key];
                        const isUrgent = (test.test_name || '').toLowerCase().includes('urgent');
                        return (
                        <div
                          key={index}
                          className={`border border-gray-200 rounded-lg p-3 ${isProcessed ? 'bg-green-50' : isUrgent ? 'bg-red-50' : 'bg-blue-50'}`}
                        >
                          <div className="font-medium text-gray-900 mb-1">
                            {test.test_name}
                          </div>
                          {test.reason && (
                            <div className="text-sm text-gray-600 italic">
                              {test.reason}
                            </div>
                          )}
                          {isProcessed && (
                            <div className="text-xs text-green-600 font-medium mt-1">
                              ✓ Test Ordered
                            </div>
                          )}
                          <label className="mt-2 inline-flex items-center space-x-2 text-sm text-gray-700">
                            <input
                              type="checkbox"
                              checked={checked || isProcessed}
                              disabled={checked || isProcessed}
                              onChange={() => toggleTest(recommendation.id || 'rec', index)}
                            />
                            <span>{isProcessed ? 'Ordered' : 'Select'}</span>
                          </label>
                        </div>
                      )})}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {recommendation.notes && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h5 className="text-sm font-medium text-gray-900 mb-1">
                      Notes:
                    </h5>
                    <p className="text-sm text-gray-600">
                      {recommendation.notes}
                    </p>
                  </div>
                )}

                {/* AI Explanation (collapsible): summary by default, option to show full */}
                {recommendation.explanations && recommendation.explanations.filter(Boolean).length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    {(recommendation.explanations.filter(Boolean)).map((expl, exIdx) => {
                      const recKey = recommendation.id || 'rec';
                      const sectionKey = `${recKey}-${exIdx}`;
                      const isOpen = explanationOpen[sectionKey];
                      const showFullClinician = showFullExplanation[`${sectionKey}-clinician`];
                      const showFullPatient = showFullExplanation[`${sectionKey}-patient`];
                      const clinicianText = showFullClinician
                        ? (expl.clinician_explanation || expl.clinician_summary || '')
                        : (expl.clinician_summary || expl.clinician_explanation || '');
                      const patientText = showFullPatient
                        ? (expl.patient_explanation || expl.patient_summary || '')
                        : (expl.patient_summary || expl.patient_explanation || '');
                      const hasFullClinician = !!(expl.clinician_explanation && expl.clinician_explanation !== (expl.clinician_summary || ''));
                      const hasFullPatient = !!(expl.patient_explanation && expl.patient_explanation !== (expl.patient_summary || ''));

                      return (
                        <div key={sectionKey} className="mb-4 last:mb-0">
                          <button
                            type="button"
                            onClick={() => setExplanationOpen((prev) => ({ ...prev, [sectionKey]: !prev[sectionKey] }))}
                            className="flex items-center justify-between w-full text-left py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
                          >
                            <span className="text-sm font-semibold text-gray-900">
                              {recommendation.explanations.filter(Boolean).length > 1
                                ? `AI Explanation (decision ${exIdx + 1})`
                                : 'AI Explanation'}
                            </span>
                            <span className="text-gray-500 text-sm">{isOpen ? '▼' : '▶'}</span>
                          </button>
                          {isOpen && (
                            <div className="mt-2 pl-2 border-l-2 border-slate-200 space-y-4">
                              {/* Clinician */}
                              {(expl.clinician_summary || expl.clinician_explanation) && (
                                <div>
                                  <h5 className="text-sm font-semibold text-gray-800 mb-1">For clinician</h5>
                                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{clinicianText}</p>
                                  {hasFullClinician && (
                                    <button
                                      type="button"
                                      onClick={() => setShowFullExplanation((prev) => ({ ...prev, [`${sectionKey}-clinician`]: !prev[`${sectionKey}-clinician`] }))}
                                      className="mt-1 text-xs text-blue-600 hover:text-blue-800"
                                    >
                                      {showFullClinician ? 'Show summary' : 'Show full explanation'}
                                    </button>
                                  )}
                                </div>
                              )}
                              {/* Patient */}
                              {(expl.patient_summary || expl.patient_explanation) && (
                                <div>
                                  <h5 className="text-sm font-semibold text-gray-800 mb-1">For patient</h5>
                                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{patientText}</p>
                                  {hasFullPatient && (
                                    <button
                                      type="button"
                                      onClick={() => setShowFullExplanation((prev) => ({ ...prev, [`${sectionKey}-patient`]: !prev[`${sectionKey}-patient`] }))}
                                      className="mt-1 text-xs text-blue-600 hover:text-blue-800"
                                    >
                                      {showFullPatient ? 'Show summary' : 'Show full explanation'}
                                    </button>
                                  )}
                                </div>
                              )}
                              {expl.sources && expl.sources.length > 0 && (
                                <p className="text-xs text-gray-500">
                                  Sources: {expl.sources.join('; ')}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CDSRecommendationsList;
