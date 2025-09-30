import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { 
  User, 
  Mail, 
  MapPin, 
  Users, 
  Briefcase, 
  Calendar,
  Phone,
  Building,
  UserCheck,
  Loader2,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'react-toastify';
import { useUser } from '../../contexts/UserContext';

const MyProfile = () => {
  const navigate = useNavigate();
  const { user, getDashboardPath } = useUser();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [projects, setProjects] = useState(null);
  useEffect(() => {
    fetchEmployeeProfile();
  }, [user]);

const fetchEmployeeProfile = async () => {
  try {
    setLoading(true);
    setError(null);

    // Get employeeId
    const employeeId = user?.employeeId || JSON.parse(localStorage.getItem('userData'))?.employeeId;
    if (!employeeId) {
      setError('Missing employee ID. Please re-login.');
      setLoading(false);
      return;
    }

    // Fetch profile data
    const response = await api.get(`/users/${employeeId}`);
    setProfileData(response.data);

    // Fetch projects for this employee
    try {
      const projRes = await api.get('/attendance/active-projects', {
        params: { employee_id: employeeId }
      });
      setProjects(projRes.data || []);
    } catch (projError) {
      console.error('Error fetching projects:', projError);
      toast.error('Error fetching assigned projects');
      setProjects([]);
    }

  } catch (error) {
    console.error('Error fetching employee profile:', error);
    setError('Failed to load profile data');
    toast.error('Failed to load profile data');
  } finally {
    setLoading(false);
  }
};




  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading profile...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 p-6">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <div className="text-center">
              <h3 className="text-lg font-semibold">Error Loading Profile</h3>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
            <Button onClick={fetchEmployeeProfile} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 p-6">
            <User className="h-12 w-12 text-muted-foreground" />
            <div className="text-center">
              <h3 className="text-lg font-semibold">No Profile Data</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Unable to load profile information
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            My Profile
          </h1>
          <p className="text-muted-foreground mt-2">
            {user?.name ? `Welcome back, ${user.name}!` : 'View and manage your personal information'}
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => {
            const path = getDashboardPath(user?.role);
            navigate(path || '/');
          }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                {(profileData?.name || user?.name) ? (profileData?.name || user?.name).split(' ').map(n => n[0]).join('').toUpperCase() : 'N/A'}
              </div>
              <div>
                <h3 className="font-semibold text-lg">{profileData?.name || user?.name || 'N/A'}</h3>
                <p className="text-sm text-muted-foreground">Employee ID: {profileData?.id || user?.employeeId || 'N/A'}</p>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{profileData?.company_email || user?.email || 'N/A'}</span>
              </div>
              
              {(profileData?.contactNumber || user?.contactNumber) && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{profileData?.contactNumber || user?.contactNumber}</span>
                </div>
              )}
              
              {(profileData?.location || user?.location) && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{profileData?.location || user?.location}</span>
                </div>
              )}
              
              {(profileData?.role || user?.role) && (
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{profileData?.role || user?.role}</span>
                </div>
              )}
              
              {profileData.employmentType && (
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{profileData.employmentType}</span>
                </div>
              )}
              
              {profileData.dateOfJoining && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Joined: {new Date(profileData.dateOfJoining).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Managers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Managers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {profileData.managers && profileData.managers.length > 0 ? (
              <div className="space-y-2">
                {profileData.managers.map((manager, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-sm">
                      {manager.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <span className="text-sm font-medium">{manager}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No managers assigned</p>
            )}
          </CardContent>
        </Card>

        {/* HR Representatives */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              HR Representatives
            </CardTitle>
          </CardHeader>
          <CardContent>
            {profileData.hrs && profileData.hrs.length > 0 ? (
              <div className="space-y-2">
                {profileData.hrs.map((hr, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-medium text-sm">
                      {hr.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <span className="text-sm font-medium">{hr}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No HR representatives assigned</p>
            )}
          </CardContent>
        </Card>

        {/* Projects */}
       {/* Projects */}
<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Briefcase className="h-5 w-5" />
      Assigned Projects
    </CardTitle>
  </CardHeader>
  <CardContent>
    {projects && projects.length > 0 ? (
      <div className="flex flex-wrap gap-2">
        {projects.map((project) => (
          <Badge
            key={project.project_id}
            variant="secondary"
            className="mr-2 mb-2"
          >
            {project.project_name}
          </Badge>
        ))}
      </div>
    ) : (
      <p className="text-sm text-muted-foreground">
        No projects assigned
      </p>
    )}
  </CardContent>
</Card>


      </div>

      {/* Refresh Button */}
      <div className="mt-6 flex justify-center ">
        <Button onClick={fetchEmployeeProfile} variant="outline" className="mb-6">
          Refresh Profile
        </Button>
      </div>
    </div>
  );
};

export default MyProfile;