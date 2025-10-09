// Deprecated HRConfig (General/Defaults) removed. Using the new HRConfig with Leave Categories and Departments defined below.

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'react-toastify';
import { useUser } from '@/contexts/UserContext';
import { Trash2, Plus, Edit2, Save, X } from 'lucide-react';

const HRConfig = () => {
  const { user } = useUser();
  const isSuperHR = user?.role === 'HR' && user?.super_hr === true;

  const [saving, setSaving] = useState(false);
  
  // Leave Categories State
  const [leaveCategories, setLeaveCategories] = useState([]);
  const [newLeaveCategory, setNewLeaveCategory] = useState({ name: '', totalLeaves: '' });
  const [editingLeave, setEditingLeave] = useState(null);

  // Departments State
  const [departments, setDepartments] = useState([]);
  const [newDepartment, setNewDepartment] = useState({ name: '', description: '' });
  const [editingDepartment, setEditingDepartment] = useState(null);

  // Load data from localStorage on component mount
  useEffect(() => {
    try {
      const savedLeaveCategories = localStorage.getItem('hr_leave_categories');
      const savedDepartments = localStorage.getItem('hr_departments');
      
      if (savedLeaveCategories) {
        setLeaveCategories(JSON.parse(savedLeaveCategories));
      }
      
      if (savedDepartments) {
        setDepartments(JSON.parse(savedDepartments));
      }
    } catch (error) {
      console.error('Error loading HR config data:', error);
    }
  }, []);

  // Leave Categories Functions
  const handleAddLeaveCategory = () => {
    if (!newLeaveCategory.name || !newLeaveCategory.totalLeaves) {
      toast.error('Please fill in all fields');
      return;
    }

    if (isNaN(newLeaveCategory.totalLeaves) || parseInt(newLeaveCategory.totalLeaves) <= 0) {
      toast.error('Total leaves must be a positive number');
      return;
    }

    const category = {
      id: Date.now(),
      name: newLeaveCategory.name.trim(),
      totalLeaves: parseInt(newLeaveCategory.totalLeaves),
      createdAt: new Date().toISOString()
    };

    const updatedCategories = [...leaveCategories, category];
    setLeaveCategories(updatedCategories);
    localStorage.setItem('hr_leave_categories', JSON.stringify(updatedCategories));
    
    setNewLeaveCategory({ name: '', totalLeaves: '' });
    toast.success('Leave category added successfully');
  };

  const handleEditLeaveCategory = (category) => {
    setEditingLeave({
      ...category,
      totalLeaves: category.totalLeaves.toString()
    });
  };

  const handleSaveLeaveCategory = () => {
    if (!editingLeave.name || !editingLeave.totalLeaves) {
      toast.error('Please fill in all fields');
      return;
    }

    if (isNaN(editingLeave.totalLeaves) || parseInt(editingLeave.totalLeaves) <= 0) {
      toast.error('Total leaves must be a positive number');
      return;
    }

    const updatedCategories = leaveCategories.map(cat => 
      cat.id === editingLeave.id 
        ? { ...cat, name: editingLeave.name.trim(), totalLeaves: parseInt(editingLeave.totalLeaves) }
        : cat
    );

    setLeaveCategories(updatedCategories);
    localStorage.setItem('hr_leave_categories', JSON.stringify(updatedCategories));
    setEditingLeave(null);
    toast.success('Leave category updated successfully');
  };

  const handleDeleteLeaveCategory = (id) => {
    const updatedCategories = leaveCategories.filter(cat => cat.id !== id);
    setLeaveCategories(updatedCategories);
    localStorage.setItem('hr_leave_categories', JSON.stringify(updatedCategories));
    toast.success('Leave category deleted successfully');
  };

  // Departments Functions
  const handleAddDepartment = () => {
    if (!newDepartment.name) {
      toast.error('Please enter department name');
      return;
    }

    const department = {
      id: Date.now(),
      name: newDepartment.name.trim(),
      description: newDepartment.description.trim(),
      createdAt: new Date().toISOString()
    };

    const updatedDepartments = [...departments, department];
    setDepartments(updatedDepartments);
    localStorage.setItem('hr_departments', JSON.stringify(updatedDepartments));
    
    setNewDepartment({ name: '', description: '' });
    toast.success('Department added successfully');
  };

  const handleEditDepartment = (department) => {
    setEditingDepartment({ ...department });
  };

  const handleSaveDepartment = () => {
    if (!editingDepartment.name) {
      toast.error('Please enter department name');
      return;
    }

    const updatedDepartments = departments.map(dept => 
      dept.id === editingDepartment.id 
        ? { ...dept, name: editingDepartment.name.trim(), description: editingDepartment.description.trim() }
        : dept
    );

    setDepartments(updatedDepartments);
    localStorage.setItem('hr_departments', JSON.stringify(updatedDepartments));
    setEditingDepartment(null);
    toast.success('Department updated successfully');
  };

  const handleDeleteDepartment = (id) => {
    const updatedDepartments = departments.filter(dept => dept.id !== id);
    setDepartments(updatedDepartments);
    localStorage.setItem('hr_departments', JSON.stringify(updatedDepartments));
    toast.success('Department deleted successfully');
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
                  <Button onClick={handleAddLeaveCategory} className="w-full">
                    Add Leave Category
                  </Button>
                </CardContent>
              </Card>

              {/* Existing Leave Categories */}
              <Card>
                <CardHeader>
                  <CardTitle>Existing Leave Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  {leaveCategories.length === 0 ? (
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
                  <Button onClick={handleAddDepartment} className="w-full">
                    Add Department
                  </Button>
                </CardContent>
              </Card>

              {/* Existing Departments */}
              <Card>
                <CardHeader>
                  <CardTitle>Existing Departments</CardTitle>
                </CardHeader>
                <CardContent>
                  {departments.length === 0 ? (
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
        </Tabs>
      </div>
    </div>
  );
};

// Ensure only one export default at end of file
export default HRConfig;