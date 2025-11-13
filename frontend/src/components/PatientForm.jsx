import React, { useReducer, useCallback, memo,useEffect } from 'react';

const initialState = {
  demographics: {
    full_name: '',
    gender: '',
    age: null,
    province: '',
    district: '',
    sector: '',
    cell: '',
    village: ''
  },
  consultation: {
    chief_complaint: '',
    consultation_type: 'initial'
  },
  medical_history: {
    hypertension: false,
    diabetes: false,
    chronic_kidney_disease: false,
    asthma: false,
    copd: false,
    cad: false,
    hyperkalemia: false,
    pregnant: false,
    stroke_history: false,
    heart_failure: false,
    current_medications: [],
    medication_allergies: [],
    former_smoker: false,
    current_smoker: false,
    former_alcohol: false,
    current_alcohol: false,
    diabetes_symptoms: false,
    diabetes_onset: '',
    ketoacidosis_history: false,
    autoimmune_disease: false,
    obesity: false,
    family_history_diabetes: false,
    history_gdm: false,
    renal_impairment: false,
    liver_disease: false,
    cardiovascular_disease: false,
    neuropathy_symptoms: false,
    persistent_proteinuria: false,
    cardiovascular_risk_factors: false,
    abdominal_pain: false,
    nausea_vomiting: false,
    dehydration: false,
    rapid_breathing: false,
    danger_signs: false,
    treatment_duration: null,
    hiv_positive: false
  },
  social_history: {
    tobacco_use: false,
    alcohol_use: false
  },
  physical_examination: {
    systole: null,
    diastole: null,
    height: null,
    weight: null,
    pulse: null,
    temperature: null,
    spO2: null,
    pain_score: null
  },
  investigations: {
    hba1c: null,
    fasting_glucose: null,
    random_glucose: null,
    blood_glucose: null,
    egfr: null,
    ketonuria: false,
    urine_protein: null,
    serum_creatinine: null,
    ldl_cholesterol: null,
    additional_tests: []
  }
};

// ✅ Focus-safe reducer (prevents full rerender)
const reducer = (state, action) => {
  const { section, field, value } = action;
  if (state[section][field] === value) return state; // skip unnecessary re-renders
  return {
    ...state,
    [section]: {
      ...state[section],
      [field]: value
    }
  };
};

// ✅ Memoized reusable section
const FormSection = memo(({ title, children }) => (
  <div className="border border-gray-200 rounded-lg p-6 bg-gray-50/50">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
    {children}
  </div>
));

