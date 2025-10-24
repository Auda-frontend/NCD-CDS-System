import React, { useState } from 'react';

const PatientForm = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    demographics: {
      full_name: '',
      gender: '',
      age: '',
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
      current_medications: [],
      medication_allergies: []
    },
    social_history: {
      tobacco_use: false,
      alcohol_use: false
    },
    physical_examination: {
      systole: '',
      diastole: '',
      height: '',
      weight: '',
      pulse: '',
      temperature: ''
    }
  });

  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleNumberChange = (section, field, value) => {
    // Convert empty string to null for number fields
    const processedValue = value === '' ? null : Number(value);
    handleInputChange(section, field, processedValue);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Clean the data before submitting
    const cleanedData = {
      ...formData,
      physical_examination: {
        ...formData.physical_examination,
        systole: formData.physical_examination.systole === '' ? null : Number(formData.physical_examination.systole),
        diastole: formData.physical_examination.diastole === '' ? null : Number(formData.physical_examination.diastole),
        height: formData.physical_examination.height === '' ? null : Number(formData.physical_examination.height),
        weight: formData.physical_examination.weight === '' ? null : Number(formData.physical_examination.weight),
        pulse: formData.physical_examination.pulse === '' ? null : Number(formData.physical_examination.pulse),
        temperature: formData.physical_examination.temperature === '' ? null : Number(formData.physical_examination.temperature),
      },
      demographics: {
        ...formData.demographics,
        age: formData.demographics.age === '' ? null : Number(formData.demographics.age)
      }
    };

    onSubmit(cleanedData);
  };

  const calculateBMI = () => {
    const height = parseFloat(formData.physical_examination.height) / 100;
    const weight = parseFloat(formData.physical_examination.weight);
    if (height && weight && height > 0) {
      return (weight / (height * height)).toFixed(1);
    }
    return null;
  };

  const bmi = calculateBMI();
  const bmiStatus = bmi ? (
    bmi < 18.5 ? 'Underweight' :
    bmi < 25 ? 'Normal' :
    bmi < 30 ? 'Overweight' : 'Obese'
  ) : null;

  const FormSection = ({ title, icon, children }) => (
    <div className="border border-gray-200 rounded-lg p-6 bg-gray-50/50">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        {icon} {title}
      </h3>
      {children}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Demographics */}
      <FormSection title="Patient Demographics" >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={formData.demographics.full_name}
              onChange={(e) => handleInputChange('demographics', 'full_name', e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gender
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={formData.demographics.gender}
              onChange={(e) => handleInputChange('demographics', 'gender', e.target.value)}
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Age
            </label>
            <input
              type="number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={formData.demographics.age}
              onChange={(e) => handleInputChange('demographics', 'age', e.target.value)}
            />
          </div>
        </div>
      </FormSection>

      {/* Medical History */}
      <FormSection title="Medical History" >
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {[
            { key: 'hypertension', label: 'Hypertension' },
            { key: 'diabetes', label: 'Diabetes' },
            { key: 'chronic_kidney_disease', label: 'CKD' },
            { key: 'asthma', label: 'Asthma' },
            { key: 'copd', label: 'COPD' },
            { key: 'cad', label: 'CAD' },
            { key: 'hyperkalemia', label: 'Hyperkalemia' },
            { key: 'pregnant', label: 'Pregnant' }
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
      </FormSection>

      {/* Physical Examination */}
      <FormSection title="Physical Examination" >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Systolic BP (mmHg) *
            </label>
            <input
              type="number"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={formData.physical_examination.systole}
              onChange={(e) => handleInputChange('physical_examination', 'systole', e.target.value)}
              placeholder="120"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Diastolic BP (mmHg) *
            </label>
            <input
              type="number"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={formData.physical_examination.diastole}
              onChange={(e) => handleInputChange('physical_examination', 'diastole', e.target.value)}
              placeholder="80"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Height (cm)
            </label>
            <input
              type="number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={formData.physical_examination.height}
              onChange={(e) => handleInputChange('physical_examination', 'height', e.target.value)}
              placeholder="170"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Weight (kg)
            </label>
            <input
              type="number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={formData.physical_examination.weight}
              onChange={(e) => handleInputChange('physical_examination', 'weight', e.target.value)}
              placeholder="70"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pulse (bpm)
            </label>
            <input
              type="number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={formData.physical_examination.pulse}
              onChange={(e) => handleInputChange('physical_examination', 'pulse', e.target.value)}
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={formData.physical_examination.temperature}
              onChange={(e) => handleInputChange('physical_examination', 'temperature', e.target.value)}
              placeholder="37.0"
            />
          </div>
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
      <FormSection title="Social History" >
        <div className="flex gap-6">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              checked={formData.social_history.tobacco_use}
              onChange={(e) => handleInputChange('social_history', 'tobacco_use', e.target.checked)}
            />
            <span className="text-sm text-gray-700">Tobacco Use</span>
          </label>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              checked={formData.social_history.alcohol_use}
              onChange={(e) => handleInputChange('social_history', 'alcohol_use', e.target.checked)}
            />
            <span className="text-sm text-gray-700">Alcohol Use</span>
          </label>
        </div>
      </FormSection>

      {/* Consultation */}
      <FormSection title="Consultation" >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Chief Complaint
          </label>
          <textarea
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            value={formData.consultation.chief_complaint}
            onChange={(e) => handleInputChange('consultation', 'chief_complaint', e.target.value)}
            placeholder="Describe the patient's main concerns..."
          />
        </div>
      </FormSection>

      {/* Submit Button */}
      <div className="flex justify-center pt-4">
        <button
          type="submit"
          disabled={loading || !formData.physical_examination.systole || !formData.physical_examination.diastole}
          className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-lg shadow-lg hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              Evaluating...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Get Clinical Recommendations
            </span>
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