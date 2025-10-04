import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "http://127.0.0.1:8000/policies";

const CompanyPolicies = () => {
  const [sectionsByPolicy, setSectionsByPolicy] = useState({});
  const [policies, setPolicies] = useState([]);
  const [openSections, setOpenSections] = useState({});

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      const res = await axios.get(API_URL);
      setPolicies(res.data);

      const sectionsData = {};
      const openState = {};

      await Promise.all(
        res.data.map(async (policy) => {
          try {
            const jsonRes = await axios.get(policy.json_blob_url);
            sectionsData[policy.id] = jsonRes.data;
            openState[policy.id] = Array(jsonRes.data.length).fill(false);
          } catch {
            sectionsData[policy.id] = [];
            openState[policy.id] = [];
          }
        })
      );

      setSectionsByPolicy(sectionsData);
      setOpenSections(openState);
    } catch (err) {
      console.error("Failed to fetch policies:", err);
    }
  };

  const toggleSection = (policyId, idx) => {
    setOpenSections((prev) => {
      const newState = { ...prev };
      newState[policyId][idx] = !newState[policyId][idx];
      return newState;
    });
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-8 text-center">
        Company Policies
      </h1>

      <div className="grid grid-cols-1 gap-6">
        {policies.map((policy) =>
          (sectionsByPolicy[policy.id] || []).map((section, idx) => (
            <div
              key={`${policy.id}-${idx}`}
              className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300"
            >
              <h3
                className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2 cursor-pointer select-none"
                onClick={() => toggleSection(policy.id, idx)}
              >
                {section.heading}
              </h3>
              {openSections[policy.id][idx] && (
                <p className="text-gray-700 dark:text-gray-300">{section.content}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CompanyPolicies;
