import React, { useReducer, useCallback, memo, useEffect, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const initialState = {
  patient_id: '',
  visit_date: new Date().toISOString().split('T')[0],
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
  },
  notes: ''
};

// ✅ Focus-safe reducer (prevents full rerender)
const reducer = (state, action) => {
  const { section, field, value } = action;
  if (section && state[section] && state[section][field] === value) return state; // skip unnecessary re-renders
  if (section) {
    return {
      ...state,
      [section]: {
        ...state[section],
        [field]: value
      }
    };
  }
  return {
    ...state,
    [field]: value
  };
};

// ✅ Memoized reusable section
const FormSection = memo(({ title, children }) => (
  <div className="border border-gray-200 rounded-lg p-6 bg-gray-50/50">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
    {children}
  </div>
));

const VisitForm = ({ visit, patients, onSubmit, onCancel }) => {
  const [formData, dispatch] = useReducer(reducer, initialState);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientDemographics, setPatientDemographics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [savedVisitId, setSavedVisitId] = useState(null);

  useEffect(() => {
    if (visit) {
      // Load existing visit data
      dispatch({ field: 'patient_id', value: visit.patient_id || '' });
      dispatch({ field: 'visit_date', value: visit.visit_date ? new Date(visit.visit_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0] });
      dispatch({ field: 'notes', value: visit.notes || '' });
      
      if (visit.consultation) {
        Object.keys(visit.consultation).forEach(key => {
          dispatch({ section: 'consultation', field: key, value: visit.consultation[key] });
        });
      }
      if (visit.medical_history) {
        Object.keys(visit.medical_history).forEach(key => {
          dispatch({ section: 'medical_history', field: key, value: visit.medical_history[key] });
        });
      }
      if (visit.social_history) {
        Object.keys(visit.social_history).forEach(key => {
          dispatch({ section: 'social_history', field: key, value: visit.social_history[key] });
        });
      }
      if (visit.physical_examination) {
        Object.keys(visit.physical_examination).forEach(key => {
          dispatch({ section: 'physical_examination', field: key, value: visit.physical_examination[key] });
        });
      }
      if (visit.investigations) {
        Object.keys(visit.investigations).forEach(key => {
          dispatch({ section: 'investigations', field: key, value: visit.investigations[key] });
        });
      }
      
      // Load vitals from direct fields
      if (visit.systole) dispatch({ section: 'physical_examination', field: 'systole', value: visit.systole });
      if (visit.diastole) dispatch({ section: 'physical_examination', field: 'diastole', value: visit.diastole });
      if (visit.height_cm) dispatch({ section: 'physical_examination', field: 'height', value: visit.height_cm });
      if (visit.weight_kg) dispatch({ section: 'physical_examination', field: 'weight', value: visit.weight_kg });
      if (visit.pulse) dispatch({ section: 'physical_examination', field: 'pulse', value: visit.pulse });
      if (visit.temperature) dispatch({ section: 'physical_examination', field: 'temperature', value: visit.temperature });
      if (visit.spo2) dispatch({ section: 'physical_examination', field: 'spO2', value: visit.spo2 });
      if (visit.pain_score) dispatch({ section: 'physical_examination', field: 'pain_score', value: visit.pain_score });
      
      if (visit.patient_id) {
        loadPatientDemographics(visit.patient_id);
      }
      setSavedVisitId(visit.id);
    }
  }, [visit]);

  const loadPatientDemographics = async (patientId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/patients/${patientId}/demographics`);
      if (response.ok) {
        const data = await response.json();
        setPatientDemographics(data);
        const patient = patients.find(p => p.id === patientId || p.patient_id === patientId);
        setSelectedPatient(patient);
      }
    } catch (error) {
      console.error('Error loading patient demographics:', error);
    }
  };

  const handlePatientChange = (e) => {
    const patientId = e.target.value;
    dispatch({ field: 'patient_id', value: patientId });

    if (patientId) {
      const patient = patients.find(p => p.id === patientId || p.patient_id === patientId);
      setSelectedPatient(patient);
      loadPatientDemographics(patientId);
    } else {
      setSelectedPatient(null);
      setPatientDemographics(null);
    }
  };

  const handleInputChange = useCallback((section, field, value) => {
    dispatch({ section, field, value });
  }, []);

  const handleNumberChange = useCallback((section, field, value) => {
    // If the input is cleared, set null
    if (value === '') {
      handleInputChange(section, field, null);
      return;
    }

    const numValue = Number(value);
    if (isNaN(numValue)) return;

    let finalValue = numValue;

    // Enforce integer 0-10 for pain_score
    if (section === 'physical_examination' && field === 'pain_score') {
      if (finalValue > 10) finalValue = 10;
      if (finalValue < 0) finalValue = 0;
      finalValue = Math.round(finalValue);
    }

    handleInputChange(section, field, finalValue);
  }, [handleInputChange]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Prepare visit data
      const visitData = {
        patient_id: formData.patient_id,
        // Send as ISO datetime to satisfy backend datetime parsing
        visit_date: formData.visit_date
          ? `${formData.visit_date}T00:00:00`
          : null,
        consultation: formData.consultation,
        medical_history: formData.medical_history,
        social_history: formData.social_history,
        physical_examination: formData.physical_examination,
        investigations: formData.investigations,
        notes: formData.notes,
        // Map physical examination to direct fields
        systole: formData.physical_examination.systole,
        diastole: formData.physical_examination.diastole,
        height_cm: formData.physical_examination.height,
        weight_kg: formData.physical_examination.weight,
        pulse: formData.physical_examination.pulse,
        temperature: formData.physical_examination.temperature,
        spo2: formData.physical_examination.spO2,
        pain_score: formData.physical_examination.pain_score,
        bmi: calculateBMI()
      };

      const url = visit ? `${API_BASE_URL}/visits/${visit.id}` : `${API_BASE_URL}/visits`;
      const method = visit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(visitData),
      });

      if (response.ok) {
        const savedVisit = await response.json();
        setSavedVisitId(savedVisit.id);
        if (onSubmit) {
          onSubmit(savedVisit);
        }
      } else {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        alert(`Failed to ${visit ? 'update' : 'create'} visit: ${errorData.detail || response.statusText}`);
      }
    } catch (error) {
      console.error('Error saving visit:', error);
      alert(`Error ${visit ? 'updating' : 'creating'} visit: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGetRecommendations = async () => {
    if (!savedVisitId) {
      alert('Please save the visit first before getting recommendations.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/visits/${savedVisitId}/cds-evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Recommendations generated successfully! Visit the CDS Recommendations page to view them.`);
        // Optionally redirect to recommendations page
        window.location.href = '/recommendations';
      } else {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        alert(`Failed to get recommendations: ${errorData.detail || response.statusText}`);
      }
    } catch (error) {
      console.error('Error getting recommendations:', error);
      alert(`Error getting recommendations: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const preventInvalidNumber = (e) => {
    if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
  };

  // Automatic eGFR Calculation
  useEffect(() => {
    const age = patientDemographics?.age;
    const gender = patientDemographics?.gender;
    const weight = formData.physical_examination.weight;
    const serumCreatinine = formData.investigations.serum_creatinine;

    if (age && gender && weight && serumCreatinine) {
      const factor = gender === "Male" ? 1.23 : 1.04;
      let creatinineValue = serumCreatinine;

      // If value seems in mg/dL (typical human range < 20), convert to µmol/L
      if (creatinineValue < 20) {
        creatinineValue = creatinineValue * 88.4;
      }

      const egfr = ((140 - age) * weight * factor) / creatinineValue;

      if (!isNaN(egfr) && egfr > 0) {
        handleInputChange("investigations", "egfr", Number(egfr.toFixed(2)));
      }
    }
  }, [
    patientDemographics?.age,
    patientDemographics?.gender,
    formData.physical_examination.weight,
    formData.investigations.serum_creatinine,
    handleInputChange
  ]);

  // BMI calculation
  const calculateBMI = () => {
    const height = formData.physical_examination.height;
    const weight = formData.physical_examination.weight;
    if (height && weight && height > 0) {
      const heightInMeters = height / 100;
      return Number((weight / (heightInMeters * heightInMeters)).toFixed(1));
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
      {/* Patient Selection */}
      <FormSection title="Patient Information">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Patient *
          </label>
          <select
            value={formData.patient_id}
            onChange={handlePatientChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a patient</option>
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.full_name} (ID: {patient.patient_id || patient.id})
              </option>
            ))}
          </select>
        </div>

        {/* Patient Demographics Display */}
        {patientDemographics && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Patient Demographics</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-blue-700">Name:</span>
                <span className="ml-2 text-blue-900">{patientDemographics.full_name}</span>
              </div>
              <div>
                <span className="text-blue-700">Age:</span>
                <span className="ml-2 text-blue-900">{patientDemographics.age || 'N/A'} years</span>
              </div>
              <div>
                <span className="text-blue-700">Gender:</span>
                <span className="ml-2 text-blue-900 capitalize">{patientDemographics.gender || 'N/A'}</span>
              </div>
              <div>
                <span className="text-blue-700">Phone:</span>
                <span className="ml-2 text-blue-900">{patientDemographics.phone || 'N/A'}</span>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Visit Date *</label>
            <input
              type="date"
              value={formData.visit_date}
              onChange={(e) => dispatch({ field: 'visit_date', value: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </FormSection>

      {/* Consultation */}
      <FormSection title="Consultation">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Consultation Type *</label>
            <select
              value={formData.consultation.consultation_type}
              onChange={(e) => handleInputChange('consultation', 'consultation_type', e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="initial">Initial Consultation</option>
              <option value="follow_up">Follow-up</option>
              <option value="emergency">Emergency</option>
              <option value="routine">Routine Check-up</option>
            </select>
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Chief Complaint *</label>
          <textarea
            rows="3"
            value={formData.consultation.chief_complaint}
            onChange={(e) => handleInputChange('consultation', 'chief_complaint', e.target.value)}
            placeholder="Describe the patient's main concerns..."
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
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
          <div className="mt-6 p-4 border border-blue-200 rounded-lg bg-blue-50">
            <h4 className="text-md font-semibold text-blue-900 mb-3">Diabetes Details</h4>
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
            { field: 'pain_score', label: 'Pain Score (0-10)', placeholder: '0', step: '1', min: 0, max: 10 }
          ].map(({ field, label, placeholder, step, min, max }) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                type="number"
                step={step}
                min={min}
                max={max}
                value={formData.physical_examination[field] ?? ''}
                onChange={(e) => handleNumberChange('physical_examination', field, e.target.value)}
                onKeyDown={preventInvalidNumber}
                placeholder={placeholder}
                required={field === 'systole' || field === 'diastole'}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
        </div>

        {bmi && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm font-medium text-blue-900">
              BMI: <span className="font-bold">{bmi}</span>
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {bmiStatus}
              </span>
            </p>
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
            { field: 'serum_creatinine', label: 'Serum Creatinine (mmol/L)', placeholder: '0.8', step: '0.1' },
            { field: 'ldl_cholesterol', label: 'LDL Cholesterol (mmol/L)', placeholder: '2.6', step: '0.1' }
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

      {/* Notes */}
      <FormSection title="Additional Notes">
        <textarea
          rows="3"
          value={formData.notes}
          onChange={(e) => dispatch({ field: 'notes', value: e.target.value })}
          placeholder="Additional clinical notes..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </FormSection>

      {/* Submit Buttons */}
      <div className="flex justify-end space-x-4 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Saving...' : (visit ? 'Update Visit' : 'Save Visit')}
        </button>
        {savedVisitId && (
          <button
            type="button"
            onClick={handleGetRecommendations}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Get Recommendations'}
          </button>
        )}
      </div>

      <p className="text-xs text-gray-500 text-center">
        * Required fields: Patient, Visit Date, Consultation Type, Chief Complaint, Systolic and Diastolic Blood Pressure
      </p>
    </form>
  );
};

export default VisitForm;
