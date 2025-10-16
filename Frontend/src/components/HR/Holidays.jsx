import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Eye, X } from 'lucide-react';
import { markDeleted, filterListByDeleted } from '../../lib/localDelete';
import { toast } from "react-toastify";
import api, { calendarAPI, locationsAPI } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogBody,
} from '@/components/ui/dialog';

const Holidays = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [locations, setLocations] = useState([]);
  const [editingLocation, setEditingLocation] = useState(null);
  const [holidays, setHolidays] = useState([]);
  const [filteredHolidays, setFilteredHolidays] = useState([]);
  const [formData, setFormData] = useState({
    location_id: '',
    title: '',
    date: '',
    status: 'Active'
  });

  const [selectedHoliday, setSelectedHoliday] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Fetch locations from backend
  useEffect(() => {
    fetchLocations();
    fetchHolidays();
  }, []);

  // Filter holidays based on selected location and search term
  useEffect(() => {
    let filtered = holidays;
    
    if (selectedLocation) {
      filtered = filtered.filter(holiday => holiday.location_id === parseInt(selectedLocation));
    }
    
    if (searchTerm) {
      filtered = filtered.filter(holiday =>
        holiday.title.toLowerCase().includes(searchTerm.toLowerCase())

      );
    }
    
    // Apply localStorage-based deletion filter
    filtered = filterListByDeleted('holidays', filtered);
    
    setFilteredHolidays(filtered);
    setCurrentPage(1);
  }, [holidays, selectedLocation, searchTerm]);

  const fetchLocations = async () => {
    try {
      const response = await locationsAPI.getLocations();
      if (response.status === "success") {
        setLocations(response.data);
      }
    } catch (error) {
      console.error("Error fetching locations:", error);
      toast.error("Failed to fetch locations");
    }
  };

 const handleAddLocation = async (e) => {
    e.preventDefault();
    if (!newLocationName.trim()) return;

    try {
      if (editingLocation) {
        // Update existing location
        const response = await locationsAPI.updateLocation(editingLocation.id, {
          name: newLocationName.trim(),
        });
        if (response.status === "success") {
          setLocations((prev) =>
            prev.map((loc) =>
              loc.id === editingLocation.id ? response.data : loc
            )
          );
          setNewLocationName("");
          setEditingLocation(null);
          setShowLocationModal(false);
          toast.success("Location updated successfully");
        }
      } else {
        // Add new location
        const response = await locationsAPI.addLocation({
          name: newLocationName.trim(),
        });
        if (response.status === "success") {
          setLocations((prev) => [...prev, response.data]);
          setNewLocationName("");
          setShowLocationModal(false);
          toast.success("Location added successfully");
        }
      }
    } catch (error) {
      console.error("Error saving location:", error);
      toast.error(`Failed to ${editingLocation ? 'update' : 'add'} location`);
    }
  };

  const handleEditLocation = (location) => {
    setEditingLocation(location);
    setNewLocationName(location.name);
    setShowLocationModal(true);
  };

  const handleCloseLocationModal = () => {
    setShowLocationModal(false);
    setEditingLocation(null);
    setNewLocationName("");
  };


  const fetchHolidays = async () => {
    try {
      const data = await calendarAPI.getHolidays();
      console.log("API Response:", data); // Debug log
      if (data.status === "success") {
        const transformed = data.data.map((holiday) => ({
          id: holiday.id,
          location_id: holiday.location_id,
          title: holiday.holiday_name,
          date: holiday.holiday_date,
          status: "Active",
        }));
        console.log("Transformed holidays:", transformed); // Debug log
        setHolidays(transformed);
      }
    } catch (error) {
      console.error("Error fetching holidays:", error);
      toast.error("Failed to fetch holidays");
    }
  };
  

  const getLocationName = (locationId) => {
    const location = locations.find((loc) => loc.id === locationId);
    return location ? location.name : "Unknown Location";
  };
  
 const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await calendarAPI.addHoliday({
        location_id: parseInt(formData.location_id),
        holiday_date: formData.date,
        holiday_name: formData.title,
      });

      if (data.status === "success") {
        setShowModal(false);
        setFormData({
          location_id: "",
          title: "",
          date: "",
          status: "Active",
        });
        fetchHolidays();
        toast.success("Holiday added successfully");
      }
    } catch (error) {
      console.error("Error adding holiday:", error);
      toast.error("Failed to add holiday");
    }
  };

 const handleViewDetails = (holiday) => {
    setSelectedHoliday(holiday);
    setIsDetailsOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Pagination logic
  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = filteredHolidays.slice(indexOfFirstEntry, indexOfLastEntry);
  const totalPages = Math.ceil(filteredHolidays.length / entriesPerPage);

  const getSelectedLocationName = () => {
    if (!selectedLocation) return '';
    const location = locations.find(loc => loc.id === parseInt(selectedLocation));
    return location ? location.name : '';
  };

  return (
    <div className="p-6 bg-gray-50">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          
          {selectedLocation && (
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Public Holidays for {getSelectedLocationName()}
            </h2>
          )}
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md flex items-center gap-2"
        >
          <Plus size={16} />
          Add Holiday
        </button>
      </div>

      {/* Holidays List Header */}
      <h3 className="text-lg font-semibold mb-4">Holidays List</h3>

      {/* Controls */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span>Row Per Page</span>
            <select
              value={entriesPerPage}
              onChange={(e) => setEntriesPerPage(Number(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>Entries</span>
          </div>
          
        <div className="flex items-center gap-2">
          <span>Location:</span>
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1"
          >
            <option value="">All Locations</option>
            {locations.map(location => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setShowLocationModal(true)}
            className="ml-2 flex items-center gap-1 px-2 py-1 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
            title="Add Location"
          >
            <Plus size={14} />
            <span className="text-sm">Add Location</span>
          </button>
        </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-3 text-left">Title</th>
              <th className="border border-gray-300 px-4 py-3 text-left">Date</th>
              <th className="border border-gray-300 px-4 py-3 text-left">Location</th>
              <th className="border border-gray-300 px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentEntries.map((holiday) => (
              <tr key={holiday.id} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-3 font-medium">{holiday.title}</td>
                <td className="border border-gray-300 px-4 py-3">{holiday.date}</td>
                <td className="border border-gray-300 px-4 py-3">{getLocationName(holiday.location_id)}</td>

                <td className="border border-gray-300 px-4 py-3 text-center">
                  <div className="flex justify-center gap-2">

                     <button className="text-blue-400 hover:text-gray-800"
                     onClick={() => handleViewDetails(holiday)}>
                      <Eye size={16} />
                    </button>
                    
                   
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <span className="text-sm text-gray-600">
          Showing {indexOfFirstEntry + 1} to {Math.min(indexOfLastEntry, filteredHolidays.length)} of {filteredHolidays.length} entries
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
          >
            Previous
          </button>
          {[...Array(totalPages)].map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index + 1)}
              className={`px-3 py-1 border border-gray-300 rounded ${
                currentPage === index + 1 ? 'bg-blue-500 text-white' : ''
              }`}
            >
              {index + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* Add Holiday Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-[2px] flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-white via-gray-50 to-blue-50 rounded-xl shadow-2xl max-w-sm w-full mx-4 max-h-[70vh] overflow-hidden border border-gray-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-gray-600 to-blue-600 rounded-t-xl">
              <h3 className="text-lg font-semibold text-white">Add Holiday</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-blue-100 hover:text-white transition-colors p-1 rounded-full hover:bg-blue-500"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="overflow-y-auto max-h-[calc(70vh-80px)]">
              <form onSubmit={handleSubmit} className="p-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location *
                    </label>
                    <select
                      name="location_id"
                      value={formData.location_id}
                      onChange={handleInputChange}
                      required
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="">Select Location</option>
                      {locations.map(location => (
                        <option key={location.id} value={location.id}>
                          {location.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      placeholder="Enter holiday title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date *
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      required
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>

                 

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status *
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      required
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
                  >
                    Add Holiday
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-[2px] flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-white via-gray-50 to-blue-50 rounded-xl shadow-2xl max-w-md w-full mx-4 max-h-[80vh] overflow-hidden border border-gray-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-gray-600 to-blue-600 rounded-t-xl">
              <h3 className="text-lg font-semibold text-white">
                {editingLocation ? 'Edit Location' : 'Add Location'}
              </h3>
              <button
                onClick={handleCloseLocationModal}
                className="text-blue-100 hover:text-white transition-colors p-1 rounded-full hover:bg-blue-500"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="overflow-y-auto max-h-[calc(80vh-80px)]">
              <form onSubmit={handleAddLocation} className="p-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location Name *
                  </label>
                  <input
                    type="text"
                    value={newLocationName}
                    onChange={(e) => setNewLocationName(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    placeholder="Enter location name"
                  />
                </div>
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCloseLocationModal}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
                  >
                    {editingLocation ? 'Update Location' : 'Add Location'}
                  </button>
                </div>
              </form>

              {/* Existing Locations List */}
              {locations.length > 0 && (
                <div className="px-4 pb-4">
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Existing Locations</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {locations.map((location) => (
                        <div
                          key={location.id}
                          className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                        >
                          <span className="text-sm text-gray-700">{location.name}</span>
                          <button
                            type="button"
                            onClick={() => handleEditLocation(location)}
                            className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                            title="Edit location"
                          >
                            <Edit size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

  <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
  <DialogContent className="max-w-lg">
    <DialogHeader>
      <DialogTitle>Holiday Details</DialogTitle>
      <DialogDescription>
        View the full information for the selected holiday
      </DialogDescription>
    </DialogHeader>

    {selectedHoliday && (
      <div className="space-y-2">
        <p>
          <strong>Title:</strong> {selectedHoliday.title}
        </p>
        <p>
          <strong>Date:</strong> {selectedHoliday.date}
        </p>
        <p>
          <strong>Location:</strong>{" "}
          {getLocationName(selectedHoliday.location_id)}
        </p>
      </div>
    )}
  </DialogContent>
</Dialog>


    </div>
  );
};

export default Holidays;