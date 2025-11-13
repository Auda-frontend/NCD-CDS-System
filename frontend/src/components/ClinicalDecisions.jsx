import React, { useState, useEffect } from 'react';

const ClinicalDecisions = ({ decisions, patientData, loading }) => {
  // State to track selected medications and tests for each decision
  const [selectedItems, setSelectedItems] = useState({});

  // Debug logging
  useEffect(() => {
    console.log('ClinicalDecisions - decisions prop:', decisions);
    console.log('ClinicalDecisions - decisions type:', typeof decisions);
    console.log('ClinicalDecisions - decisions length:', decisions?.length);
    console.log('ClinicalDecisions - loading:', loading);
  }, [decisions, loading]);

  // Initialize selections when decisions change
  useEffect(() => {
    if (decisions && decisions.length > 0) {
      console.log('Initializing selections for', decisions.length, 'decisions');
      const initialSelections = {};
      decisions.forEach((decision, decisionIndex) => {
        initialSelections[decisionIndex] = {
          medications: {},
          tests: {}
        };
      });
      setSelectedItems(initialSelections);
    }
  }, [decisions]);

  // Handle checkbox change for medications or tests
  const handleItemToggle = (decisionIndex, type, itemIndex, checked) => {
    setSelectedItems(prev => ({
      ...prev,
      [decisionIndex]: {
        ...prev[decisionIndex],
        [type]: {
          ...prev[decisionIndex]?.[type],
          [itemIndex]: checked
        }
      }
    }));
  };

  // Check if any items are selected in a category
  const hasSelectedItems = (decisionIndex, type) => {
    const items = selectedItems[decisionIndex]?.[type] || {};
    return Object.values(items).some(selected => selected === true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600 mb-4"></div>
        <p className="text-gray-600">Analyzing patient data...</p>
        <p className="text-sm text-gray-500 mt-2">Applying Clinical Guidelines</p>
      </div>
    );
  }

  // Handle case where decisions might be undefined, null, or empty
  const hasDecisions = decisions && Array.isArray(decisions) && decisions.length > 0;
  
  if (!hasDecisions && !loading) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Clinical Decisions</h3>
        <p className="text-gray-600 max-w-md mx-auto">
          Enter patient data and click "Get Clinical Recommendations" to see clinical staging and treatment guidance based on guidelines.
        </p>
        {decisions && !Array.isArray(decisions) && (
          <p className="text-red-600 text-sm mt-4">
            Warning: Decisions data is not in expected format. Check console for details.
          </p>
        )}
      </div>
    );
  }

  const DecisionCard = ({ decision, index }) => {
    const hasSelectedMeds = hasSelectedItems(index, 'medications');
    const hasSelectedTests = hasSelectedItems(index, 'tests');

    return (
    <div className={`border rounded-xl p-6 mb-4 transition-all duration-200 ${
      decision.needs_referral 
        ? 'border-red-300 bg-red-50/50 border-l-4 border-l-red-500' 
        : 'border-gray-200 bg-white'
    }`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <h4 className="text-xl font-bold text-gray-900">{decision.diagnosis}</h4>
          {decision.stage && (
            <span className="px-3 py-1 bg-primary-100 text-primary-800 text-sm font-medium rounded-full">
              {decision.stage}
            </span>
          )}
          {decision.sub_classification && (
            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
              {decision.sub_classification}
            </span>
          )}
        </div>
        
        {decision.needs_referral && (
          <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-bold rounded-full flex items-center gap-1">
            REFERRAL NEEDED
          </span>
        )}
      </div>

      {/* Confidence Level */}
      {decision.confidence_level && (
        <div className="mb-4">
          <span className="text-sm text-gray-600">Confidence: </span>
          <span className={`text-sm font-semibold ${
            decision.confidence_level === 'HIGH' ? 'text-green-600' : 
            decision.confidence_level === 'MEDIUM' ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {decision.confidence_level}
          </span>
        </div>
      )}

      {/* Medications */}
      {decision.medications && decision.medications.length > 0 && (
        <div className="mb-4">
          <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span className="text-lg">💊</span> Recommended Medications
            <span className="text-xs font-normal text-gray-500 ml-2">
              (Select medications to prescribe)
            </span>
          </h5>
          <div className="space-y-2">
            {decision.medications.map((med, idx) => {
              const isChecked = selectedItems[index]?.medications?.[idx] === true;
              const isUnselected = hasSelectedMeds && !isChecked;
              
              return (
                <label
                  key={idx}
                  className={`flex items-start gap-3 p-2 rounded-lg border transition-all cursor-pointer ${
                    isChecked
                      ? 'bg-primary-50 border-primary-300 shadow-sm'
                      : isUnselected
                      ? 'bg-gray-50 border-gray-200 opacity-50'
                      : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked || false}
                    onChange={(e) => handleItemToggle(index, 'medications', idx, e.target.checked)}
                    className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className={`text-sm flex-1 ${
                    isChecked
                      ? 'text-gray-900 font-medium'
                      : isUnselected
                      ? 'text-gray-400'
                      : 'text-gray-700'
                  }`}>
                    {med}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Tests */}
      {decision.tests && decision.tests.length > 0 && (
        <div className="mb-4">
          <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span className="text-lg">🔬</span> Recommended Tests
            <span className="text-xs font-normal text-gray-500 ml-2">
              (Select tests to order)
            </span>
          </h5>
          <div className="space-y-2">
            {decision.tests.map((test, idx) => {
              const isChecked = selectedItems[index]?.tests?.[idx] === true;
              const isUnselected = hasSelectedTests && !isChecked;
              
              return (
                <label
                  key={idx}
                  className={`flex items-start gap-3 p-2 rounded-lg border transition-all cursor-pointer ${
                    isChecked
                      ? 'bg-blue-50 border-blue-300 shadow-sm'
                      : isUnselected
                      ? 'bg-gray-50 border-gray-200 opacity-50'
                      : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked || false}
                    onChange={(e) => handleItemToggle(index, 'tests', idx, e.target.checked)}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className={`text-sm flex-1 ${
                    isChecked
                      ? 'text-gray-900 font-medium'
                      : isUnselected
                      ? 'text-gray-400'
                      : 'text-gray-700'
                  }`}>
                    {test}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Patient Advice */}
      {decision.patient_advice && (
        <div className="mb-4">
          <h5 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <span className="text-lg">💡</span> Patient Advice
          </h5>
          <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded-lg">
            {decision.patient_advice}
          </p>
        </div>
      )}

      {/* Referral Reason */}
      {decision.referral_reason && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <h5 className="font-semibold text-red-900 mb-1 flex items-center gap-2">
            <span className="text-lg">🚨</span> Referral Reason
          </h5>
          <p className="text-sm text-red-700">{decision.referral_reason}</p>
        </div>
      )}
    </div>
    );
  };

  // Helper function to get relevant patient data for display
  const getPatientSummary = () => {
    if (!patientData) return null;

    const summary = [];
    
    // Blood Pressure
    if (patientData.physical_examination?.systole && patientData.physical_examination?.diastole) {
      summary.push(`BP: ${patientData.physical_examination.systole}/${patientData.physical_examination.diastole} mmHg`);
    }

    // Age and Gender
    if (patientData.demographics?.age) {
      summary.push(`Age: ${patientData.demographics.age} years`);
    }
    if (patientData.demographics?.gender) {
      summary.push(`Gender: ${patientData.demographics.gender}`);
    }

    // Diabetes-specific data
    if (patientData.investigations?.hba1c) {
      summary.push(`HbA1c: ${patientData.investigations.hba1c}%`);
    }
    if (patientData.investigations?.fasting_glucose) {
      summary.push(`Fasting Glucose: ${patientData.investigations.fasting_glucose} mmol/L`);
    }
    if (patientData.investigations?.egfr) {
      summary.push(`eGFR: ${patientData.investigations.egfr} mL/min/1.73m²`);
    }

    // BMI if available
    if (patientData.physical_examination?.height && patientData.physical_examination?.weight) {
      const heightInMeters = patientData.physical_examination.height / 100;
      const bmi = (patientData.physical_examination.weight / (heightInMeters * heightInMeters)).toFixed(1);
      summary.push(`BMI: ${bmi}`);
    }

    return summary;
  };

  const patientSummary = getPatientSummary();

  return (
    <div>
      <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
        Clinical Decisions
        {hasDecisions && (
          <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {decisions.length} recommendation{decisions.length !== 1 ? 's' : ''}
          </span>
        )}
      </h3>

      <div className="space-y-4">
        {hasDecisions ? (
          decisions.map((decision, index) => (
            <DecisionCard key={index} decision={decision} index={index} />
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            No clinical decisions available
          </div>
        )}
      </div>

      {/* Patient Summary */}
      {patientSummary && patientSummary.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
          <h5 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <span className="text-lg">📋</span> Patient Summary
          </h5>
          <div className="text-sm text-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {patientSummary.map((item, index) => (
                <div key={index} className="flex items-center">
                  <span className="text-primary-500 mr-2">•</span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Emergency Warning */}
      {hasDecisions && decisions.some(d => d.needs_referral && d.referral_reason?.toLowerCase().includes('emergency')) && (
        <div className="mt-6 p-4 bg-red-50 border border-red-300 rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚨</span>
            <div>
              <h5 className="font-bold text-red-900">Medical Emergency Detected</h5>
              <p className="text-sm text-red-700 mt-1">
                Immediate medical attention required. Please refer patient to emergency care.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClinicalDecisions;