import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const EditEmployeeModal = ({ isOpen, onClose, employee, onSave }) => {
  const [formData, setFormData] = useState({
    employee: '',
    type: '',
    role: '',
    sickLeave: 0,
    casualLeave: 0,
    annualLeave: 0,
    maternityLeave: 0,
    paternityLeave: 0
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (employee) {
      setFormData({
        employee: employee.employee || '',
        type: employee.type || '',
        role: employee.role || '',
        sickLeave: employee.sickLeave || 0,
        casualLeave: employee.casualLeave || 0,
        annualLeave: employee.annualLeave || 0,
        maternityLeave: employee.maternityLeave || 0,
        paternityLeave: employee.paternityLeave || 0
      });
      setErrors({});
    }
  }, [employee]);

  const handleInputChange = (field, value) => {
    const numericValue = parseInt(value) || 0;
    setFormData(prev => ({
      ...prev,
      [field]: numericValue
    }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (formData.sickLeave < 0) {
      newErrors.sickLeave = 'Sick leave cannot be negative';
    }
    if (formData.casualLeave < 0) {
      newErrors.casualLeave = 'Casual leave cannot be negative';
    }
    if (formData.annualLeave < 0) {
      newErrors.annualLeave = 'Annual leave cannot be negative';
    }
    if (formData.maternityLeave < 0) {
      newErrors.maternityLeave = 'Maternity leave cannot be negative';
    }
    if (formData.paternityLeave < 0) {
      newErrors.paternityLeave = 'Paternity leave cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave({
        ...employee,
        ...formData
      });
      onClose();
    }
  };

  const handleCancel = () => {
    setFormData({
      employee: '',
      type: '',
      role: '',
      sickLeave: 0,
      casualLeave: 0,
      annualLeave: 0,
      maternityLeave: 0,
      paternityLeave: 0
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-transparent backdrop-blur-[2px] flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-white via-gray-50 to-blue-50 rounded-xl shadow-2xl border border-gray-200 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Edit Employee Leave Balance</h2>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-4">
          {/* Employee Name - Read Only */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Employee
            </label>
            <input
              type="text"
              value={formData.employee}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
            />
          </div>

          {/* Type - Read Only */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <input
              type="text"
              value={formData.type}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
            />
          </div>

          {/* Role - Read Only */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <input
              type="text"
              value={formData.role}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
            />
          </div>

          {/* Sick Leave - Editable */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sick Leave
            </label>
            <input
              type="number"
              min="0"
              value={formData.sickLeave}
              onChange={(e) => handleInputChange('sickLeave', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.sickLeave ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.sickLeave && (
              <p className="mt-1 text-sm text-red-600">{errors.sickLeave}</p>
            )}
          </div>

          {/* Casual Leave - Editable */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Casual Leave
            </label>
            <input
              type="number"
              min="0"
              value={formData.casualLeave}
              onChange={(e) => handleInputChange('casualLeave', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.casualLeave ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.casualLeave && (
              <p className="mt-1 text-sm text-red-600">{errors.casualLeave}</p>
            )}
          </div>

          {/* Annual/Earned Leave - Editable */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Annual/Earned Leave
            </label>
            <input
              type="number"
              min="0"
              value={formData.annualLeave}
              onChange={(e) => handleInputChange('annualLeave', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.annualLeave ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.annualLeave && (
              <p className="mt-1 text-sm text-red-600">{errors.annualLeave}</p>
            )}
          </div>

          {/* Maternity Leave - Editable */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Maternity Leave
            </label>
            <input
              type="number"
              min="0"
              value={formData.maternityLeave}
              onChange={(e) => handleInputChange('maternityLeave', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.maternityLeave ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.maternityLeave && (
              <p className="mt-1 text-sm text-red-600">{errors.maternityLeave}</p>
            )}
          </div>

          {/* Paternity Leave - Editable */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Paternity Leave
            </label>
            <input
              type="number"
              min="0"
              value={formData.paternityLeave}
              onChange={(e) => handleInputChange('paternityLeave', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.paternityLeave ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.paternityLeave && (
              <p className="mt-1 text-sm text-red-600">{errors.paternityLeave}</p>
            )}
          </div>
        </div>

        {/* Footer with Save and Cancel buttons */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditEmployeeModal;