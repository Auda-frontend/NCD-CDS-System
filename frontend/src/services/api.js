import axios from 'axios';

const API_BASE_URL = '/api/v1/cds';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout for rule evaluation
});

// Helper function to clean data before sending
const cleanPatientData = (data) => {
  const cleaned = {
    ...data,
    demographics: {
      ...data.demographics,
      age: data.demographics.age || null,
      province: data.demographics.province || null,
      district: data.demographics.district || null,
      sector: data.demographics.sector || null,
      cell: data.demographics.cell || null,
      village: data.demographics.village || null,
    },
    consultation: {
      ...data.consultation,
      practitioner_name: data.consultation.practitioner_name || null,
      patient_referred_from: data.consultation.patient_referred_from || null,
    },
    medical_history: {
      ...data.medical_history,
      // Ensure all boolean fields have proper defaults
      hypertension: Boolean(data.medical_history.hypertension),
      diabetes: Boolean(data.medical_history.diabetes),
      chronic_kidney_disease: Boolean(data.medical_history.chronic_kidney_disease),
      asthma: Boolean(data.medical_history.asthma),
      copd: Boolean(data.medical_history.copd),
      cad: Boolean(data.medical_history.cad),
      hyperkalemia: Boolean(data.medical_history.hyperkalemia),
      pregnant: Boolean(data.medical_history.pregnant),
      stroke_history: Boolean(data.medical_history.stroke_history),
      heart_failure: Boolean(data.medical_history.heart_failure),
      former_smoker: Boolean(data.medical_history.former_smoker),
      current_smoker: Boolean(data.medical_history.current_smoker),
      former_alcohol: Boolean(data.medical_history.former_alcohol),
      current_alcohol: Boolean(data.medical_history.current_alcohol),
      
      // Diabetes-specific boolean fields
      diabetes_symptoms: Boolean(data.medical_history.diabetes_symptoms),
      ketoacidosis_history: Boolean(data.medical_history.ketoacidosis_history),
      autoimmune_disease: Boolean(data.medical_history.autoimmune_disease),
      obesity: Boolean(data.medical_history.obesity),
      family_history_diabetes: Boolean(data.medical_history.family_history_diabetes),
      history_gdm: Boolean(data.medical_history.history_gdm),
      renal_impairment: Boolean(data.medical_history.renal_impairment),
      liver_disease: Boolean(data.medical_history.liver_disease),
      cardiovascular_disease: Boolean(data.medical_history.cardiovascular_disease),
      neuropathy_symptoms: Boolean(data.medical_history.neuropathy_symptoms),
      persistent_proteinuria: Boolean(data.medical_history.persistent_proteinuria),
      cardiovascular_risk_factors: Boolean(data.medical_history.cardiovascular_risk_factors),
      abdominal_pain: Boolean(data.medical_history.abdominal_pain),
      nausea_vomiting: Boolean(data.medical_history.nausea_vomiting),
      dehydration: Boolean(data.medical_history.dehydration),
      rapid_breathing: Boolean(data.medical_history.rapid_breathing),
      danger_signs: Boolean(data.medical_history.danger_signs),
      hiv_positive: Boolean(data.medical_history.hiv_positive),
      
      // String and number fields
      diabetes_onset: data.medical_history.diabetes_onset || null,
      treatment_duration: data.medical_history.treatment_duration || null,
      current_medications: data.medical_history.current_medications || [],
      medication_allergies: data.medical_history.medication_allergies || [],
    },
    physical_examination: {
      ...data.physical_examination,
      // Convert empty strings to null for optional number fields
      systole: Number(data.physical_examination.systole) || null,
      diastole: Number(data.physical_examination.diastole) || null,
      height: data.physical_examination.height ? Number(data.physical_examination.height) : null,
      weight: data.physical_examination.weight ? Number(data.physical_examination.weight) : null,
      pulse: data.physical_examination.pulse ? Number(data.physical_examination.pulse) : null,
      temperature: data.physical_examination.temperature ? Number(data.physical_examination.temperature) : null,
      spO2: data.physical_examination.spO2 ? Number(data.physical_examination.spO2) : null,
      pain_score: data.physical_examination.pain_score ? Number(data.physical_examination.pain_score) : null,
      bmi: data.physical_examination.bmi ? Number(data.physical_examination.bmi) : null,
      bp_status: data.physical_examination.bp_status || null,
      bmi_status: data.physical_examination.bmi_status || null,
    },
    social_history: {
      ...data.social_history,
      tobacco_use: Boolean(data.social_history.tobacco_use),
      alcohol_use: Boolean(data.social_history.alcohol_use),
    },
  };

  // Add investigations if they exist
  if (data.investigations) {
    cleaned.investigations = {
      hba1c: data.investigations.hba1c ? Number(data.investigations.hba1c) : null,
      fasting_glucose: data.investigations.fasting_glucose ? Number(data.investigations.fasting_glucose) : null,
      random_glucose: data.investigations.random_glucose ? Number(data.investigations.random_glucose) : null,
      blood_glucose: data.investigations.blood_glucose ? Number(data.investigations.blood_glucose) : null,
      egfr: data.investigations.egfr ? Number(data.investigations.egfr) : null,
      urine_protein: data.investigations.urine_protein ? Number(data.investigations.urine_protein) : null,
      serum_creatinine: data.investigations.serum_creatinine ? Number(data.investigations.serum_creatinine) : null,
      ldl_cholesterol: data.investigations.ldl_cholesterol ? Number(data.investigations.ldl_cholesterol) : null,
      ketonuria: Boolean(data.investigations.ketonuria),
      additional_tests: data.investigations.additional_tests || [],
    };
  } else {
    // Add empty investigations object if not provided
    cleaned.investigations = {
      hba1c: null,
      fasting_glucose: null,
      random_glucose: null,
      blood_glucose: null,
      egfr: null,
      urine_protein: null,
      serum_creatinine: null,
      ldl_cholesterol: null,
      ketonuria: false,
      additional_tests: [],
    };
  }

  return cleaned;
};

