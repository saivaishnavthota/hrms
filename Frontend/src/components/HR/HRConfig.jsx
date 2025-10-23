// Deprecated HRConfig (General/Defaults) removed. Using the new HRConfig with Leave Categories and Departments defined below.

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'react-toastify';
import { useUser } from '@/contexts/UserContext';
import { Trash2, Plus, Edit2, Save, X, Calendar } from 'lucide-react';
import api, { weekoffAPI } from '@/lib/api';

const HRConfig = () => {
  const { user } = useUser();
  const isSuperHR = user?.role === 'HR' && user?.super_hr === true;

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Leave Categories State
  const [leaveCategories, setLeaveCategories] = useState([]);
  const [newLeaveCategory, setNewLeaveCategory] = useState({ name: '', totalLeaves: '' });
  const [editingLeave, setEditingLeave] = useState(null);

  // Departments State
  const [departments, setDepartments] = useState([]);
  const [newDepartment, setNewDepartment] = useState({ name: '', description: '' });
  const [editingDepartment, setEditingDepartment] = useState(null);

  // Weekoff Management State
  const [weekoffLoading, setWeekoffLoading] = useState(false);

  // Load data from API on component mount
  useEffect(() => {
    fetchLeaveCategories();
    fetchDepartments();
  }, []);

  const fetchLeaveCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get('/hr-config/leave-categories', {
        params: { hr_id: user?.employeeId }
      });
      setLeaveCategories(response.data.map(cat => ({
        id: cat.id,
        name: cat.name,
        totalLeaves: cat.default_days,
        description: cat.description,
        createdAt: cat.created_at
      })));
    } catch (error) {
      console.error('Error loading leave categories:', error);
      toast.error('Failed to load leave categories');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/hr-config/departments', {
        params: { hr_id: user?.employeeId }
      });
      setDepartments(response.data.map(dept => ({
        id: dept.id,
        name: dept.name,
        description: dept.description,
        createdAt: dept.created_at
      })));
    } catch (error) {
      console.error('Error loading departments:', error);
      toast.error('Failed to load departments');
    }
  };

  // Leave Categories Functions
  const handleAddLeaveCategory = async () => {
    if (!newLeaveCategory.name || !newLeaveCategory.totalLeaves) {
      toast.error('Please fill in all fields');
      return;
    }

    if (isNaN(newLeaveCategory.totalLeaves) || parseInt(newLeaveCategory.totalLeaves) <= 0) {
      toast.error('Total leaves must be a positive number');
      return;
    }

    try {
      setSaving(true);
      await api.post('/hr-config/leave-categories', {
        name: newLeaveCategory.name.trim(),
        default_days: parseInt(newLeaveCategory.totalLeaves),
        description: null
      }, {
        params: { hr_id: user?.employeeId }
      });
      
      setNewLeaveCategory({ name: '', totalLeaves: '' });
      toast.success('Leave category added successfully');
      await fetchLeaveCategories();
    } catch (error) {
      console.error('Error adding leave category:', error);
      toast.error(error.response?.data?.detail || 'Failed to add leave category');
    } finally {
      setSaving(false);
    }
  };

  const handleEditLeaveCategory = (category) => {
    setEditingLeave({
      ...category,
      totalLeaves: category.totalLeaves.toString()
    });
  };

  const handleSaveLeaveCategory = async () => {
    if (!editingLeave.name || !editingLeave.totalLeaves) {
      toast.error('Please fill in all fields');
      return;
    }

    if (isNaN(editingLeave.totalLeaves) || parseInt(editingLeave.totalLeaves) <= 0) {
      toast.error('Total leaves must be a positive number');
      return;
    }

    try {
      setSaving(true);
      await api.put(`/hr-config/leave-categories/${editingLeave.id}`, {
        name: editingLeave.name.trim(),
        default_days: parseInt(editingLeave.totalLeaves),
        description: editingLeave.description
      }, {
        params: { hr_id: user?.employeeId }
      });

      setEditingLeave(null);
      toast.success('Leave category updated successfully');
      await fetchLeaveCategories();
    } catch (error) {
      console.error('Error updating leave category:', error);
      toast.error(error.response?.data?.detail || 'Failed to update leave category');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLeaveCategory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this leave category?')) {
      return;
    }

    try {
      setSaving(true);
      await api.delete(`/hr-config/leave-categories/${id}`, {
        params: { hr_id: user?.employeeId }
      });
      
      toast.success('Leave category deleted successfully');
      await fetchLeaveCategories();
    } catch (error) {
      console.error('Error deleting leave category:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete leave category');
    } finally {
      setSaving(false);
    }
  };

  // Departments Functions
  const handleAddDepartment = async () => {
    if (!newDepartment.name) {
      toast.error('Please enter department name');
      return;
    }

    try {
      setSaving(true);
      await api.post('/hr-config/departments', {
        name: newDepartment.name.trim(),
        description: newDepartment.description.trim()
      }, {
        params: { hr_id: user?.employeeId }
      });
      
      setNewDepartment({ name: '', description: '' });
      toast.success('Department added successfully');
      await fetchDepartments();
    } catch (error) {
      console.error('Error adding department:', error);
      toast.error(error.response?.data?.detail || 'Failed to add department');
    } finally {
      setSaving(false);
    }
  };

  const handleEditDepartment = (department) => {
    setEditingDepartment({ ...department });
  };

  const handleSaveDepartment = async () => {
    if (!editingDepartment.name) {
      toast.error('Please enter department name');
      return;
    }

    try {
      setSaving(true);
      await api.put(`/hr-config/departments/${editingDepartment.id}`, {
        name: editingDepartment.name.trim(),
        description: editingDepartment.description.trim()
      }, {
        params: { hr_id: user?.employeeId }
      });

      setEditingDepartment(null);
      toast.success('Department updated successfully');
      await fetchDepartments();
    } catch (error) {
      console.error('Error updating department:', error);
      toast.error(error.response?.data?.detail || 'Failed to update department');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDepartment = async (id) => {
    if (!window.confirm('Are you sure you want to delete this department?')) {
      return;
    }

    try {
      setSaving(true);
      await api.delete(`/hr-config/departments/${id}`, {
        params: { hr_id: user?.employeeId }
      });
      
      toast.success('Department deleted successfully');
      await fetchDepartments();
    } catch (error) {
      console.error('Error deleting department:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete department');
    } finally {
      setSaving(false);
    }
  };

  // Weekoff Management Functions
  const handleSetDefaultWeekoffsForAll = async () => {
    if (!window.confirm('This will set default weekoffs (Saturday & Sunday) for all employees who don\'t have weekoffs configured. Continue?')) {
      return;
    }
    
    try {
      setWeekoffLoading(true);
      const response = await weekoffAPI.setDefaultWeekoffsForAll();
      toast.success(`Default weekoffs set successfully! Processed ${response.success_count} employees.`);
    } catch (error) {
      console.error('Error setting default weekoffs:', error);
      toast.error('Failed to set default weekoffs for all employees');
    } finally {
      setWeekoffLoading(false);
    }
  };

  if (!isSuperHR) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Access Restricted</h1>
          <p className="text-sm text-muted-foreground">Only Super HR can access HR configuration.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">HR Configuration</h1>
        <p className="text-sm text-muted-foreground mb-6">Manage leave categories and departments for your organization.</p>

        <Tabs defaultValue="leave-categories" className="w-full">
          <TabsList className="mb-6 bg-gray-100 rounded-md p-1">
            <TabsTrigger value="leave-categories">Leave Categories</TabsTrigger>
            <TabsTrigger value="departments">Departments</TabsTrigger>
            <TabsTrigger value="weekoffs">Weekoff Management</TabsTrigger>
          </TabsList>

          <TabsContent value="leave-categories" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Add New Leave Category */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Add Leave Category
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="leave-name">Category Name</Label>
                    <Input
                      id="leave-name"
                      placeholder="e.g., Annual Leave, Sick Leave"
                      value={newLeaveCategory.name}
                      onChange={(e) => setNewLeaveCategory(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="total-leaves">Total Leaves per Year</Label>
                    <Input
                      id="total-leaves"
                      type="number"
                      placeholder="e.g., 12"
                      min="1"
                      value={newLeaveCategory.totalLeaves}
                      onChange={(e) => setNewLeaveCategory(prev => ({ ...prev, totalLeaves: e.target.value }))}
                    />
                  </div>
                  <Button onClick={handleAddLeaveCategory} className="w-full" disabled={saving}>
                    {saving ? 'Adding...' : 'Add Leave Category'}
                  </Button>
                </CardContent>
              </Card>

              {/* Existing Leave Categories */}
              <Card>
                <CardHeader>
                  <CardTitle>Existing Leave Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Loading leave categories...
                    </p>
                  ) : leaveCategories.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No leave categories created yet. Add your first category to get started.
                    </p>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {leaveCategories.map((category) => (
                        <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
                          {editingLeave && editingLeave.id === category.id ? (
                            <div className="flex-1 space-y-2 mr-3">
                              <Input
                                value={editingLeave.name}
                                onChange={(e) => setEditingLeave(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Category name"
                              />
                              <Input
                                type="number"
                                value={editingLeave.totalLeaves}
                                onChange={(e) => setEditingLeave(prev => ({ ...prev, totalLeaves: e.target.value }))}
                                placeholder="Total leaves"
                                min="1"
                              />
                              <div className="flex gap-2">
                                <Button size="sm" onClick={handleSaveLeaveCategory}>
                                  <Save className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingLeave(null)}>
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex-1">
                                <p className="font-medium">{category.name}</p>
                                <p className="text-sm text-muted-foreground">{category.totalLeaves} leaves per year</p>
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => handleEditLeaveCategory(category)}>
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleDeleteLeaveCategory(category.id)}>
                                  <Trash2 className="h-3 w-3 text-red-500" />
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="departments" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Add New Department */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Add Department
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="dept-name">Department Name</Label>
                    <Input
                      id="dept-name"
                      placeholder="e.g., Human Resources, Engineering"
                      value={newDepartment.name}
                      onChange={(e) => setNewDepartment(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dept-description">Description (Optional)</Label>
                    <Input
                      id="dept-description"
                      placeholder="Brief description of the department"
                      value={newDepartment.description}
                      onChange={(e) => setNewDepartment(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <Button onClick={handleAddDepartment} className="w-full" disabled={saving}>
                    {saving ? 'Adding...' : 'Add Department'}
                  </Button>
                </CardContent>
              </Card>

              {/* Existing Departments */}
              <Card>
                <CardHeader>
                  <CardTitle>Existing Departments</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Loading departments...
                    </p>
                  ) : departments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No departments created yet. Add your first department to get started.
                    </p>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {departments.map((department) => (
                        <div key={department.id} className="flex items-center justify-between p-3 border rounded-lg">
                          {editingDepartment && editingDepartment.id === department.id ? (
                            <div className="flex-1 space-y-2 mr-3">
                              <Input
                                value={editingDepartment.name}
                                onChange={(e) => setEditingDepartment(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Department name"
                              />
                              <Input
                                value={editingDepartment.description}
                                onChange={(e) => setEditingDepartment(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Description (optional)"
                              />
                              <div className="flex gap-2">
                                <Button size="sm" onClick={handleSaveDepartment}>
                                  <Save className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingDepartment(null)}>
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex-1">
                                <p className="font-medium">{department.name}</p>
                                {department.description && (
                                  <p className="text-sm text-muted-foreground">{department.description}</p>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => handleEditDepartment(department)}>
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleDeleteDepartment(department.id)}>
                                  <Trash2 className="h-3 w-3 text-red-500" />
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="weekoffs" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Weekoff Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Default Weekoff Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Default Weekoffs</h4>
                    <p className="text-sm text-blue-700 mb-3">
                      All employees are automatically assigned Saturday and Sunday as default weekoffs. 
                      This ensures consistent weekend coverage across the organization.
                    </p>
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <Calendar className="h-4 w-4" />
                      <span>Default: Saturday & Sunday</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Bulk Actions</h4>
                    <p className="text-sm text-gray-600">
                      Set default weekoffs for all employees who don't have weekoffs configured yet.
                    </p>
                    <Button 
                      onClick={handleSetDefaultWeekoffsForAll}
                      disabled={weekoffLoading}
                      className="w-full"
                    >
                      {weekoffLoading ? 'Processing...' : 'Set Default Weekoffs for All Employees'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Weekoff Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Weekoff Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div>
                        <h4 className="font-medium text-gray-900">Automatic Assignment</h4>
                        <p className="text-sm text-gray-600">
                          New employees automatically get Saturday and Sunday as weekoffs when they are first assigned to a location.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div>
                        <h4 className="font-medium text-gray-900">Employee Customization</h4>
                        <p className="text-sm text-gray-600">
                          Employees can modify their weekoffs through the attendance management interface, but defaults are always Saturday and Sunday.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                      <div>
                        <h4 className="font-medium text-gray-900">Calendar Integration</h4>
                        <p className="text-sm text-gray-600">
                          Weekoffs are automatically displayed in the calendar view and attendance tracking system.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Ensure only one export default at end of file
export default HRConfig;