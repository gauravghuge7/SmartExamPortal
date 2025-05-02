import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../services/axiosInstance';
import toast, { Toaster } from 'react-hot-toast';
import UniversityDashboardLayout from '../dashboard/UniversityDashboardLayout';

const UniversityProfile = () => {
  const navigate = useNavigate();
  const [university, setUniversity] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    fetchUniversityDetails();
  }, []);

  const fetchUniversityDetails = async () => {
    try {
      setLoading(true);
      toast.loading('Fetching university details...');
      const res = await axiosInstance.get('/university/auth/getuniversityDetails');
      const uni = res.data.data.university;
      setUniversity(uni);
      setFormData({
        universityName: uni.universityName,
        universityPhone: uni.universityPhone,
        universityAddress: uni.universityAddress,
      });
      toast.dismiss();
    } catch (err) {
      toast.dismiss();
      toast.error('Failed to load university details');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    try {
      toast.loading('Saving...');
      await axiosInstance.put('/university/profile/update', formData);
      toast.dismiss();
      toast.success('Profile updated!');
      setEditMode(false);
      fetchUniversityDetails();
    } catch (err) {
      toast.dismiss();
      toast.error('Save failed');
    }
  };

  const formatDate = (date) => new Date(date).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <UniversityDashboardLayout>
      <Toaster />
      <div className="max-w-5xl mx-auto p-6 md:p-10 space-y-10">
        <h1 className="text-4xl font-bold text-green-700">University Profile</h1>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : university ? (
          <>
            {/* Header / Banner */}
            <section className="flex items-center space-x-6">
              <img
                src={university.universityLogo?.secure_url}
                alt="University Logo"
                className="w-28 h-28 rounded-full object-cover border-4 border-green-500"
              />
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {formData.universityName}
                </h2>
                <p className="text-sm text-gray-500">{university.universityEmail}</p>
              </div>
            </section>

            {/* Contact Info */}
            <section>
              <h3 className="text-lg font-semibold text-green-600 border-b pb-1 mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">Phone</label>
                  <input
                    name="universityPhone"
                    value={formData.universityPhone}
                    onChange={handleChange}
                    disabled={!editMode}
                    className="w-full border rounded-md p-2 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Email</label>
                  <input
                    value={university.universityEmail}
                    disabled
                    className="w-full border rounded-md p-2 bg-gray-100"
                  />
                </div>
              </div>
            </section>

            {/* Address Info */}
            <section>
              <h3 className="text-lg font-semibold text-green-600 border-b pb-1 mb-4">Address</h3>
              <div>
                <label className="block text-sm font-medium">University Address</label>
                <input
                  name="universityAddress"
                  value={formData.universityAddress}
                  onChange={handleChange}
                  disabled={!editMode}
                  className="w-full border rounded-md p-2 disabled:bg-gray-100"
                />
              </div>
            </section>

            {/* Metadata */}
            <section>
              <h3 className="text-lg font-semibold text-green-600 border-b pb-1 mb-4">System Info</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">Created At</label>
                  <input
                    value={formatDate(university.createdAt)}
                    disabled
                    className="w-full border rounded-md p-2 bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Last Updated</label>
                  <input
                    value={formatDate(university.updatedAt)}
                    disabled
                    className="w-full border rounded-md p-2 bg-gray-100"
                  />
                </div>
              </div>
            </section>

            {/* Actions */}
            <section className="pt-4 flex gap-4">
              {!editMode ? (
                <button
                  onClick={() => setEditMode(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  Edit Profile
                </button>
              ) : (
                <>
                  <button
                    onClick={handleSave}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditMode(false);
                      setFormData({
                        universityName: university.universityName,
                        universityPhone: university.universityPhone,
                        universityAddress: university.universityAddress,
                      });
                    }}
                    className="bg-gray-400 text-white px-4 py-2 rounded-md hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                </>
              )}
            </section>
          </>
        ) : (
          <p className="text-gray-500">No university data found.</p>
        )}
      </div>
    </UniversityDashboardLayout>
  );
};

export default UniversityProfile;
