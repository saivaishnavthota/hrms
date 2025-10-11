import React, { useContext, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { createEmployee, updateEmployee } from '../../api/employees';
import { ThemeContext } from '../../App';
import './Employee.css';

const employeeSchema = zod.object({
  name: zod.string().min(1, 'Name is required'),
  email: zod.string().email('Invalid email address').optional().or(zod.literal('')),
  role: zod.string().optional(),
});

export default function EmployeeForm({ onSuccess, initialData = null, mode = 'create' }) {
  const theme = useContext(ThemeContext);
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(employeeSchema),
    defaultValues: initialData || {
      name: '',
      email: '',
      role: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: createEmployee,
    onSuccess: (data) => {
      toast.success('Employee created successfully!');
      reset();
      onSuccess(data);
    },
    onError: (error) => toast.error(error.response?.data?.detail || 'Error creating employee'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }) => updateEmployee(id, data),
    onSuccess: (data) => {
      toast.success('Employee updated successfully!');
      reset();
      onSuccess(data);
    },
    onError: (error) => toast.error(error.response?.data?.detail || 'Error updating employee'),
  });

  const [openSections, setOpenSections] = useState({
    basic: true,
  });

  const toggleSection = (section) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const onSubmit = (data) => {
    if (mode === 'create') {
      createMutation.mutate(data);
    } else {
      updateMutation.mutate({ ...data, id: initialData.id });
    }
  };

  return (
    <div className="form-container employee-form">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="collapsible-section">
          <div className="collapsible-header" onClick={() => toggleSection('basic')}>
            <span>Basic Information</span>
            <span>{openSections.basic ? '−' : '+'}</span>
          </div>
          <div className={`collapsible-content ${openSections.basic ? 'open' : ''}`}>
            <div className="form-group">
              <label htmlFor="name">Name *</label>
              <input
                {...register('name')}
                id="name"
                placeholder="Enter name"
                className={errors.name ? 'error' : ''}
              />
              {errors.name && <span className="error">{errors.name.message}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                {...register('email')}
                id="email"
                placeholder="Enter email"
                className={errors.email ? 'error' : ''}
              />
              {errors.email && <span className="error">{errors.email.message}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="role">Role</label>
              <input
                {...register('role')}
                id="role"
                placeholder="Enter role"
              />
            </div>
          </div>
        </div>
        <button type="submit">{mode === 'create' ? 'Add Employee' : 'Update Employee'}</button>
      </form>
    </div>
  );
}