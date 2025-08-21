import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { cn } from "../lib/utils";

export const Profile = ({ dark }) => {
  const { user } = useAuth();
  const [isAnimated, setIsAnimated] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const fileInputRef = useRef(null);

  // Profile state
  const [profile, setProfile] = useState({
    displayName: user?.displayName || "",
    email: user?.email || "",
    bio: "Hey there! I'm using Chat Now to connect with awesome people.",
    location: "",
    joinDate: user?.metadata?.creationTime || new Date().toISOString(),
    theme: "system",
    notifications: {
      messages: true,
      mentions: true,
      groupUpdates: true,
      sounds: true,
    },
    privacy: {
      showOnline: true,
      showLastSeen: true,
      allowDirectMessages: true,
    },
    profileImage: user?.photoURL || null,
  });

  const [tempProfile, setTempProfile] = useState({ ...profile });

  useEffect(() => {
    setIsAnimated(true);
    // Load profile from localStorage if available
    const savedProfile = localStorage.getItem("chatNowProfile");
    if (savedProfile) {
      const parsed = JSON.parse(savedProfile);
      setProfile({ ...profile, ...parsed });
      setTempProfile({ ...profile, ...parsed });
    }
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setProfile({ ...tempProfile });
      localStorage.setItem("chatNowProfile", JSON.stringify(tempProfile));
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setTempProfile({ ...profile });
    setIsEditing(false);
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setTempProfile((prev) => ({ ...prev, profileImage: e.target.result }));
      };
      reader.readAsDataURL(file);
    }
    setShowImageUpload(false);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div
      className="relative flex size-full min-h-screen flex-col group/design-root overflow-x-hidden"
      style={{ fontFamily: '"Work Sans", "Noto Sans", sans-serif' }}
    >
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"></div>
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-br from-blue-400/30 to-purple-400/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-gradient-to-br from-emerald-400/30 to-blue-400/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 layout-container flex h-full grow flex-col">
        <div className="px-4 md:px-40 flex flex-1 justify-center py-8">
          <div
            className={`layout-content-container flex flex-col max-w-4xl flex-1 space-y-8 transition-all duration-1000 ${
              isAnimated
                ? "translate-y-0 opacity-100"
                : "translate-y-8 opacity-0"
            }`}
          >
            {/* Header */}
            <div className="text-center py-8">
              <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-4">
                Profile Settings
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Manage your profile, preferences, and privacy settings
              </p>
            </div>

            {/* Profile Card */}
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-3xl p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-xl">
              {/* Profile Header */}
              <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
                {/* Profile Image */}
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 p-1 shadow-2xl">
                    <div
                      className="w-full h-full rounded-full bg-center bg-cover bg-no-repeat"
                      style={{
                        backgroundImage: `url("${
                          tempProfile.profileImage ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            tempProfile.displayName || "User"
                          )}&background=3b82f6&color=ffffff&size=200`
                        }")`,
                      }}
                    />
                  </div>
                  {isEditing && (
                    <button
                      onClick={() => setShowImageUpload(true)}
                      className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    >
                      <svg
                        className="w-8 h-8 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Profile Info */}
                <div className="flex-1 text-center md:text-left space-y-4">
                  {isEditing ? (
                    <div className="space-y-4">
                      <input
                        type="text"
                        value={tempProfile.displayName}
                        onChange={(e) =>
                          setTempProfile((prev) => ({
                            ...prev,
                            displayName: e.target.value,
                          }))
                        }
                        className="text-2xl font-bold bg-transparent border-b-2 border-gray-300 dark:border-gray-600 focus:border-blue-500 outline-none px-2 py-1 text-gray-900 dark:text-white"
                        placeholder="Display Name"
                      />
                      <textarea
                        value={tempProfile.bio}
                        onChange={(e) =>
                          setTempProfile((prev) => ({
                            ...prev,
                            bio: e.target.value,
                          }))
                        }
                        className="w-full bg-gray-50/50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200 dark:border-gray-600 focus:border-blue-500 outline-none resize-none text-gray-700 dark:text-gray-300"
                        rows="3"
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                        {profile.displayName || "Anonymous User"}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 leading-relaxed max-w-md">
                        {profile.bio}
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                          </svg>
                          {profile.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Joined {formatDate(profile.joinDate)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      Edit Profile
                    </button>
                  ) : (
                    <div className="flex gap-3">
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 disabled:from-gray-400 disabled:to-gray-500 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 disabled:scale-100"
                      >
                        {isSaving ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={handleCancel}
                        className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-300 font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Settings Sections */}
              <div className="space-y-8">

                {/* Notification Settings */}
                <div className="border-t border-gray-200/50 dark:border-gray-700/50 pt-8">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="p-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg text-white">
                      🔔
                    </span>
                    Notification Settings
                  </h3>
                  <div className="space-y-4">
                    {Object.entries({
                      messages: "New Messages",
                      mentions: "Mentions & Replies",
                      groupUpdates: "Group Updates",
                      sounds: "Sound Notifications",
                    }).map(([key, label]) => (
                      <label
                        key={key}
                        className="flex items-center justify-between p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50"
                      >
                        <span className="font-medium text-gray-900 dark:text-white">
                          {label}
                        </span>
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={tempProfile.notifications[key]}
                            onChange={(e) =>
                              setTempProfile((prev) => ({
                                ...prev,
                                notifications: {
                                  ...prev.notifications,
                                  [key]: e.target.checked,
                                },
                              }))
                            }
                            className="sr-only"
                          />
                          <div
                            className={cn(
                              "w-12 h-6 rounded-full transition-colors duration-300 cursor-pointer",
                              tempProfile.notifications[key]
                                ? "bg-blue-500"
                                : "bg-gray-300 dark:bg-gray-600"
                            )}
                            onClick={() =>
                              setTempProfile((prev) => ({
                                ...prev,
                                notifications: {
                                  ...prev.notifications,
                                  [key]: !prev.notifications[key],
                                },
                              }))
                            }
                          >
                            <div
                              className={cn(
                                "w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 mt-0.5",
                                tempProfile.notifications[key]
                                  ? "transform translate-x-6"
                                  : "ml-0.5"
                              )}
                            />
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Privacy Settings */}
                <div className="border-t border-gray-200/50 dark:border-gray-700/50 pt-8">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg text-white">
                      🔒
                    </span>
                    Privacy Settings
                  </h3>
                  <div className="space-y-4">
                    {Object.entries({
                      showOnline: "Show Online Status",
                      showLastSeen: "Show Last Seen",
                      allowDirectMessages: "Allow Direct Messages",
                    }).map(([key, label]) => (
                      <label
                        key={key}
                        className="flex items-center justify-between p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50"
                      >
                        <span className="font-medium text-gray-900 dark:text-white">
                          {label}
                        </span>
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={tempProfile.privacy[key]}
                            onChange={(e) =>
                              setTempProfile((prev) => ({
                                ...prev,
                                privacy: {
                                  ...prev.privacy,
                                  [key]: e.target.checked,
                                },
                              }))
                            }
                            className="sr-only"
                          />
                          <div
                            className={cn(
                              "w-12 h-6 rounded-full transition-colors duration-300 cursor-pointer",
                              tempProfile.privacy[key]
                                ? "bg-green-500"
                                : "bg-gray-300 dark:bg-gray-600"
                            )}
                            onClick={() =>
                              setTempProfile((prev) => ({
                                ...prev,
                                privacy: {
                                  ...prev.privacy,
                                  [key]: !prev.privacy[key],
                                },
                              }))
                            }
                          >
                            <div
                              className={cn(
                                "w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 mt-0.5",
                                tempProfile.privacy[key]
                                  ? "transform translate-x-6"
                                  : "ml-0.5"
                              )}
                            />
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Account Stats */}
                <div className="border-t border-gray-200/50 dark:border-gray-700/50 pt-8">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg text-white">
                      📊
                    </span>
                    Account Statistics
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-500/5 dark:to-purple-500/5 rounded-2xl border border-blue-200/20 dark:border-blue-700/20">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        127
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Messages Sent
                      </div>
                    </div>
                    <div className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 dark:from-green-500/5 dark:to-emerald-500/5 rounded-2xl border border-green-200/20 dark:border-green-700/20">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        8
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Rooms Joined
                      </div>
                    </div>
                    <div className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 dark:from-purple-500/5 dark:to-pink-500/5 rounded-2xl border border-purple-200/20 dark:border-purple-700/20">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        15
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Days Active
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Upload Modal */}
      {showImageUpload && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Update Profile Picture
            </h3>
            <div className="space-y-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-500 transition-colors duration-300 text-center"
              >
                <svg
                  className="w-8 h-8 mx-auto mb-2 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-gray-600 dark:text-gray-400">
                  Click to upload image
                </p>
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowImageUpload(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />
    </div>
  );
};
