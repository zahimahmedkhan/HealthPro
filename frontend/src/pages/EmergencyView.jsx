import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Spin, Empty } from "antd";
import {
  HeartOutlined,
  PhoneOutlined,
  MedicineBoxOutlined,
  AlertOutlined,
  SafetyCertificateOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "https://health-care-app-psi.vercel.app/api";

export default function EmergencyView() {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE}/emergency/public/${userId}`);
        if (res.data?.profile) {
          setProfile(res.data.profile);
        } else {
          setError("No emergency profile available");
        }
      } catch (err) {
        if (err.response?.status === 404) {
          setError("No emergency profile available for this user");
        } else {
          setError("Unable to load emergency profile");
        }
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#fef2f2" }}>
        <div className="text-center">
          <Spin size="large" />
          <p className="mt-4 text-lg" style={{ color: "#991b1b" }}>Loading emergency profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "#fef2f2" }}>
        <div className="text-center max-w-md">
          <div className="mb-4">
            <AlertOutlined style={{ fontSize: 64, color: "#dc2626" }} />
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: "#991b1b" }}>
            No Emergency Profile Available
          </h1>
          <p className="text-lg" style={{ color: "#b91c1c" }}>
            {error || "This user has not created an emergency profile yet."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6" style={{ backgroundColor: "#fef2f2" }}>
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-3" style={{ backgroundColor: "#dc2626" }}>
            <HeartOutlined style={{ fontSize: 32, color: "white" }} />
          </div>
          <h1 className="text-3xl font-bold" style={{ color: "#991b1b" }}>
            Emergency Profile
          </h1>
          <p className="text-lg mt-1" style={{ color: "#b91c1c" }}>
            {profile.userName}
          </p>
        </div>

        {/* Blood Group - Big and prominent */}
        <div
          className="rounded-xl p-6 mb-6 text-center"
          style={{ backgroundColor: "#dc2626", color: "white" }}
        >
          <p className="text-sm font-semibold uppercase tracking-wide mb-1 opacity-90">
            Blood Group
          </p>
          <p className="text-5xl font-bold">{profile.bloodGroup}</p>
        </div>

        {/* Organ Donor Badge */}
        {profile.organDonor && (
          <div
            className="rounded-xl p-4 mb-6 flex items-center gap-3"
            style={{ backgroundColor: "#059669", color: "white" }}
          >
            <SafetyCertificateOutlined style={{ fontSize: 28 }} />
            <div>
              <p className="text-lg font-bold">Organ Donor</p>
              <p className="text-sm opacity-90">Registered organ donor</p>
            </div>
          </div>
        )}

        {/* Allergies */}
        {profile.allergies && profile.allergies.length > 0 && (
          <div
            className="rounded-xl p-5 mb-6"
            style={{ backgroundColor: "white", border: "2px solid #fca5a5" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <AlertOutlined style={{ color: "#dc2626", fontSize: 22 }} />
              <h2 className="text-xl font-bold" style={{ color: "#991b1b" }}>
                Allergies
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.allergies.map((allergy, index) => (
                <span
                  key={index}
                  className="inline-block px-4 py-2 rounded-full text-base font-semibold"
                  style={{ backgroundColor: "#fef2f2", color: "#991b1b", border: "1px solid #fca5a5" }}
                >
                  {allergy}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Medications */}
        {profile.currentMedications && profile.currentMedications.length > 0 && (
          <div
            className="rounded-xl p-5 mb-6"
            style={{ backgroundColor: "white", border: "2px solid #93c5fd" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <MedicineBoxOutlined style={{ color: "#2563eb", fontSize: 22 }} />
              <h2 className="text-xl font-bold" style={{ color: "#1e40af" }}>
                Current Medications
              </h2>
            </div>
            <ul className="space-y-2">
              {profile.currentMedications.map((med, index) => (
                <li
                  key={index}
                  className="text-lg font-medium px-3 py-2 rounded-lg"
                  style={{ backgroundColor: "#eff6ff", color: "#1e3a8a" }}
                >
                  {med}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Chronic Conditions */}
        {profile.chronicConditions && profile.chronicConditions.length > 0 && (
          <div
            className="rounded-xl p-5 mb-6"
            style={{ backgroundColor: "white", border: "2px solid #fcd34d" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <HeartOutlined style={{ color: "#d97706", fontSize: 22 }} />
              <h2 className="text-xl font-bold" style={{ color: "#92400e" }}>
                Chronic Conditions
              </h2>
            </div>
            <ul className="space-y-2">
              {profile.chronicConditions.map((condition, index) => (
                <li
                  key={index}
                  className="text-lg font-medium px-3 py-2 rounded-lg"
                  style={{ backgroundColor: "#fefce8", color: "#78350f" }}
                >
                  {condition}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Emergency Contacts */}
        {profile.emergencyContacts && profile.emergencyContacts.length > 0 && (
          <div
            className="rounded-xl p-5 mb-6"
            style={{ backgroundColor: "white", border: "2px solid #86efac" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <PhoneOutlined style={{ color: "#16a34a", fontSize: 22 }} />
              <h2 className="text-xl font-bold" style={{ color: "#166534" }}>
                Emergency Contacts
              </h2>
            </div>
            <div className="space-y-3">
              {profile.emergencyContacts.map((contact, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg"
                  style={{ backgroundColor: "#f0fdf4" }}
                >
                  <p className="text-lg font-bold" style={{ color: "#166534" }}>
                    {contact.name}
                  </p>
                  <p className="text-base" style={{ color: "#15803d" }}>
                    {contact.relation}
                  </p>
                  <a
                    href={`tel:${contact.phone}`}
                    className="inline-flex items-center gap-2 text-xl font-bold mt-2"
                    style={{ color: "#16a34a", textDecoration: "none" }}
                  >
                    <PhoneOutlined />
                    {contact.phone}
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Additional Notes */}
        {profile.additionalNotes && (
          <div
            className="rounded-xl p-5 mb-6"
            style={{ backgroundColor: "white", border: "2px solid #d1d5db" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <FileTextOutlined style={{ color: "#6b7280", fontSize: 22 }} />
              <h2 className="text-xl font-bold" style={{ color: "#374151" }}>
                Additional Notes
              </h2>
            </div>
            <p className="text-lg" style={{ color: "#4b5563" }}>
              {profile.additionalNotes}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-sm" style={{ color: "#9ca3af" }}>
            Generated by HealthPro Emergency Profile System
          </p>
        </div>
      </div>
    </div>
  );
}
