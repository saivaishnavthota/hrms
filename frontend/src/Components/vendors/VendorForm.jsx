import React, { useContext, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { createVendor, updateVendor } from '../../api/vendors';
import { ThemeContext } from '../../App';
import './Vendor.css';

const vendorSchema = zod.object({
  vendor_name: zod.string().min(1, 'Vendor name is required'),
  vendor_type: zod.enum(['Purchased', 'Rental']),
  contact_email: zod.string().email('Invalid email address').optional().or(zod.literal('')),
  contact_phone: zod.string().optional(),
  payment_terms: zod.string().optional(),
});

export default function VendorForm({ onSuccess, initialData = null, mode = 'create' }) {
  const theme = useContext(ThemeContext);
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(vendorSchema),
    defaultValues: initialData || {
      vendor_name: '',
      vendor_type: 'Purchased',
      contact_email: '',
      contact_phone: '',
      payment_terms: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: createVendor,
    onSuccess: (data) => {
      toast.success('Vendor created successfully!');
      reset();
      onSuccess(data);
    },
    onError: (error) => toast.error(error.response?.data?.detail || 'Error creating vendor'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ vendor_id, ...data }) => updateVendor(vendor_id, data),
    onSuccess: (data) => {
      toast.success('Vendor updated successfully!');
      reset();
      onSuccess(data);
    },
    onError: (error) => toast.error(error.response?.data?.detail || 'Error updating vendor'),
  });

  const [openSections, setOpenSections] = useState({
    basic: true,
    contact: false,
  });

  const toggleSection = (section) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const onSubmit = (data) => {
    if (mode === 'create') {
      createMutation.mutate(data);
    } else {
      updateMutation.mutate({ ...data, vendor_id: initialData.vendor_id });
    }
  };

  return (
    <div className="form-container vendor-form">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="collapsible-section">
          <div className="collapsible-header" onClick={() => toggleSection('basic')}>
            <span>Basic Information</span>
            <span>{openSections.basic ? '−' : '+'}</span>
          </div>
          <div className={`collapsible-content ${openSections.basic ? 'open' : ''}`}>
            <div className="form-group">
              <label htmlFor="vendor_name">Vendor Name *</label>
              <input
                {...register('vendor_name')}
                id="vendor_name"
                placeholder="Enter vendor name"
                className={errors.vendor_name ? 'error' : ''}
              />
              {errors.vendor_name && <span className="error">{errors.vendor_name.message}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="vendor_type">Vendor Type *</label>
              <select
                {...register('vendor_type')}
                id="vendor_type"
                className={errors.vendor_type ? 'error' : ''}
              >
                <option value="Purchased">Purchased</option>
                <option value="Rental">Rental</option>
              </select>
              {errors.vendor_type && <span className="error">{errors.vendor_type.message}</span>}
            </div>
          </div>
        </div>

        <div className="collapsible-section">
          <div className="collapsible-header" onClick={() => toggleSection('contact')}>
            <span>Contact Details</span>
            <span>{openSections.contact ? '−' : '+'}</span>
          </div>
          <div className={`collapsible-content ${openSections.contact ? 'open' : ''}`}>
            <div className="form-group">
              <label htmlFor="contact_email">Email</label>
              <input
                {...register('contact_email')}
                id="contact_email"
                placeholder="Enter email"
                className={errors.contact_email ? 'error' : ''}
              />
              {errors.contact_email && <span className="error">{errors.contact_email.message}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="contact_phone">Phone</label>
              <input
                {...register('contact_phone')}
                id="contact_phone"
                placeholder="Enter phone"
              />
            </div>
            <div className="form-group full-width">
              <label htmlFor="payment_terms">Payment Terms</label>
              <input
                {...register('payment_terms')}
                id="payment_terms"
                placeholder="Enter payment terms"
              />
            </div>
          </div>
        </div>

        <button type="submit">{mode === 'create' ? 'Add Vendor' : 'Update Vendor'}</button>
      </form>
    </div>
  );
}