import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  Plus,
  Upload,
  FileText,
  MapPin,
  Tag,
  Save,
  X,
  Eye,
  Edit,
  Trash2,
  Download,
  Settings,
  Palette
} from 'lucide-react';
import { policiesAPI, locationsAPI, categoriesAPI } from '@/lib/api';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

const AddCompanyPolicy = () => {
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [viewingPolicy, setViewingPolicy] = useState(null);
const [policies, setPolicies] = useState([]); // policies grouped by cat
  // Form state for policies
  const [formData, setFormData] = useState({
    category_id: '',
    title: '',
    description: '',
    file: null
  });

  // Form state for categories
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    color: '#000000',
    icon: '📄'
  });

  // Assume hr_id is stored in localStorage after login
  const hrId = localStorage.getItem('userId'); // Adjust based on your auth setup
  const userType = localStorage.getItem('userType'); // e.g., 'HR', 'Employee', 'Manager'
  const userIdObj = userType === 'HR' ? { hr_id: hrId } : 
                   userType === 'Employee' ? { employee_id: hrId } : 
                   { manager_id: hrId };

  useEffect(() => {
    fetchLocations();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedLocation) {
      fetchPolicies();
    }
  }, [selectedLocation]);

  const fetchLocations = async () => {
    try {
      const response = await locationsAPI.getLocations();
      setLocations(response.data);
      if (response.data.length > 0) {
        setSelectedLocation(response.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
      toast.error(error.response?.data?.detail || 'Failed to fetch locations');
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getCategories(userIdObj);
      setCategories(response);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error(error.response?.data?.detail || 'Failed to fetch categories');
    }
  };

  const fetchPolicies = async () => {
  if (!selectedLocation) return;
  setLoading(true);
  try {
    const response = await policiesAPI.getPoliciesByLocation(selectedLocation, userIdObj);
    // Assuming response.categories is already grouped by category
    setPolicies(response.categories || []);
  } catch (error) {
    console.error('Error fetching policies:', error);
    toast.error(error.response?.data?.detail || 'Failed to fetch policies');
  } finally {
    setLoading(false);
  }
};


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCategoryInputChange = (e) => {
    const { name, value } = e.target;
    setCategoryFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({
      ...prev,
      file: e.target.files[0]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLocation) {
      toast.error('Please select a location');
      return;
    }
    if (!formData.category_id || !formData.title || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (!hrId) {
      toast.error('HR authentication required');
      return;
    }

    setLoading(true);
    try {
      const submitFormData = new FormData();
      submitFormData.append('location_id', selectedLocation);
      submitFormData.append('category_id', formData.category_id);
      submitFormData.append('title', formData.title);
      submitFormData.append('description', formData.description);
      if (formData.file) {
        submitFormData.append('file', formData.file);
      }

      if (editingPolicy) {
        await policiesAPI.updatePolicy(editingPolicy.id, submitFormData, hrId);
        toast.success('Policy updated successfully!');
      } else {
        await policiesAPI.createPolicy(submitFormData, hrId);
        toast.success('Policy created successfully!');
      }
      resetForm();
      fetchPolicies();
    } catch (error) {
      console.error('Error saving policy:', error);
      toast.error(error.response?.data?.detail || 'Failed to save policy');
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!categoryFormData.name || !categoryFormData.color || !categoryFormData.icon) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (!hrId) {
      toast.error('HR authentication required');
      return;
    }

    setLoading(true);
    try {
      if (editingCategory) {
        await categoriesAPI.updateCategory(editingCategory.id, categoryFormData, hrId);
        toast.success('Category updated successfully!');
      } else {
        await categoriesAPI.createCategory(categoryFormData, hrId);
        toast.success('Category created successfully!');
      }
      resetCategoryForm();
      fetchCategories();
      fetchPolicies();
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error(error.response?.data?.detail || 'Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (policy) => {
    setEditingPolicy(policy);
    setFormData({
      category_id: policy.category_id,
      title: policy.title,
      description: policy.description,
      file: null
    });
    setShowAddForm(true);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryFormData({
      name: category.name,
      color: category.color,
      icon: category.icon
    });
    setShowCategoryForm(true);
  };

  const handleDelete = async (policy) => {
    if (!window.confirm('Are you sure you want to delete this policy?')) {
      return;
    }
    if (!hrId) {
      toast.error('HR authentication required');
      return;
    }

    try {
      await policiesAPI.deletePolicy(policy.id, hrId);
      toast.success('Policy deleted successfully!');
      fetchPolicies();
    } catch (error) {
      console.error('Error deleting policy:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete policy');
    }
  };

  const handleDeleteCategory = async (category) => {
    if (!window.confirm('Are you sure you want to delete this category?')) {
      return;
    }
    if (!hrId) {
      toast.error('HR authentication required');
      return;
    }

    try {
      await categoriesAPI.deleteCategory(category.id, hrId);
      toast.success('Category deleted successfully!');
      fetchCategories();
      fetchPolicies();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete category');
    }
  };

  const handleView = async (policy) => {
    try {
      const response = await policiesAPI.getPolicy(policy.id, userIdObj);
      setViewingPolicy(response);
    } catch (error) {
      console.error('Error fetching policy details:', error);
      toast.error(error.response?.data?.detail || 'Failed to fetch policy details');
    }
  };

  const resetForm = () => {
    setFormData({
      category_id: '',
      title: '',
      description: '',
      file: null
    });
    setEditingPolicy(null);
    setShowAddForm(false);
  };

  const resetCategoryForm = () => {
    setCategoryFormData({
      name: '',
      color: '#000000',
      icon: '📄'
    });
    setEditingCategory(null);
    setShowCategoryForm(false);
  };

  const handleDownload = async (policy) => {
    try {
      const blob = await policiesAPI.downloadPolicy(policy.id, userIdObj);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `policy_${policy.id}.${policy.attachment_type}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading policy:', error);
      toast.error(error.response?.data?.detail || 'Failed to download policy');
    }
  };

  const getLocationName = () => {
    const location = locations.find(loc => loc.id === parseInt(selectedLocation));
    return location ? location.name : 'Select Location';
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Company Policies Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage company policies by location and category
          </p>
        </div>

        {/* Location Selector */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Select Location
            </h2>
          </div>
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="w-full max-w-md p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select Location</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        {selectedLocation && userType === 'HR' && (
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Add New Policy
            </button>
            <button
              onClick={() => setShowCategoryForm(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-lg hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <Settings className="h-5 w-5" />
              Manage Categories
            </button>
          </div>
        )}

        {/* Category Management Modal */}
        {showCategoryForm && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-white via-green-50 to-emerald-50 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-green-200">
              <div className="flex items-center justify-between p-6 border-b border-green-200 bg-gradient-to-r from-green-600 to-emerald-600 rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                  <h2 className="text-xl font-bold text-white">
                    {editingCategory ? 'Edit Category' : 'Manage Categories'}
                  </h2>
                </div>
                <button
                  onClick={resetCategoryForm}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="h-6 w-6 text-white" />
                </button>
              </div>
              <div className="p-6">
                <form onSubmit={handleCategorySubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={categoryFormData.name}
                      onChange={handleCategoryInputChange}
                      required
                      placeholder="Enter category name"
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Color *
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        name="color"
                        value={categoryFormData.color}
                        onChange={handleCategoryInputChange}
                        required
                        className="w-12 h-12 p-1 border border-gray-300 dark:border-gray-600 rounded-lg"
                      />
                      <input
                        type="text"
                        name="color"
                        value={categoryFormData.color}
                        onChange={handleCategoryInputChange}
                        placeholder="#000000"
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Icon *
                    </label>
                    <input
                      type="text"
                      name="icon"
                      value={categoryFormData.icon}
                      onChange={handleCategoryInputChange}
                      required
                      placeholder="Enter emoji or icon (e.g., 📄)"
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      <Save className="h-4 w-4" />
                      {loading ? 'Saving...' : (editingCategory ? 'Update Category' : 'Create Category')}
                    </button>
                    <button
                      type="button"
                      onClick={resetCategoryForm}
                      className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Policy Form */}
        {showAddForm && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {editingPolicy ? 'Edit Policy' : 'Add New Policy'}
              </h2>
              <button
                onClick={resetForm}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Tag className="h-4 w-4 inline mr-1" />
                    Category *
                  </label>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleInputChange}
                    required
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <FileText className="h-4 w-4 inline mr-1" />
                    Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter policy title"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  placeholder="Enter policy description"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Upload className="h-4 w-4 inline mr-1" />
                  Attachment (Optional)
                </label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Supported formats: PDF, PNG, JPG, DOC, DOCX
                </p>
              </div>
              {/* Form Actions */}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {loading ? 'Saving...' : (editingPolicy ? 'Update Policy' : 'Create Policy')}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Categories List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Policy Categories
          </h2>
          {categories.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No categories found. Click "Manage Categories" to create your first category.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg"
                  style={{ borderColor: category.color }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{category.icon}</span>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {category.name}
                      </h3>
                    </div>
                    {userType === 'HR' && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEditCategory(category)}
                          className="p-1 text-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-900 rounded transition-colors"
                          title="Edit Category"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category)}
                          className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-colors"
                          title="Delete Category"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-end">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {category.policy_count} policies
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <>
        {/* Policies by Category - Accordion */}
       {/* Policies by Category - Accordion */}
<div className="mt-8">
  <h3 className="text-xl font-semibold mb-4">Policies by Category</h3>
  {!selectedLocation ? (
    <p className="text-gray-600">Please select a location to view policies.</p>
  ) : !policies || policies.length === 0 ? (
    <p className="text-gray-600">No policies available for the selected location.</p>
  ) : (
    <Accordion type="single" collapsible className="space-y-4">
      {policies.map((cat) => (
        <AccordionItem key={cat.category_id} value={String(cat.category_id)}>
          <AccordionTrigger>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{cat.category_icon}</span>
              <span className="text-lg font-semibold">{cat.category_name}</span>
              <span className="ml-2 text-sm text-gray-500">({cat.count} policies)</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            {(!cat.policies || cat.policies.length === 0) ? (
              <p className="text-gray-500">No policies in this category</p>
            ) : (
              <div className="space-y-3">
                {cat.policies.map((policy) => (
                  <div key={policy.id} className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex items-start justify-between">
                    <div className="flex-1 pr-4">
                      <h4 className="font-medium text-gray-900 dark:text-white">{policy.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{policy.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>Created: {new Date(policy.created_at).toLocaleDateString()}</span>
                        {policy.attachment_type && (
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {policy.attachment_type.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleView(policy)}
                        className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-lg transition-colors"
                        title="View Policy"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {policy.attachment_type && (
                        <button
                          onClick={() => handleDownload(policy)}
                          className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900 rounded-lg transition-colors"
                          title="Download Attachment"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )}
</div>
 
        </>

        {/* View Policy Modal */}
        {viewingPolicy && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {viewingPolicy.title}
                </h2>
                <button
                  onClick={() => setViewingPolicy(null)}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Category
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{viewingPolicy.category_icon}</span>
                    <p className="text-gray-600 dark:text-gray-400">{viewingPolicy.category_name}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Description
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                    {viewingPolicy.description}
                  </p>
                </div>
                {viewingPolicy.attachment_type && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Attachment
                    </h3>
                    <button
                      onClick={() => handleDownload(viewingPolicy)}
                      className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      Download {viewingPolicy.attachment_type?.toUpperCase()}
                    </button>
                  </div>
                )}
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Created: {new Date(viewingPolicy.created_at).toLocaleString()}
                  {viewingPolicy.updated_at !== viewingPolicy.created_at && (
                    <span className="ml-4">
                      Updated: {new Date(viewingPolicy.updated_at).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddCompanyPolicy;