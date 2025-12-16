import React, { useState } from 'react';

const CDSEvaluationForm = ({ visit, onSubmit, onCancel }) => {
  const [evaluationData, setEvaluationData] = useState({
    symptoms: '',
    medical_history: '',
    current_medications: '',
    allergies: '',
    vital_signs: {
      systolic_bp: '',
      diastolic_bp: '',
      heart_rate: '',
      temperature: '',
      weight: '',
      height: '',
      bmi: '',
    },
    laboratory_results: {
      fasting_glucose: '',
      hba1c: '',
      creatinine: '',
      egfr: '',
      total_cholesterol: '',
      ldl_cholesterol: '',
      hdl_cholesterol: '',
      triglycerides: '',
    },
    risk_factors: {
      smoking: false,
      alcohol_use: false,
      physical_activity: '',
      family_history_diabetes: false,
      family_history_cvd: false,
    },
    clinical_assessment: '',
    additional_notes: '',
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.includes('.')) {
      const [section, field] = name.split('.');
      setEvaluationData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setEvaluationData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(evaluationData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Patient Information Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Visit Summary</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Visit Date:</span>
            <span className="ml-2 text-gray-900">
              {new Date(visit.visit_date).toLocaleDateString()}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Chief Complaint:</span>
            <span className="ml-2 text-gray-900">
              {visit.chief_complaint || 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Current Symptoms */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Current Symptoms *
        </label>
        <textarea
          name="symptoms"
          value={evaluationData.symptoms}
          onChange={handleChange}
          required
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Describe the patient's current symptoms in detail..."
        />
      </div>

      {/* Medical History */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Medical History
        </label>
        <textarea
          name="medical_history"
          value={evaluationData.medical_history}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Relevant medical history, past diagnoses, surgeries..."
        />
      </div>

      {/* Current Medications */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Current Medications
        </label>
        <textarea
          name="current_medications"
          value={evaluationData.current_medications}
          onChange={handleChange}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="List all current medications with dosages..."
        />
      </div>

      {/* Allergies */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Allergies
        </label>
        <textarea
          name="allergies"
          value={evaluationData.allergies}
          onChange={handleChange}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Known drug allergies, food allergies, etc..."
        />
      </div>

      {/* Vital Signs */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Vital Signs</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Systolic BP (mmHg)
            </label>
            <input
              type="number"
              name="vital_signs.systolic_bp"
              value={evaluationData.vital_signs.systolic_bp}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="120"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Diastolic BP (mmHg)
            </label>
            <input
              type="number"
              name="vital_signs.diastolic_bp"
              value={evaluationData.vital_signs.diastolic_bp}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="80"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Heart Rate (bpm)
            </label>
            <input
              type="number"
              name="vital_signs.heart_rate"
              value={evaluationData.vital_signs.heart_rate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="72"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Temperature (°C)
            </label>
            <input
              type="number"
              step="0.1"
              name="vital_signs.temperature"
              value={evaluationData.vital_signs.temperature}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="36.5"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Weight (kg)
            </label>
            <input
              type="number"
              step="0.1"
              name="vital_signs.weight"
              value={evaluationData.vital_signs.weight}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="70.5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Height (cm)
            </label>
            <input
              type="number"
              step="0.1"
              name="vital_signs.height"
              value={evaluationData.vital_signs.height}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="170.0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              BMI
            </label>
            <input
              type="number"
              step="0.1"
              name="vital_signs.bmi"
              value={evaluationData.vital_signs.bmi}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="24.2"
            />
          </div>
        </div>
      </div>

      {/* Laboratory Results */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Laboratory Results</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fasting Glucose (mmol/L)
            </label>
            <input
              type="number"
              step="0.1"
              name="laboratory_results.fasting_glucose"
              value={evaluationData.laboratory_results.fasting_glucose}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="5.5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              HbA1c (%)
            </label>
            <input
              type="number"
              step="0.1"
              name="laboratory_results.hba1c"
              value={evaluationData.laboratory_results.hba1c}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="5.7"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Creatinine (μmol/L)
            </label>
            <input
              type="number"
              step="0.1"
              name="laboratory_results.creatinine"
              value={evaluationData.laboratory_results.creatinine}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="80"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              eGFR (mL/min/1.73m²)
            </label>
            <input
              type="number"
              name="laboratory_results.egfr"
              value={evaluationData.laboratory_results.egfr}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="90"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total Cholesterol (mmol/L)
            </label>
            <input
              type="number"
              step="0.1"
              name="laboratory_results.total_cholesterol"
              value={evaluationData.laboratory_results.total_cholesterol}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="4.5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              LDL Cholesterol (mmol/L)
            </label>
            <input
              type="number"
              step="0.1"
              name="laboratory_results.ldl_cholesterol"
              value={evaluationData.laboratory_results.ldl_cholesterol}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="2.5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              HDL Cholesterol (mmol/L)
            </label>
            <input
              type="number"
              step="0.1"
              name="laboratory_results.hdl_cholesterol"
              value={evaluationData.laboratory_results.hdl_cholesterol}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="1.2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Triglycerides (mmol/L)
            </label>
            <input
              type="number"
              step="0.1"
              name="laboratory_results.triglycerides"
              value={evaluationData.laboratory_results.triglycerides}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="1.5"
            />
          </div>
        </div>
      </div>

      {/* Risk Factors */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Risk Factors</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="risk_factors.smoking"
                checked={evaluationData.risk_factors.smoking}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 text-sm text-gray-700">
                Current or former smoker
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="risk_factors.alcohol_use"
                checked={evaluationData.risk_factors.alcohol_use}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 text-sm text-gray-700">
                Alcohol use
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="risk_factors.family_history_diabetes"
                checked={evaluationData.risk_factors.family_history_diabetes}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 text-sm text-gray-700">
                Family history of diabetes
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="risk_factors.family_history_cvd"
                checked={evaluationData.risk_factors.family_history_cvd}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 text-sm text-gray-700">
                Family history of cardiovascular disease
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Physical Activity Level
            </label>
            <select
              name="risk_factors.physical_activity"
              value={evaluationData.risk_factors.physical_activity}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select activity level</option>
              <option value="sedentary">Sedentary</option>
              <option value="light">Light activity</option>
              <option value="moderate">Moderate activity</option>
              <option value="vigorous">Vigorous activity</option>
            </select>
          </div>
        </div>
      </div>

      {/* Clinical Assessment */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Clinical Assessment
        </label>
        <textarea
          name="clinical_assessment"
          value={evaluationData.clinical_assessment}
          onChange={handleChange}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Clinician's assessment and impression..."
        />
      </div>

      {/* Additional Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Additional Notes
        </label>
        <textarea
          name="additional_notes"
          value={evaluationData.additional_notes}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Any additional information or observations..."
        />
      </div>

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          Generate CDS Recommendations
        </button>
      </div>
    </form>
  );
};

export default CDSEvaluationForm;