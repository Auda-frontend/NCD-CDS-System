import React, { useReducer } from 'react';

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
    // Existing fields
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
    
    // Diabetes-specific fields
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

const reducer = (state, action) => {
  const { section, field, value } = action;
  return {
    ...state,
    [section]: {
      ...state[section],
      [field]: value
    }
  };
};

const PatientForm = ({ onSubmit, loading }) => {
  const [formData, dispatch] = useReducer(reducer, initialState);

  const handleInputChange = (section, field, value) => {
    dispatch({ section, field, value });
  };

  const handleNumberChange = (section, field, value) => {
    const numValue = value === '' ? null : Number(value);
    if (value === '' || !isNaN(numValue)) {
      handleInputChange(section, field, numValue);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

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

  const FormSection = ({ title, children }) => (
    <div className="border border-gray-200 rounded-lg p-6 bg-gray-50/50">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      {children}
    </div>
  );

  const preventInvalidNumber = (e) => {
    if (['e', 'E', '+', '-'].includes(e.key)) {
      e.preventDefault();
    }
  };

  // Show diabetes-specific fields when diabetes is checked
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={formData.demographics.full_name}
              onChange={(e) => handleInputChange('demographics', 'full_name', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={formData.demographics.gender}
              onChange={(e) => handleInputChange('demographics', 'gender', e.target.value)}
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={formData.demographics.age ?? ''}
              onChange={(e) => handleNumberChange('demographics', 'age', e.target.value)}
              onKeyDown={preventInvalidNumber}
              placeholder="30"
            />
          </div>
        </div>
      </FormSection>

      {/* Medical History */}
      <FormSection title="Medical History">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {[
            { key: 'hypertension', label: 'Hypertension' },
            { key: 'diabetes', label: 'Diabetes' },
            { key: 'chronic_kidney_disease', label: 'CKD' },
            { key: 'asthma', label: 'Asthma' },
            { key: 'copd', label: 'COPD' },
            { key: 'cad', label: 'CAD' },
            { key: 'hyperkalemia', label: 'Hyperkalemia' },
            { key: 'pregnant', label: 'Pregnant' },
            { key: 'stroke_history', label: 'Stroke History' },
            { key: 'heart_failure', label: 'Heart Failure' }
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center space-x-2">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                checked={formData.medical_history[key]}
                onChange={(e) => handleInputChange('medical_history', key, e.target.checked)}
              />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>

        {/* Diabetes-specific medical history */}
        {showDiabetesFields && (
          <div className="mt-6 p-4 border border-primary-200 rounded-lg bg-primary-50">
            <h4 className="text-md font-semibold text-primary-900 mb-3">Diabetes Details</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {[
                { key: 'diabetes_symptoms', label: 'Diabetes Symptoms' },
                { key: 'ketoacidosis_history', label: 'Ketoacidosis History' },
                { key: 'autoimmune_disease', label: 'Autoimmune Disease' },
                { key: 'obesity', label: 'Obesity' },
                { key: 'family_history_diabetes', label: 'Family History Diabetes' },
                { key: 'history_gdm', label: 'History GDM' },
                { key: 'renal_impairment', label: 'Renal Impairment' },
                { key: 'liver_disease', label: 'Liver Disease' },
                { key: 'cardiovascular_disease', label: 'Cardiovascular Disease' },
                { key: 'neuropathy_symptoms', label: 'Neuropathy Symptoms' },
                { key: 'persistent_proteinuria', label: 'Persistent Proteinuria' },
                { key: 'cardiovascular_risk_factors', label: 'CV Risk Factors' },
                { key: 'hiv_positive', label: 'HIV Positive' }
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    checked={formData.medical_history[key]}
                    onChange={(e) => handleInputChange('medical_history', key, e.target.checked)}
                  />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>

            {/* Diabetes Onset */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Diabetes Onset</label>
              <select
                className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={formData.medical_history.diabetes_onset}
                onChange={(e) => handleInputChange('medical_history', 'diabetes_onset', e.target.value)}
              >
                <option value="">Select Onset Type</option>
                <option value="acute">Acute</option>
                <option value="gradual">Gradual</option>
              </select>
            </div>

            {/* Treatment Duration */}
            <div className="mt-4 w-full md:w-64">
              <label className="block text-sm font-medium text-gray-700 mb-1">Treatment Duration (months)</label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={formData.medical_history.treatment_duration ?? ''}
                onChange={(e) => handleNumberChange('medical_history', 'treatment_duration', e.target.value)}
                onKeyDown={preventInvalidNumber}
                placeholder="6"
              />
            </div>
          </div>
        )}

        {/* Emergency Symptoms */}
        <div className="mt-6 p-4 border border-orange-200 rounded-lg bg-orange-50">
          <h4 className="text-md font-semibold text-orange-900 mb-3">Emergency Symptoms</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              { key: 'abdominal_pain', label: 'Abdominal Pain' },
              { key: 'nausea_vomiting', label: 'Nausea/Vomiting' },
              { key: 'dehydration', label: 'Dehydration' },
              { key: 'rapid_breathing', label: 'Rapid Breathing' },
              { key: 'danger_signs', label: 'Danger Signs Present' }
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="rounded border-orange-300 text-orange-600 focus:ring-orange-500"
                  checked={formData.medical_history[key]}
                  onChange={(e) => handleInputChange('medical_history', key, e.target.checked)}
                />
                <span className="text-sm text-orange-800">{label}</span>
              </label>
            ))}
          </div>
        </div>
      </FormSection>

      {/* Investigations */}
      <FormSection title="Laboratory Investigations">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { field: 'hba1c', label: 'HbA1c (%)', placeholder: '5.6', step: '0.1' },
            { field: 'fasting_glucose', label: 'Fasting Glucose (mmol/L)', placeholder: '5.6', step: '0.1' },
            { field: 'random_glucose', label: 'Random Glucose (mmol/L)', placeholder: '7.8', step: '0.1' },
            { field: 'blood_glucose', label: 'Blood Glucose (mmol/L)', placeholder: '6.5', step: '0.1' },
            { field: 'egfr', label: 'eGFR (mL/min/1.73m²)', placeholder: '90' },
            { field: 'urine_protein', label: 'Urine Protein', placeholder: '0.0', step: '0.1' },
            { field: 'serum_creatinine', label: 'Serum Creatinine', placeholder: '0.8', step: '0.1' },
            { field: 'ldl_cholesterol', label: 'LDL Cholesterol', placeholder: '2.6', step: '0.1' }
          ].map(({ field, label, placeholder, step }) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                type="number"
                step={step}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={formData.investigations[field] ?? ''}
                onChange={(e) => handleNumberChange('investigations', field, e.target.value)}
                onKeyDown={preventInvalidNumber}
                placeholder={placeholder}
              />
            </div>
          ))}
        </div>

        {/* Ketonuria Checkbox */}
        <div className="mt-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              checked={formData.investigations.ketonuria}
              onChange={(e) => handleInputChange('investigations', 'ketonuria', e.target.checked)}
            />
            <span className="text-sm font-medium text-gray-700">Ketonuria Present</span>
          </label>
        </div>
      </FormSection>

      {/* Physical Examination */}
      <FormSection title="Physical Examination">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { field: 'systole', label: 'Systolic BP (mmHg) *', placeholder: '120', required: true },
            { field: 'diastole', label: 'Diastolic BP (mmHg) *', placeholder: '80', required: true },
            { field: 'height', label: 'Height (cm)', placeholder: '170' },
            { field: 'weight', label: 'Weight (kg)', placeholder: '70' },
            { field: 'pulse', label: 'Pulse (bpm)', placeholder: '72' },
            { field: 'temperature', label: 'Temperature (°C)', placeholder: '37.0', step: '0.1' },
            { field: 'spO2', label: 'SpO2 (%)', placeholder: '98' },
            { field: 'pain_score', label: 'Pain Score (0-10)', placeholder: '0' }
          ].map(({ field, label, placeholder, required, step }) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                type="number"
                step={step}
                required={required}
                min={field === 'pain_score' ? 0 : undefined}
                max={field === 'pain_score' ? 10 : undefined}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={formData.physical_examination[field] ?? ''}
                onChange={(e) => handleNumberChange('physical_examination', field, e.target.value)}
                onKeyDown={preventInvalidNumber}
                placeholder={placeholder}
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
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                checked={formData.social_history[field]}
                onChange={(e) => handleInputChange('social_history', field, e.target.checked)}
              />
              <span className="text-sm text-gray-700">
                {field === 'tobacco_use' ? 'Tobacco Use' : 'Alcohol Use'}
              </span>
            </label>
          ))}
        </div>
      </FormSection>

      {/* Consultation */}
      <FormSection title="Consultation">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Chief Complaint</label>
          <textarea
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={formData.consultation.chief_complaint}
            onChange={(e) => handleInputChange('consultation', 'chief_complaint', e.target.value)}
            placeholder="Describe the patient's main concerns..."
          />
        </div>
      </FormSection>

      {/* Submit */}
      <div className="flex justify-center pt-4">
        <button
          type="submit"
          disabled={loading || !formData.physical_examination.systole || !formData.physical_examination.diastole}
          className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-lg shadow-lg hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              Evaluating...
            </span>
          ) : (
            'Get Clinical Recommendations'
          )}
        </button>
      </div>

      <div className="text-xs text-gray-500 text-center">
        * Required fields: Systolic and Diastolic Blood Pressure
      </div>
    </form>
  );
};

export default PatientForm;