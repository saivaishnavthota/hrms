import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Search, 
  RefreshCw, 
  Monitor, 
  Laptop, 
  Smartphone, 
  Printer, 
  Headphones, 
  HardDrive,
  User,
  Calendar,
  CheckCircle
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '@/lib/api';

const AssetAllocations = () => {
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAssetAllocations();
  }, []);

  const fetchAssetAllocations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/assets/allocations/detailed/');
      setAllocations(response.data || []);
    } catch (error) {
      console.error('Error fetching asset allocations:', error);
      toast.error('Failed to fetch asset allocations');
    } finally {
      setLoading(false);
    }
  };

  const getAssetIcon = (assetType) => {
    const type = assetType?.toLowerCase() || '';
    if (type.includes('laptop') || type.includes('computer')) return Laptop;
    if (type.includes('monitor') || type.includes('display')) return Monitor;
    if (type.includes('phone') || type.includes('mobile')) return Smartphone;
    if (type.includes('printer')) return Printer;
    if (type.includes('headphone') || type.includes('headset')) return Headphones;
    if (type.includes('storage') || type.includes('drive')) return HardDrive;
    return Monitor; // Default icon
  };


  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const filteredAllocations = allocations.filter(allocation => {
    const matchesSearch = 
      allocation.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      allocation.asset_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      allocation.asset_tag?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      allocation.asset_type?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Loading asset allocations...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Asset Allocations</h1>
            <p className="text-sm text-gray-600 mt-1">
              View and manage asset allocations to employees
            </p>
          </div>
          <Button onClick={fetchAssetAllocations} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by employee, asset name, tag, or type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Allocations</p>
                  <p className="text-2xl font-bold text-gray-900">{allocations.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Monitor className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Allocations</p>
                  <p className="text-2xl font-bold text-green-600">
                    {allocations.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Asset Types</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {new Set(allocations.map(a => a.asset_type)).size}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Monitor className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Unique Employees</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {new Set(allocations.map(a => a.employee_id)).size}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <User className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Allocations Table */}
        <Card>
          <CardHeader>
            <CardTitle>Asset Allocations ({filteredAllocations.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredAllocations.length === 0 ? (
              <div className="text-center py-8">
                <Monitor className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No asset allocations found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Asset</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Allocation Date</TableHead>
                      <TableHead>Expected Return</TableHead>
                      <TableHead>Condition</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAllocations.map((allocation) => {
                      const AssetIcon = getAssetIcon(allocation.asset_type);
                      return (
                        <TableRow key={allocation.allocation_id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <User className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">{allocation.employee_name || 'N/A'}</p>
                                <p className="text-xs text-gray-500">ID: {allocation.employee_id}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                                <AssetIcon className="h-4 w-4 text-gray-600" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">{allocation.asset_name || 'N/A'}</p>
                                <p className="text-xs text-gray-500">Tag: {allocation.asset_tag || 'N/A'}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600">{allocation.asset_type || 'N/A'}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span className="text-sm">{formatDate(allocation.allocation_date)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{formatDate(allocation.expected_return_date)}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600">{allocation.condition || 'N/A'}</span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AssetAllocations;
