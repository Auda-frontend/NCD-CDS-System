import React from 'react';

const ClinicalDecisions = ({ decisions, patientData, loading }) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600 mb-4"></div>
        <p className="text-gray-600">Analyzing patient data...</p>
        <p className="text-sm text-gray-500 mt-2">Applying Hypertension Guidelines</p>
      </div>
    );
  }

  if (!decisions || decisions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🏥</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Clinical Decisions</h3>
        <p className="text-gray-600 max-w-md mx-auto">
          Enter patient data and click "Get Clinical Recommendations" to see hypertension staging and treatment guidance based on guidelines.
        </p>
      </div>
    );
  }

  const DecisionCard = ({ decision, index }) => (
    <div className={`border rounded-xl p-6 mb-4 transition-all duration-200 ${
      decision.needs_referral 
        ? 'border-red-300 bg-red-50/50 border-l-4 border-l-red-500' 
        : 'border-gray-200 bg-white'
    }`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <h4 className="text-xl font-bold text-gray-900">{decision.diagnosis}</h4>
          {decision.stage && (
            <span className="px-3 py-1 bg-primary-100 text-primary-800 text-sm font-medium rounded-full">
              {decision.stage}
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
      {decision.recommended_medications.length > 0 && (
        <div className="mb-4">
          <h5 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            Recommended Medications
          </h5>
          <ul className="space-y-1">
            {decision.recommended_medications.map((med, idx) => (
              <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                {med}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tests */}
      {decision.recommended_tests.length > 0 && (
        <div className="mb-4">
          <h5 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <span className="text-lg">🔬</span> Recommended Tests
          </h5>
          <ul className="space-y-1">
            {decision.recommended_tests.map((test, idx) => (
              <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                {test}
              </li>
            ))}
          </ul>
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
            Referral Reason
          </h5>
          <p className="text-sm text-red-700">{decision.referral_reason}</p>
        </div>
      )}
    </div>
  );

  return (
    <div>
      <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
        Clinical Decisions
        <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded">
          {decisions.length} recommendation{decisions.length !== 1 ? 's' : ''}
        </span>
      </h3>

      <div className="space-y-4">
        {decisions.map((decision, index) => (
          <DecisionCard key={index} decision={decision} index={index} />
        ))}
      </div>

      {/* Patient Summary */}
      {patientData && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
          <h5 className="font-semibold text-gray-900 mb-2">Patient Summary</h5>
          <div className="text-sm text-gray-700 space-y-1">
            <p>
              <strong>BP:</strong> {patientData.physical_examination.systole}/{patientData.physical_examination.diastole} mmHg
            </p>
            {patientData.demographics.age && (
              <p><strong>Age:</strong> {patientData.demographics.age} years</p>
            )}
            {patientData.demographics.gender && (
              <p><strong>Gender:</strong> {patientData.demographics.gender}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClinicalDecisions;