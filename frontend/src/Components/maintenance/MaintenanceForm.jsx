import React, { useContext, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { createMaintenance, updateMaintenance } from '../../api/maintenance';
import { getAssets } from '../../api/assets';
import { getVendors } from '../../api/vendors';
import { ThemeContext } from '../../App';
import './Maintenance.css';

const maintenanceSchema = zod.object({
  asset_id: zod.number().min(1, 'Asset is required'),
  maintenance_type: zod.enum(['Warranty', 'AMC', 'Repair'], { message: 'Invalid maintenance type' }),
  start_date: zod.string().min(1, 'Start date is required'),
  end_date: zod.string().optional().or(zod.literal('')),
  vendor_id: zod.number().optional().or(zod.literal('')),
  cost: zod.number().min(0, 'Cost cannot be negative').optional().or(zod.literal('')),
  notes: zod.string().optional(),
});

export default function MaintenanceForm({ onSuccess, initialData = null, mode = 'create' }) {
  const theme = useContext(ThemeContext);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: initialData || {
      asset_id: '',
      maintenance_type: 'Warranty',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      vendor_id: '',
      cost: '',
      notes: '',
    },
  });

  const { data: assets = [], isLoading: assetsLoading } = useQuery({
    queryKey: ['assets'],
    queryFn: getAssets,
  });

  const { data: vendors = [], isLoading: vendorsLoading } = useQuery({
    queryKey: ['vendors'],
    queryFn: getVendors,
  });

  const createMutation = useMutation({
    mutationFn: createMaintenance,
    onSuccess: (data) => {
      toast.success('Maintenance record created successfully!');
      reset();
      onSuccess?.(data);
    },
    onError: (error) => toast.error(error.response?.data?.detail || 'Error creating maintenance record'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ maintenance_id, ...data }) => updateMaintenance(maintenance_id, data),
    onSuccess: (data) => {
      toast.success('Maintenance record updated successfully!');
      reset();
      onSuccess?.(data);
    },
    onError: (error) => toast.error(error.response?.data?.detail || 'Error updating maintenance record'),
  });

  const [openSections, setOpenSections] = useState({
    basic: true,
    additional: false,
  });

  const toggleSection = (section) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const onSubmit = (data) => {
    // Format data to match backend schema
    const formattedData = {
      asset_id: Number(data.asset_id),
      maintenance_type: data.maintenance_type,
      start_date: data.start_date || new Date().toISOString().split('T')[0],
      end_date: data.end_date || null,
      vendor_id: data.vendor_id ? Number(data.vendor_id) : 0,
      cost: data.cost ? Number(data.cost) : 0,
      notes: data.notes || '',
    };

    if (mode === 'create') {
      createMutation.mutate(formattedData);
    } else {
      updateMutation.mutate({
        maintenance_id: Number(initialData.maintenance_id),
        ...formattedData,
      });
    }
  };

  if (assetsLoading || vendorsLoading) return <div className="loading-spinner">Loading...</div>;

  const isLoading = createMutation.isLoading || updateMutation.isLoading;

  return (
    <div className="form-container maintenance-form">
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Basic Section */}
        <div className="collapsible-section">
          <div className="collapsible-header" onClick={() => toggleSection('basic')}>
            <span>Basic Information</span>
            <span>{openSections.basic ? '−' : '+'}</span>
          </div>
          <div className={`collapsible-content ${openSections.basic ? 'open' : ''}`}>
            <div className="form-group">
              <label htmlFor="asset_id">Asset *</label>
              <select {...register('asset_id', { valueAsNumber: true })} id="asset_id" className={errors.asset_id ? 'error' : ''}>
                <option value="">Select Asset</option>
                {assets.map(a => (
                  <option key={a.asset_id} value={a.asset_id}>{a.asset_name}</option>
                ))}
              </select>
              {errors.asset_id && <span className="error">{errors.asset_id.message}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="maintenance_type">Maintenance Type *</label>
              <select {...register('maintenance_type')} id="maintenance_type" className={errors.maintenance_type ? 'error' : ''}>
                <option value="Warranty">Warranty</option>
                <option value="AMC">AMC</option>
                <option value="Repair">Repair</option>
              </select>
              {errors.maintenance_type && <span className="error">{errors.maintenance_type.message}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="start_date">Start Date *</label>
              <input type="date" {...register('start_date')} id="start_date" className={errors.start_date ? 'error' : ''} />
              {errors.start_date && <span className="error">{errors.start_date.message}</span>}
            </div>
          </div>
        </div>

        {/* Additional Section */}
        <div className="collapsible-section">
          <div className="collapsible-header" onClick={() => toggleSection('additional')}>
            <span>Additional Details</span>
            <span>{openSections.additional ? '−' : '+'}</span>
          </div>
          <div className={`collapsible-content ${openSections.additional ? 'open' : ''}`}>
            <div className="form-group">
              <label htmlFor="vendor_id">Vendor (Optional)</label>
              <select {...register('vendor_id', { valueAsNumber: true })} id="vendor_id">
                <option value="">Select Vendor</option>
                {vendors.map(v => (
                  <option key={v.vendor_id} value={v.vendor_id}>{v.vendor_name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="end_date">End Date (Optional)</label>
              <input type="date" {...register('end_date')} id="end_date" />
            </div>

            <div className="form-group">
              <label htmlFor="cost">Cost (Optional)</label>
              <input type="number" step="0.01" {...register('cost')} id="cost" placeholder="Enter cost" />
            </div>

            <div className="form-group full-width">
              <label htmlFor="notes">Notes (Optional)</label>
              <textarea {...register('notes')} id="notes" rows="4" placeholder="Enter notes" />
            </div>
          </div>
        </div>

        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Processing...' : mode === 'create' ? 'Add Maintenance' : 'Update Maintenance'}
        </button>
      </form>
    </div>
  );
}