import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Building, Users, GraduationCap, Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '@/lib/api';
import { useUser } from '../../contexts/UserContext';
import OnboardingHeader from './OnboardingHeader';
import OnboardingFooter from './OnboardingFooter';

export default function NewUserDetails() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [formData, setFormData] = useState({
    employee_id: '',
    full_name: '',
    contact_no: '',
    personal_email: '',
    dob: '',
    address: '',
    gender: '',
    graduation_year: 0,
    work_experience_years: 0,
    emergency_contact_name: '',
    emergency_contact_number: '',
    emergency_contact_relation: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Auto-populate email from login response and fetch other user details
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        // First, populate email from login response if available
        if (user?.email) {
          setFormData(prev => ({
            ...prev,
            personal_email: user.email,
            employee_id: user.employeeId || 0
          }));
        }

        // Then try to fetch additional details from backend
        const employee_id = user?.employeeId || 0;
        if (employee_id) {
          const response = await api.get(`/onboarding/details/${employee_id}`);
          if (response.data && response.data.status === 'success' && response.data.data) {
            const backendData = response.data.data;
            setFormData(prev => ({
              ...prev,
              full_name: backendData.full_name || prev.full_name,
              contact_no: backendData.contact_no || prev.contact_no,
              personal_email: user?.email || backendData.personal_email || prev.personal_email,
              doj: backendData.doj || prev.doj,
              dob: backendData.dob || prev.dob,
              address: backendData.address || prev.address,
              gender: backendData.gender || prev.gender,
              graduation_year: backendData.graduation_year || prev.graduation_year,
              work_experience_years: backendData.work_experience_years || prev.work_experience_years,
              emergency_contact_name: backendData.emergency_contact_name || prev.emergency_contact_name,
              emergency_contact_number: backendData.emergency_contact_number || prev.emergency_contact_number,
              emergency_contact_relation: backendData.emergency_contact_relation || prev.emergency_contact_relation,
              employee_id: backendData.employee_id || prev.employee_id
            }));
            // Only show toast if we actually loaded data from backend
            
          }
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
        // Only show error toast if it's not a 404 (no data found)
        if (error.response?.status !== 404) {
          toast.error('Failed to load user details');
        }
        
        // Fallback: at least set email from login response
        if (user?.email) {
          setFormData(prev => ({
            ...prev,
            personal_email: user.email,
            employee_id: user.employeeId || 0
          }));
        }
      }
    };

    if (user?.employeeId) {
      fetchUserDetails();
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Handle Full Name capitalization
    if (name === 'fullName') {
      const capitalizedValue = value.charAt(0).toUpperCase() + value.slice(1);
      setFormData(prev => ({
        ...prev,
        [name]: capitalizedValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Full Name validation
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    } else if (!/^[A-Z]/.test(formData.full_name)) {
      newErrors.full_name = 'Full name must start with a capital letter';
    }

    
    // Contact Number validation
    if (!formData.contact_no.trim()) {
      newErrors.contact_no = 'Contact number is required';
    }

    // Gender validation
    if (!formData.gender.trim()) {
      newErrors.gender = 'Gender is required';
    }

    // Date of Birth validation
    if (!formData.dob) {
      newErrors.dob = 'Date of birth is required';
    } else {
      // Calculate age
      const birthDate = new Date(formData.dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      // Adjust age if birthday hasn't occurred this year yet
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      // Validate age is at least 18
      if (age < 18) {
        newErrors.dob = 'You must be at least 18 years old';
      }
    }

    // Latest Graduation Year validation
    if (!formData.graduation_year) {
      newErrors.graduation_year = 'Latest graduation year is required';
    }

    // Emergency Contact Name validation
    if (!formData.emergency_contact_name.trim()) {
      newErrors.emergency_contact_name = 'Emergency contact name is required';
    }

    // Emergency Contact Number validation
    if (!formData.emergency_contact_number.trim()) {
      newErrors.emergency_contact_number = 'Emergency contact number is required';
    } else if (formData.emergency_contact_number === formData.contact_no) {
      newErrors.emergency_contact_number = 'Emergency contact number should not be same as contact number';
    }

    // Relationship validation
    if (!formData.emergency_contact_relation.trim()) {
      newErrors.emergency_contact_relation = 'Relationship is required';
    }

    // Address validation
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    
    try {
      // POST request to save user details as draft
      const response = await api.post("/onboarding/details", {
        ...formData,
        is_draft: true
      });
      
      if (response.data) {
        toast.success('Draft saved successfully!');
      }
      
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('Failed to save draft. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // POST request to save user details
      const response = await api.post("/onboarding/details", formData);
      
      if (response.data) {
        toast.success('User details saved successfully!');
        
        // Set completion state to disable form
        setIsCompleted(true);
        
        // Navigate to document upload page after a short delay
        setTimeout(() => {
          navigate('/upload-documents');
        }, 1500);
      }
      
    } catch (error) {
      console.error('Error saving user details:', error);
      toast.error('Failed to save user details. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-hidden">
      <OnboardingHeader />
      <div className="pt-16 pb-4 px-4 w-full flex justify-center h-full">
        <div style={{width: '900px'}} className="my-6 mb-12 p-6 bg-white rounded-xl shadow-xl border border-gray-100 overflow-y-auto max-h-full">
          <div className="mb-4">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-black-600 to-balck-600 bg-clip-text text-transparent mb-2">
              Onboarding Employee Details
            </h2>
            <p className="text-gray-600">Please fill the details below</p>
          </div>

      <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Full Name */}
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                disabled={isCompleted}
                className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.full_name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  } ${isCompleted ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                placeholder="Enter full name"
              />
            </div>
            {errors.full_name && (
              <p className="text-red-500 text-sm mt-1">{errors.full_name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="email"
                name="personal_email"
                value={formData.personal_email}
                onChange={handleInputChange}
                disabled={isCompleted}
                className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.personal_email ? 'border-red-500 bg-red-50' : 'border-gray-300'
                } ${isCompleted ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                placeholder="Enter email"
              />
            </div>
            {errors.personal_email && (
              <p className="text-red-500 text-sm mt-1">{errors.personal_email}</p>
            )}
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Of Birth <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleInputChange}
                disabled={isCompleted}
                max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.dob ? 'border-red-500 bg-red-50' : 'border-gray-300'
                } ${isCompleted ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              />
            </div>
            {errors.dob && (
              <p className="text-red-500 text-sm mt-1">{errors.dob}</p>
            )}
          </div>

          {/* Contact Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="tel"
                name="contact_no"
                value={formData.contact_no}
                onChange={handleInputChange}
                disabled={isCompleted}
                className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.contact_no ? 'border-red-500 bg-red-50' : 'border-gray-300'
                } ${isCompleted ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                placeholder="Enter contact number"
              />
            </div>
            {errors.contact_no && (
              <p className="text-red-500 text-sm mt-1">{errors.contact_no}</p>
            )}
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gender <span className="text-red-500">*</span>
            </label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
              disabled={isCompleted}
              className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.gender ? 'border-red-500 bg-red-50' : 'border-gray-300'
              } ${isCompleted ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            >
              <option value="">-- Gender --</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            {errors.gender && (
              <p className="text-red-500 text-sm mt-1">{errors.gender}</p>
            )}
          </div>

          {/* Latest Graduation Year */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Latest Graduation Year <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="number"
                name="graduation_year"
                value={formData.graduation_year}
                onChange={handleInputChange}
                disabled={isCompleted}
                className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.graduation_year ? 'border-red-500 bg-red-50' : 'border-gray-300'
                } ${isCompleted ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                placeholder="Enter graduation year"
                min="1950"
                max="2030"
              />
            </div>
            {errors.graduation_year && (
              <p className="text-red-500 text-sm mt-1">{errors.graduation_year}</p>
            )}
          </div>

          {/* Work Experience */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Work Experience (years)
            </label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
               <input
                type="number"
                name="work_experience_years"
                value={formData.work_experience_years}
                onChange={handleInputChange}
                disabled={isCompleted}
                className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.work_experience_years ? 'border-red-500 bg-red-50' : 'border-gray-300'
                } ${isCompleted ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                placeholder="Enter work experience (years)"
                />
            </div>
          </div>

          {/* Emergency Contact Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Emergency Contact Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                name="emergency_contact_name"
                value={formData.emergency_contact_name}
                onChange={handleInputChange}
                disabled={isCompleted}
                className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.emergency_contact_name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                } ${isCompleted ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                placeholder="Enter emergency contact name"
              />
            </div>
            {errors.emergency_contact_name && (
              <p className="text-red-500 text-sm mt-1">{errors.emergency_contact_name}</p>
            )}
          </div>

          {/* Emergency Contact Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Emergency Contact Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="tel"
                name="emergency_contact_number"
                value={formData.emergency_contact_number}
                onChange={handleInputChange}
                disabled={isCompleted}
                className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.emergency_contact_number ? 'border-red-500 bg-red-50' : 'border-gray-300'
                } ${isCompleted ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                placeholder="Enter emergency contact number"
              />
            </div>
            {errors.emergency_contact_number && (
              <p className="text-red-500 text-sm mt-1">{errors.emergency_contact_number}</p>
            )}
          </div>

          {/* Relationship */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Relationship <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                name="emergency_contact_relation"
                value={formData.emergency_contact_relation}
                onChange={handleInputChange}
                disabled={isCompleted}
                className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.emergency_contact_relation ? 'border-red-500 bg-red-50' : 'border-gray-300'
                } ${isCompleted ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                placeholder="Enter relationship"
              />
            </div>
            {errors.emergency_contact_relation && (
              <p className="text-red-500 text-sm mt-1">{errors.emergency_contact_relation}</p>
            )}
          </div>

          {/* Address */}
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                disabled={isCompleted}
                rows="3"
                className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.address ? 'border-red-500 bg-red-50' : 'border-gray-300'
                } ${isCompleted ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                placeholder="Enter full address"
              />
            </div>
            {errors.address && (
              <p className="text-red-500 text-sm mt-1">{errors.address}</p>
            )}
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200 mt-4">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isCompleted}
            className={`px-8 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200 font-medium ${
              isCompleted ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            Save Draft
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isCompleted}
            className={`px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg ${
              isCompleted ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? 'Uploading...' : isCompleted ? 'Completed' : 'Documents Upload'}
          </button>
        </div>
      </form>
        </div>
      </div>
      <OnboardingFooter />
    </div>
  );
}