// Validate required fields before sending
const validatePatientData = (data) => {
  const errors = [];

  if (!data.demographics.full_name) {
    errors.push('Patient full name is required');
  }

  if (!data.demographics.gender) {
    errors.push('Patient gender is required');
  }

  if (!data.physical_examination.systole || !data.physical_examination.diastole) {
    errors.push('Both systolic and diastolic blood pressure are required');
  }

  if (data.physical_examination.systole && (data.physical_examination.systole < 0 || data.physical_examination.systole > 300)) {
    errors.push('Systolic blood pressure must be between 0 and 300 mmHg');
  }

  if (data.physical_examination.diastole && (data.physical_examination.diastole < 0 || data.physical_examination.diastole > 200)) {
    errors.push('Diastolic blood pressure must be between 0 and 200 mmHg');
  }

  return errors;
};

export const evaluatePatient = async (patientData) => {
  try {
    // Clean and validate data
    const cleanedData = cleanPatientData(patientData);
    const validationErrors = validatePatientData(cleanedData);

    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }

    console.log('Sending patient data to API:', cleanedData);
    
    const response = await api.post('/evaluate-direct', cleanedData);
    
    // Log successful response for debugging
    console.log('API Response received:', {
      success: response.data.success,
      decisionCount: response.data.clinical_decisions?.length || 0,
      executionTime: response.data.execution_time_ms
    });

    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.detail || error.response.data?.message || 'Server error occurred';
      throw new Error(`Server error: ${message}`);
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('No response from server. Please check if the backend is running.');
    } else {
      // Something else happened
      throw new Error(`Request failed: ${error.message}`);
    }
  }
};

export const healthCheck = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    console.error('Health check failed:', error);
    throw new Error('Backend service is unavailable');
  }
};

export const testDroolsConnection = async () => {
  try {
    const response = await api.get('/test-drools');
    return response.data;
  } catch (error) {
    console.error('Drools connection test failed:', error);
    throw new Error('Drools engine is unavailable');
  }
};

// Utility function to create sample diabetes patient for testing
export const createSampleDiabetesPatient = () => {
  return cleanPatientData({
    demographics: {
      full_name: 'Test Diabetes Patient',
      gender: 'Female',
      age: 52,
    },
    consultation: {
      chief_complaint: 'Increased thirst and frequent urination',
      consultation_type: 'initial',
    },
    medical_history: {
      diabetes: true,
      diabetes_symptoms: true,
      diabetes_onset: 'gradual',
      obesity: true,
      family_history_diabetes: true,
      hypertension: false,
    },
    social_history: {
      tobacco_use: false,
      alcohol_use: false,
    },
    physical_examination: {
      systole: 125,
      diastole: 82,
      height: 160,
      weight: 80,
      pulse: 72,
      temperature: 36.8,
    },
    investigations: {
      hba1c: 9.2,
      fasting_glucose: 10.5,
      random_glucose: 16.8,
      egfr: 85.0,
    },
  });
};

// Utility function to create sample hypertension patient for testing
export const createSampleHypertensionPatient = () => {
  return cleanPatientData({
    demographics: {
      full_name: 'Test Hypertension Patient',
      gender: 'Male',
      age: 45,
    },
    consultation: {
      chief_complaint: 'Headache and dizziness',
      consultation_type: 'initial',
    },
    medical_history: {
      hypertension: true,
      overweight: true,
      diabetes: false,
    },
    social_history: {
      tobacco_use: true,
      alcohol_use: false,
    },
    physical_examination: {
      systole: 165,
      diastole: 102,
      height: 175,
      weight: 85,
      pulse: 78,
      temperature: 36.9,
    },
    investigations: {
      hba1c: null,
      fasting_glucose: null,
      egfr: 90.0,
    },
  });
};

export default {
  evaluatePatient,
  healthCheck,
  testDroolsConnection,
  createSampleDiabetesPatient,
  createSampleHypertensionPatient,
};