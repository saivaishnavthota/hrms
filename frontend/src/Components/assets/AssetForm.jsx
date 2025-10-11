import React, { useContext, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { createAsset, updateAsset } from '../../api/assets';
import { getVendors } from '../../api/vendors';
import { ThemeContext } from '../../App';
import './Asset.css';

const assetSchema = zod.object({
  asset_name: zod.string().min(1, 'Asset name is required'),
  asset_tag: zod.string().min(1, 'Asset tag is required'),
  asset_type: zod.string().min(1, 'Asset type is required'),
  serial_number: zod.string().min(1, 'Serial number is required'),
  brand: zod.string().optional().nullable(),
  model: zod.string().optional().nullable(),
  model_no: zod.string().optional().nullable(),
  purchase_date: zod.string().optional().nullable(),
  eol_date: zod.string().optional().nullable(),
  amc_start_date: zod.string().optional().nullable(),
  amc_end_date: zod.string().optional().nullable(),
  purchase_price: zod.number().min(0).optional().nullable(),
  rental_cost: zod.number().min(0).optional().nullable(),
  vendor_id: zod.number().optional().nullable(),
  status: zod.enum(['In Stock', 'Allocated', 'Under Repair', 'Scrapped', 'Returned']),
  condition: zod.enum(['New', 'Good', 'Fair', 'Damaged']),
  operating_system: zod.string().optional().nullable(),
  ram: zod.string().optional().nullable(),
  hdd_capacity: zod.string().optional().nullable(),
  processor: zod.string().optional().nullable(),
  administrator: zod.string().optional().nullable(),
  additional_notes: zod.string().optional().nullable(),
});

export default function AssetForm({ onSuccess, initialData = null, mode = 'create' }) {
  const theme = useContext(ThemeContext);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(assetSchema),
    defaultValues: initialData || {
      asset_name: '',
      asset_tag: '',
      asset_type: '',
      serial_number: '',
      brand: null,
      model: null,
      model_no: null,
      purchase_date: null,
      eol_date: null,
      amc_start_date: null,
      amc_end_date: null,
      purchase_price: null,
      rental_cost: null,
      vendor_id: null,
      status: 'In Stock',
      condition: 'New',
      operating_system: null,
      ram: null,
      hdd_capacity: null,
      processor: null,
      administrator: null,
      additional_notes: null,
    },
  });

  const { data: vendors = [], isLoading: vendorsLoading, error: vendorsError } = useQuery({
    queryKey: ['vendors'],
    queryFn: getVendors,
  });

  const createMutation = useMutation({
    mutationFn: createAsset,
    onSuccess: (data) => {
      toast.success('Asset created successfully!');
      reset();
      onSuccess?.(data);
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.detail || 'Error creating asset';
      toast.error(errorMessage);
      console.error('Create error:', error.response?.data || error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => updateAsset(initialData.asset_id, data),
    onSuccess: (data) => {
      toast.success('Asset updated successfully!');
      reset();
      onSuccess?.(data);
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.detail || 'Error updating asset';
      toast.error(errorMessage);
      console.error('Update error:', error.response?.data || error);
    },
  });

  const [openSections, setOpenSections] = useState({
    basic: true,
    purchase: false,
    technical: false,
  });

  const toggleSection = (section) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const onSubmit = (data) => {
    const formattedData = {
      asset_name: data.asset_name,
      asset_tag: data.asset_tag,
      asset_type: data.asset_type,
      serial_number: data.serial_number,
      brand: data.brand || null,
      model: data.model || null,
      model_no: data.model_no || null,
      purchase_date: data.purchase_date || null,
      eol_date: data.eol_date || null,
      amc_start_date: data.amc_start_date || null,
      amc_end_date: data.amc_end_date || null,
      purchase_price: data.purchase_price ?? null,
      rental_cost: data.rental_cost ?? null,
      vendor_id: data.vendor_id ? parseInt(data.vendor_id) : null,
      status: data.status,
      condition: data.condition,
      operating_system: data.operating_system || null,
      ram: data.ram || null,
      hdd_capacity: data.hdd_capacity || null,
      processor: data.processor || null,
      administrator: data.administrator || null,
      additional_notes: data.additional_notes || null,
    };

    console.log('Submitting data:', formattedData, 'Mode:', mode, 'Initial Data:', initialData);

    if (mode === 'create') {
      createMutation.mutate(formattedData);
    } else {
      if (!initialData?.asset_id) {
        toast.error('Cannot update: Missing asset ID');
        console.error('Missing asset_id in initialData:', initialData);
        return;
      }
      updateMutation.mutate(formattedData);
    }
  };

  // Debug vendors data
  console.log('Vendors:', vendors);
  console.log('Initial Data:', initialData);

  if (vendorsLoading) return <div className="loading-spinner">Loading Vendors...</div>;
  if (vendorsError) {
    const errorMessage = vendorsError?.response?.data?.detail || 'Error loading vendors';
    toast.error(errorMessage);
    console.error('Vendors error:', vendorsError);
    return <div>Error loading vendors: {errorMessage}</div>;
  }

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Basic Section */}
        <div className="collapsible-section">
          <div className="collapsible-header" onClick={() => toggleSection('basic')}>
            <span>Basic Information</span>
            <span>{openSections.basic ? '−' : '+'}</span>
          </div>
          <div className={`collapsible-content ${openSections.basic ? 'open' : ''}`}>
            {['asset_name', 'asset_tag', 'asset_type', 'serial_number'].map((field) => (
              <div className="form-group" key={field}>
                <label htmlFor={field}>{field.replace('_', ' ').toUpperCase()} *</label>
                <input
                  {...register(field)}
                  id={field}
                  placeholder={`Enter ${field.replace('_', ' ')}`}
                  className={errors[field] ? 'error' : ''}
                />
                {errors[field] && <span className="error">{errors[field]?.message}</span>}
              </div>
            ))}

            <div className="form-group">
              <label htmlFor="status">Status *</label>
              <select {...register('status')} id="status" className={errors.status ? 'error' : ''}>
                {['In Stock', 'Allocated', 'Under Repair', 'Scrapped', 'Returned'].map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              {errors.status && <span className="error">{errors.status.message}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="condition">Condition *</label>
              <select {...register('condition')} id="condition" className={errors.condition ? 'error' : ''}>
                {['New', 'Good', 'Fair', 'Damaged'].map((cond) => (
                  <option key={cond} value={cond}>{cond}</option>
                ))}
              </select>
              {errors.condition && <span className="error">{errors.condition.message}</span>}
            </div>
          </div>
        </div>

        {/* Purchase Section */}
        <div className="collapsible-section">
          <div className="collapsible-header" onClick={() => toggleSection('purchase')}>
            <span>Purchase Details</span>
            <span>{openSections.purchase ? '−' : '+'}</span>
          </div>
          <div className={`collapsible-content ${openSections.purchase ? 'open' : ''}`}>
            {['brand', 'model', 'model_no', 'purchase_date', 'eol_date', 'amc_start_date', 'amc_end_date', 'purchase_price', 'rental_cost'].map((field) => (
              <div className="form-group" key={field}>
                <label htmlFor={field}>{field.replace('_', ' ').toUpperCase()}</label>
                <input
                  {...register(field, field.includes('price') || field.includes('cost') ? { valueAsNumber: true } : {})}
                  id={field}
                  type={field.includes('date') ? 'date' : field.includes('price') || field.includes('cost') ? 'number' : 'text'}
                  placeholder={`Enter ${field.replace('_', ' ')}`}
                />
              </div>
            ))}

            <div className="form-group">
              <label htmlFor="vendor_id">Vendor</label>
              <select {...register('vendor_id', { valueAsNumber: true })} id="vendor_id">
                <option value="">Select Vendor</option>
                {vendors.map(v => (
                  <option key={v.vendor_id} value={v.vendor_id}>{v.vendor_name || 'Unknown Vendor'}</option>
                ))}
              </select>
              {vendors.length === 0 && <span className="error">No vendors available</span>}
            </div>
          </div>
        </div>

        {/* Technical Section */}
        <div className="collapsible-section">
          <div className="collapsible-header" onClick={() => toggleSection('technical')}>
            <span>Technical Specifications</span>
            <span>{openSections.technical ? '−' : '+'}</span>
          </div>
          <div className={`collapsible-content ${openSections.technical ? 'open' : ''}`}>
            {['operating_system', 'ram', 'hdd_capacity', 'processor', 'administrator', 'additional_notes'].map((field) => (
              <div className={`form-group ${field === 'additional_notes' ? 'full-width' : ''}`} key={field}>
                <label htmlFor={field}>{field.replace('_', ' ').toUpperCase()}</label>
                <input
                  {...register(field)}
                  id={field}
                  placeholder={`Enter ${field.replace('_', ' ')}`}
                />
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={createMutation.isLoading || updateMutation.isLoading}
        >
          {(createMutation.isLoading || updateMutation.isLoading)
            ? 'Processing...'
            : mode === 'create' ? 'Add Asset' : 'Update Asset'}
        </button>
      </form>
    </div>
  );
}