const PatientForm = ({ onSubmit, loading }) => {
  const [formData, dispatch] = useReducer(reducer, initialState);

  const handleInputChange = useCallback((section, field, value) => {
    dispatch({ section, field, value });
  }, []);

  const handleNumberChange = useCallback((section, field, value) => {
    const numValue = value === '' ? null : Number(value);
    if (value === '' || !isNaN(numValue)) {
      handleInputChange(section, field, numValue);
    }
  }, [handleInputChange]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const preventInvalidNumber = (e) => {
    if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
  };

    // Automatic eGFR Calculation
  useEffect(() => {
    const age = formData.demographics.age;
    const gender = formData.demographics.gender;
    const weight = formData.physical_examination.weight;
    const serumCreatinine = formData.investigations.serum_creatinine;

    if (age && gender && weight && serumCreatinine) {
      const factor = gender === "Male" ? 1.23 : 1.04;
      let creatinineValue = serumCreatinine;

      // If value seems in mg/dL (typical human range < 20), convert to µmol/L
      if (creatinineValue < 20) {
        creatinineValue = creatinineValue * 88.4;
      }

      const egfr =
        ((140 - age) * weight * factor) / creatinineValue;

      if (!isNaN(egfr) && egfr > 0) {
        handleInputChange(
          "investigations",
          "egfr",
          Number(egfr.toFixed(2))
        );
      }
    }
  }, [
    formData.demographics.age,
    formData.demographics.gender,
    formData.physical_examination.weight,
    formData.investigations.serum_creatinine,
  ]);

  // BMI calculation
  const calculateBMI = () => {
    const height = formData.physical_examination.height;
    const weight = formData.physical_examination.weight;
    if (height && weight && height > 0) {
      const heightInMeters = height / 100;
      return (weight / (heightInMeters * heightInMeters)).toFixed(1);
    }
    return null;
  };

  const bmi = calculateBMI();
  const bmiStatus = bmi
    ? bmi < 18.5
      ? 'Underweight'
      : bmi < 25
      ? 'Normal'
      : bmi < 30
      ? 'Overweight'
      : 'Obese'
    : null;

  const showDiabetesFields = formData.medical_history.diabetes;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Demographics */}
      <FormSection title="Patient Demographics">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              value={formData.demographics.full_name}
              onChange={(e) => handleInputChange('demographics', 'full_name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
            <select
              value={formData.demographics.gender}
              onChange={(e) => handleInputChange('demographics', 'gender', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
            <input
              type="number"
              value={formData.demographics.age ?? ''}
              onChange={(e) => handleNumberChange('demographics', 'age', e.target.value)}
              onKeyDown={preventInvalidNumber}
              placeholder="30"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </FormSection>

      {/* Consultation */}
      <FormSection title="Consultation">
        <label className="block text-sm font-medium text-gray-700 mb-1">Chief Complaint</label>
        <textarea
          rows="3"
          value={formData.consultation.chief_complaint}
          onChange={(e) => handleInputChange('consultation', 'chief_complaint', e.target.value)}
          placeholder="Describe the patient's main concerns..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </FormSection>

      {/* Medical History */}
      <FormSection title="Medical History">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {[
            'hypertension',
            'diabetes',
            'chronic_kidney_disease',
            'asthma',
            'copd',
            'cad',
            'hyperkalemia',
            'pregnant',
            'stroke_history',
            'heart_failure'
          ].map((key) => (
            <label key={key} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.medical_history[key]}
                onChange={(e) => handleInputChange('medical_history', key, e.target.checked)}
              />
              <span className="text-sm text-gray-700 capitalize">
                {key.replace(/_/g, ' ')}
              </span>
            </label>
          ))}
        </div>

        {showDiabetesFields && (
          <div className="mt-6 p-4 border border-primary-200 rounded-lg bg-primary-50">
            <h4 className="text-md font-semibold text-primary-900 mb-3">Diabetes Details</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {[
                'diabetes_symptoms',
                'ketoacidosis_history',
                'autoimmune_disease',
                'obesity',
                'family_history_diabetes',
                'history_gdm',
                'renal_impairment',
                'liver_disease',
                'cardiovascular_disease',
                'neuropathy_symptoms',
                'persistent_proteinuria',
                'cardiovascular_risk_factors',
                'hiv_positive'
              ].map((key) => (
                <label key={key} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.medical_history[key]}
                    onChange={(e) => handleInputChange('medical_history', key, e.target.checked)}
                  />
                  <span className="text-sm text-gray-700 capitalize">
                    {key.replace(/_/g, ' ')}
                  </span>
                </label>
              ))}
            </div>

            {/* Diabetes onset & treatment */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Diabetes Onset</label>
                <select
                  value={formData.medical_history.diabetes_onset}
                  onChange={(e) => handleInputChange('medical_history', 'diabetes_onset', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select Onset Type</option>
                  <option value="acute">Acute</option>
                  <option value="gradual">Gradual</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Treatment Duration (months)</label>
                <input
                  type="number"
                  value={formData.medical_history.treatment_duration ?? ''}
                  onChange={(e) => handleNumberChange('medical_history', 'treatment_duration', e.target.value)}
                  onKeyDown={preventInvalidNumber}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="6"
                />
              </div>
            </div>
          </div>
        )}
      </FormSection>

      {/* Investigations */}
      <FormSection title="Laboratory Investigations">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { field: 'hba1c', label: 'HbA1c (%)', placeholder: '5.6', step: '0.1' },
            { field: 'fasting_glucose', label: 'Fasting Glucose (mmol/L)', placeholder: '5.6', step: '0.1' },
            { field: 'random_glucose', label: 'Random Glucose (mmol/L)', placeholder: '7.8', step: '0.1' },
            { field: 'blood_glucose', label: 'Blood Glucose (mmol/L)', placeholder: '6.5', step: '0.1' },
            { field: 'urine_protein', label: 'Urine Protein', placeholder: '0.0', step: '0.1' },
            { field: 'serum_creatinine', label: 'Serum Creatinine', placeholder: '0.8', step: '0.1' },
            { field: 'ldl_cholesterol', label: 'LDL Cholesterol', placeholder: '2.6', step: '0.1' }
          ].map(({ field, label, placeholder, step }) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                type="number"
                step={step}
                value={formData.investigations[field] ?? ''}
                onChange={(e) => handleNumberChange('investigations', field, e.target.value)}
                onKeyDown={preventInvalidNumber}
                placeholder={placeholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          ))}

          {/* Auto-calculated eGFR */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              eGFR (mL/min/1.73m²)
            </label>
            <input
              type="number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700"
              value={formData.investigations.egfr ?? ""}
              readOnly
            />
          </div>
        </div>

        {/* Ketonuria */}
        <div className="mt-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.investigations.ketonuria}
              onChange={(e) => handleInputChange('investigations', 'ketonuria', e.target.checked)}
            />
            <span className="text-sm font-medium text-gray-700">Ketonuria Present</span>
          </label>
        </div>
      </FormSection>

      {/* Physical Exam */}
      <FormSection title="Physical Examination">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { field: 'systole', label: 'Systolic BP (mmHg) *', placeholder: '120' },
            { field: 'diastole', label: 'Diastolic BP (mmHg) *', placeholder: '80' },
            { field: 'height', label: 'Height (cm)', placeholder: '170' },
            { field: 'weight', label: 'Weight (kg)', placeholder: '70' },
            { field: 'pulse', label: 'Pulse (bpm)', placeholder: '72' },
            { field: 'temperature', label: 'Temperature (°C)', placeholder: '37.0', step: '0.1' },
            { field: 'spO2', label: 'SpO2 (%)', placeholder: '98' },
            { field: 'pain_score', label: 'Pain Score (0-10)', placeholder: '0' }
          ].map(({ field, label, placeholder, step }) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                type="number"
                step={step}
                value={formData.physical_examination[field] ?? ''}
                onChange={(e) => handleNumberChange('physical_examination', field, e.target.value)}
                onKeyDown={preventInvalidNumber}
                placeholder={placeholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          ))}
        </div>

        {bmi && (
          <div className="mt-4 p-3 bg-primary-50 border border-primary-200 rounded-md">
            <p className="text-sm font-medium text-primary-900">
              BMI: <span className="font-bold">{bmi}</span>
              <span className="ml-2 px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded-full">
                {bmiStatus}
              </span>
            </p>
          </div>
        )}
      </FormSection>

      {/* Social History */}
      <FormSection title="Social History">
        <div className="flex gap-6">
          {['tobacco_use', 'alcohol_use'].map((field) => (
            <label key={field} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.social_history[field]}
                onChange={(e) => handleInputChange('social_history', field, e.target.checked)}
              />
              <span className="text-sm text-gray-700 capitalize">{field.replace('_', ' ')}</span>
            </label>
          ))}
        </div>
      </FormSection>

      {/* Submit */}
      <div className="flex justify-center pt-4">
        <button
          type="submit"
          disabled={loading}
          className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-lg shadow-lg hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 transition-all duration-200"
        >
          {loading ? 'Evaluating...' : 'Get Clinical Recommendations'}
        </button>
      </div>

      <p className="text-xs text-gray-500 text-center">
        * Required fields: Systolic and Diastolic Blood Pressure
      </p>
    </form>
  );
};

export default PatientForm;
