import React, { useContext, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { createAllocation, updateAllocation } from '../../api/allocations';
import { getAssets } from '../../api/assets';
import { getEmployees } from '../../api/employees';
import { ThemeContext } from '../../App';
import './Allocation.css';

const allocationSchema = zod.object({
  asset_id: zod.number().min(1, 'Asset is required'),
  employee_id: zod.number().min(1, 'Employee is required'),
  allocation_date: zod.string().min(1, 'Allocation date is required'),
  expected_return_date: zod.string().optional().or(zod.literal('')).nullable(),
  actual_return_date: zod.string().optional().or(zod.literal('')).nullable(),
  condition_at_allocation: zod.string().optional().or(zod.literal('')).nullable(),
  condition_at_return: zod.string().optional().or(zod.literal('')).nullable(),
  employee_ack: zod.boolean().optional(),
  notes: zod.string().optional().or(zod.literal('')).nullable(),
});

export default function AllocationForm({ onSuccess, initialData = null, mode = 'create' }) {
  const theme = useContext(ThemeContext);
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(allocationSchema),
    defaultValues: initialData || {
      asset_id: '',
      employee_id: '',
      allocation_date: new Date().toISOString().split('T')[0],
      expected_return_date: null,
      actual_return_date: null,
      condition_at_allocation: null,
      condition_at_return: null,
      employee_ack: false,
      notes: null,
    },
  });

  const { data: assets = [], isLoading: assetsLoading, error: assetsError } = useQuery({
    queryKey: ['assets'],
    queryFn: getAssets,
  });

  const { data: employees = [], isLoading: employeesLoading, error: employeesError } = useQuery({
    queryKey: ['employees'],
    queryFn: getEmployees,
  });

  const createMutation = useMutation({
    mutationFn: createAllocation,
    onSuccess: (data) => {
      toast.success('Allocation created successfully!');
      reset();
      onSuccess(data);
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.detail || 'Error creating allocation';
      toast.error(errorMessage);
      console.error('Create error:', error.response?.data || error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ allocation_id, ...data }) => updateAllocation(allocation_id, data),
    onSuccess: (data) => {
      toast.success('Allocation updated successfully!');
      reset();
      onSuccess(data);
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.detail || error.message || 'Error updating allocation';
      toast.error(errorMessage);
      console.error('Update error:', error.response?.data || error);
    },
  });

  const [openSections, setOpenSections] = useState({
    basic: true,
    additional: false,
  });

  const toggleSection = (section) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const onSubmit = (data) => {
    const formattedData = {
      asset_id: parseInt(data.asset_id),
      employee_id: parseInt(data.employee_id),
      allocation_date: data.allocation_date || new Date().toISOString().split('T')[0],
      expected_return_date: data.expected_return_date || null,
      actual_return_date: data.actual_return_date || null,
      condition_at_allocation: data.condition_at_allocation || null,
      condition_at_return: data.condition_at_return || null,
      employee_ack: data.employee_ack || false,
      notes: data.notes || null,
    };

    console.log('Submitting data:', formattedData, 'Mode:', mode, 'Initial Data:', initialData);

    if (mode === 'create') {
      createMutation.mutate(formattedData);
    } else {
      if (!initialData?.allocation_id) {
        toast.error('Missing allocation ID for update');
        console.error('Missing allocation_id in initialData:', initialData);
        return;
      }
      updateMutation.mutate({
        allocation_id: parseInt(initialData.allocation_id),
        ...formattedData,
      });
    }
  };

  // Debug data
  console.log('Employees:', employees);
  console.log('Assets:', assets);
  console.log('Initial Data:', initialData);

  if (assetsLoading || employeesLoading) return <div className="loading-spinner">Loading...</div>;

  if (assetsError || employeesError) {
    const errorMessage = assetsError?.response?.data?.detail || employeesError?.response?.data?.detail || 'Error loading data';
    toast.error(errorMessage);
    console.error('Data error:', assetsError || employeesError);
    return <div>Error loading assets or employees: {errorMessage}</div>;
  }

  return (
    <div className="form-container allocation-form">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="collapsible-section">
          <div className="collapsible-header" onClick={() => toggleSection('basic')}>
            <span>Basic Information</span>
            <span>{openSections.basic ? '−' : '+'}</span>
          </div>
          <div className={`collapsible-content ${openSections.basic ? 'open' : ''}`}>
            <div className="form-group">
              <label htmlFor="asset_id">Asset *</label>
              <select
                {...register('asset_id', { valueAsNumber: true })}
                id="asset_id"
                className={errors.asset_id ? 'error' : ''}
              >
                <option value="">Select Asset</option>
                {assets.map(a => (
                  <option key={a.asset_id} value={a.asset_id}>{a.asset_name || 'Unknown Asset'}</option>
                ))}
              </select>
              {errors.asset_id && <span className="error">{errors.asset_id.message}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="employee_id">Employee *</label>
              <select
                {...register('employee_id', { valueAsNumber: true })}
                id="employee_id"
                className={errors.employee_id ? 'error' : ''}
              >
                <option value="">Select Employee</option>
                {employees.map(e => (
                  <option key={e.id || e.employee_id} value={e.id || e.employee_id}>
                    {e.name || e.employee_name || 'Unknown Employee'}
                  </option>
                ))}
              </select>
              {errors.employee_id && <span className="error">{errors.employee_id.message}</span>}
              {employees.length === 0 && <span className="error">No employees available</span>}
            </div>
            <div className="form-group">
              <label htmlFor="allocation_date">Allocation Date *</label>
              <input
                type="date"
                {...register('allocation_date')}
                id="allocation_date"
                className={errors.allocation_date ? 'error' : ''}
              />
              {errors.allocation_date && <span className="error">{errors.allocation_date.message}</span>}
            </div>
          </div>
        </div>
        <div className="collapsible-section">
          <div className="collapsible-header" onClick={() => toggleSection('additional')}>
            <span>Additional Details</span>
            <span>{openSections.additional ? '−' : '+'}</span>
          </div>
          <div className={`collapsible-content ${openSections.additional ? 'open' : ''}`}>
            <div className="form-group">
              <label htmlFor="expected_return_date">Expected Return Date</label>
              <input
                type="date"
                {...register('expected_return_date')}
                id="expected_return_date"
              />
            </div>
            <div className="form-group">
              <label htmlFor="actual_return_date">Actual Return Date</label>
              <input
                type="date"
                {...register('actual_return_date')}
                id="actual_return_date"
              />
            </div>
            <div className="form-group">
              <label htmlFor="condition_at_allocation">Condition at Allocation</label>
              <select {...register('condition_at_allocation')}>
                <option value="">Select Condition</option>
                <option value="New">New</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Damaged">Damaged</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="condition_at_return">Condition at Return</label>
              <select {...register('condition_at_return')}>
                <option value="">Select Condition</option>
                <option value="New">New</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Damaged">Damaged</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="employee_ack">Employee Acknowledgment</label>
              <input
                type="checkbox"
                {...register('employee_ack')}
                id="employee_ack"
              />
            </div>
            <div className="form-group full-width">
              <label htmlFor="notes">Notes</label>
              <input
                {...register('notes')}
                id="notes"
                placeholder="Enter notes"
              />
            </div>
          </div>
        </div>
        <button
          type="submit"
          disabled={createMutation.isLoading || updateMutation.isLoading}
        >
          {(createMutation.isLoading || updateMutation.isLoading)
            ? 'Processing...'
            : mode === 'create' ? 'Add Allocation' : 'Update Allocation'}
        </button>
      </form>
    </div>
  );
}