import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/v1/cds';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper function to clean data before sending
const cleanPatientData = (data) => {
  return {
    ...data,
    physical_examination: {
      ...data.physical_examination,
      // Convert empty strings to null for optional number fields
      height: data.physical_examination.height || null,
      weight: data.physical_examination.weight || null,
      pulse: data.physical_examination.pulse || null,
      temperature: data.physical_examination.temperature || null,
      // Ensure required fields are numbers
      systole: Number(data.physical_examination.systole),
      diastole: Number(data.physical_examination.diastole),
    },
    demographics: {
      ...data.demographics,
      age: data.demographics.age || null,
    }
  };
};

export const evaluatePatient = async (patientData) => {
  try {
    const cleanedData = cleanPatientData(patientData);
    const response = await api.post('/evaluate-direct', cleanedData);
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    throw new Error('Failed to evaluate patient data');
  }
};

export const healthCheck = async () => {
  const response = await api.get('/health');
  return response.data;
};