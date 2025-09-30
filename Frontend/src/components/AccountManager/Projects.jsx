import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Eye, Edit, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'react-toastify';
import { markDeleted, filterListByDeleted } from '@/lib/localDelete';

const Projects = ({ viewOnly = false }) => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('add');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
 
  const storageKey = 'accountManagerProjects';

  const form = useForm({
    defaultValues: {
      projectName: '',
      projectObjective: '',
      technology: '',
      clientRequirements: '',
      budget: '',
      startDate: '',
      endDate: '',
    },
  });


  const onSubmit = async (values) => {
    try {
      const payload = {
        project_name: values.projectName,
        project_objective: values.projectObjective || '',
        client_requirements: values.clientRequirements || '',
        budget: values.budget ? Number(values.budget) : 0,
        start_date: values.startDate,
        end_date: values.endDate || null,
        skills_required: values.technology || '',
      };
      const res = await api.post('/projects/', payload);
      console.log("Error:",res);
      toast.success('Project created successfully');
      form.reset();
      // Refresh projects list if user is on view tab
      if (activeTab === 'view') fetchProjects();
    } catch (err) {
      console.error('Error creating project:', err);
      toast.error(err?.response?.data?.detail || 'Failed to create project');
    }
  };

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/projects/get_projects');
      const data = Array.isArray(res.data) ? res.data : [];
      const mapped = data.map((p) => ({
        id: p.project_id,
        name: p.project_name,
        objective: p.project_objective,
        requirements: p.client_requirements,
        budget: p.budget,
        startDate: p.start_date,
        endDate: p.end_date,
        skills: p.skills_required,
        status: p.status,
        createdAt: p.created_at,
        assignments: p.assignments || [],
      }));
      setProjects(filterListByDeleted(storageKey, mapped));
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to load projects');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = (project) => {
    try {
      markDeleted(storageKey, project.id);
      setProjects((prev) => prev.filter((p) => p.id !== project.id));
      toast.success('Project deleted');
    } catch (err) {
      console.error('Error deleting project locally:', err);
      toast.error('Failed to delete project');
    }
  };

  useEffect(() => {
    // Initialize tab from query string or path
    try {
      const params = new URLSearchParams(location.search || '');
      const tabParam = (params.get('tab') || '').toLowerCase();
      if (viewOnly) {
        setActiveTab('view');
      } else if (tabParam === 'view' || tabParam === 'add') {
        setActiveTab(tabParam);
      } else if ((location.pathname || '').toLowerCase().includes('/hr/view-projects')) {
        setActiveTab('view');
      }
    } catch (e) {
      console.log(e);
      // No-op
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab === 'view') fetchProjects();

  }, [activeTab]);


 

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Projects</h1>
      </div>

      <div className="bg-white dark:bg-neutral-900 border rounded-lg p-6 shadow-sm">
        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(viewOnly ? 'view' : val)}>
          <TabsList className="mb-6 bg-gray-100 rounded-md p-1">
            {!viewOnly && (
              <TabsTrigger 
                value="add"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm"
              >
                Add Project
              </TabsTrigger>
            )}
            <TabsTrigger 
              value="view"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              View Projects
            </TabsTrigger>
          </TabsList>

          {!viewOnly && (
          <TabsContent value="add">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FormField
                    control={form.control}
                    name="projectName"
                    rules={{ required: 'Project name is required' }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Project Name</FormLabel>
                        <FormControl>
                          <Input className="focus:ring-2 focus:ring-blue-500" placeholder="Enter project name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="technology"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Technology</FormLabel>
                        <FormControl>
                          <Input className="focus:ring-2 focus:ring-blue-500" placeholder="Tech stack (e.g., React, Node.js)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="budget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Budget</FormLabel>
                        <FormControl>
                          <Input className="focus:ring-2 focus:ring-blue-500" type="number" placeholder="Enter budget" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="projectObjective"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Project Objective</FormLabel>
                        <FormControl>
                          <Input className="focus:ring-2 focus:ring-blue-500" placeholder="Brief objective" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="clientRequirements"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Client Requirements</FormLabel>
                      <FormControl>
                        <Textarea className="focus:ring-2 focus:ring-blue-500" rows={4} placeholder="List client requirements" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FormField
                    control={form.control}
                    name="startDate"
                    rules={{ required: 'Start date is required' }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Start Date</FormLabel>
                        <FormControl>
                          <Input className="focus:ring-2 focus:ring-blue-500" type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">End Date</FormLabel>
                        <FormControl>
                          <Input className="focus:ring-2 focus:ring-blue-500" type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button type="reset" variant="outline" onClick={() => form.reset()} className="bg-gray-100 text-gray-700 hover:bg-gray-200">Reset</Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">Submit</Button>
                </div>
              </form>
            </Form>
          </TabsContent>
          )}

          <TabsContent value="view">
            {loading && <div className="text-sm text-muted-foreground">Loading projects...</div>}
            {error && <div className="text-sm text-destructive">{error}</div>}
            {!loading && !error && (
              <div className="overflow-x-auto">
                <Table>
                   <TableHeader>
              <TableRow className="bg-gray-50 border-b border-gray-200">
                <TableHead className=" text-left font-semibold text-gray-700  px-3 py-3" >PROJECT NAME</TableHead>
                <TableHead className="text-left font-semibold text-gray-700 px-3 py-3">START DATE</TableHead>
                <TableHead className="text-left font-semibold text-gray-700 px-3 py-3">END DATE</TableHead>
                <TableHead className="text-right font-semibold text-gray-700 px-6 py-3">ACTIONS</TableHead>

                
              </TableRow>
            </TableHeader>
                  <TableBody>
                    {projects.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                          No projects found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      projects.map((p) => (
                        <TableRow key={p.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell>{p.startDate ? new Date(p.startDate).toLocaleDateString() : '-'}</TableCell>
                          <TableCell>{p.endDate ? new Date(p.endDate).toLocaleDateString() : '-'}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => { setSelectedProject(p); setIsDetailsOpen(true); }}
                                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-blue-900"
                          
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>View</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleDeleteProject(p)}
                                    className="text-red-900 hover:text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete</TooltipContent>
                              </Tooltip>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
<Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen} >
  <DialogContent className="bg-gradient-to-br from-white via-gray-50 to-blue-50 rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto border border-gray-200">
    <DialogHeader> 
      <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-gray-900">
         Project Details
      </DialogTitle>
    </DialogHeader>

    {selectedProject && (
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">Name:</span>
          <span>{selectedProject.name}</span>
        </div>

        <div className="flex flex-col">
          <span className="font-medium text-gray-900">Objective:</span>
          <span>{selectedProject.objective || '-'}</span>
        </div>

        <div className="flex flex-col col-span-2">
          <span className="font-medium text-gray-900">Client Requirements:</span>
          <span>{selectedProject.requirements || '-'}</span>
        </div>

        <div className="flex flex-col">
          <span className="font-medium text-gray-900">Start Date:</span>
          <span>{selectedProject.startDate ? new Date(selectedProject.startDate).toLocaleDateString() : '-'}</span>
        </div>

        <div className="flex flex-col">
          <span className="font-medium text-gray-900">End Date:</span>
          <span>{selectedProject.endDate ? new Date(selectedProject.endDate).toLocaleDateString() : '-'}</span>
        </div>

        <div className="flex flex-col">
          <span className="font-medium text-gray-900">Budget:</span>
          <span>{selectedProject.budget ?? '-'}</span>
        </div>

        <div className="flex flex-col">
          <span className="font-medium text-gray-900">Skills:</span>
          <span>{selectedProject.skills || '-'}</span>
        </div>

        <div className="flex flex-col">
          <span className="font-medium text-gray-900">Status:</span>
          <span>{selectedProject.status || '-'}</span>
        </div>

        <div className="flex flex-col col-span-2">
          <span className="font-medium text-gray-900">Assigned Employees:</span>
          <ul className="list-disc list-inside mt-1 text-gray-800">
            {(selectedProject.assignments || []).length === 0 ? (
              <li className="text-gray-500">None</li>
            ) : (
              selectedProject.assignments.map((a) => (
                <li key={a.assignment_id}>
                  {a.name} 
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="flex justify-end col-span-2 pt-4">
          <Button
            variant="outline"
            onClick={() => setIsDetailsOpen(false)}
            className="bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            Close
          </Button>
        </div>
      </div>
    )}
  </DialogContent>
</Dialog>

              
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Projects;