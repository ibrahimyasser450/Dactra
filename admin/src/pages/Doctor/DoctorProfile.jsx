import React, { useEffect, useContext, useState } from "react";
import { DoctorContext } from "../../context/DoctorContext";
import { AppContext } from "../../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
const DoctorProfile = () => {
  const {
    dToken,
    setDToken,
    backendUrl,
    profileDta,
    setProfileData,
    getProfileData,
  } = useContext(DoctorContext);
  const { currency } = useContext(AppContext);
  const navigate = useNavigate();

  const [isEdit, setIsEdit] = useState(false);

  const updateProfile = async () => {
    try {
      const updateData = {
        address: profileDta.address,
        fees: profileDta.fees,
        available: profileDta.available,
      };

      const { data } = await axios.put(
        `${backendUrl}/api/doctor/update-profile`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${dToken}`,
          },
        },
      );
      if (data.success) {
        toast.success(data.message);
        setIsEdit(false);
        getProfileData();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("dToken");
        setDToken("");
        navigate("/login");
        return;
      }
      console.log(
        "error at updateProfile function at DoctorProfile.jsx at admin:",
        error.message,
      );
      toast.error(error.message);
    }
  };

  useEffect(() => {
    if (dToken) {
      getProfileData();
    }
  }, [dToken]);
  return (
    profileDta && (
      <div>
        <div className="flex flex-col gap-4 m-5">
          <div>
            <img
              className="bg-primary/80 w-full sm:max-w-64 rounded-lg"
              src={profileDta.image}
              alt="doctor image"
            />
          </div>

          <div className="flex-1 vorder border-stone-100 rounded-lg p-8 py-7 bg-white">
            {/* --- Doc Info: name, degree, experience */}

            <p className="flex items-center gap-2 text-3xl font-medium text-gray-700">
              {profileDta.name}
            </p>
            <div className="flex items-center gap-2 mt-1 text-gray-600">
              <p>
                {profileDta.degree} - {profileDta.specialty}
              </p>
              <button className="py-0.5 px-2 border text-xs rounded-full">
                {profileDta.experience}
              </button>
            </div>

            {/* ----- Doc About ------ */}
            <div>
              <p className="flex items-center gap-1 text-sm font-medium text-neutral-800 mt-3">
                About:
              </p>
              <p className="text-sm text-gray-600 max-w-[700px] mt-1">
                {profileDta.about}
              </p>
            </div>

            <p className="text-gray-600 font-medium mt-4">
              Appointments fee:{" "}
              <span className="text-gray-800">
                {currency}{" "}
                {isEdit ? (
                  <input
                    type="number"
                    value={profileDta.fees}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        fees: e.target.value,
                      }))
                    }
                  />
                ) : (
                  profileDta.fees
                )}
              </span>
            </p>

            <div className="flex gap-2 py-2">
              <p>Address:</p>
              <p className="text-sm">
                {isEdit ? (
                  <input
                    type="text"
                    value={profileDta.address.line1}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        address: { ...prev.address, line1: e.target.value },
                      }))
                    }
                  />
                ) : (
                  profileDta.address.line1
                )}
                <br />
                {isEdit ? (
                  <input
                    type="text"
                    value={profileDta.address.line2}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        address: { ...prev.address, line2: e.target.value },
                      }))
                    }
                  />
                ) : (
                  profileDta.address.line2
                )}
              </p>
            </div>

            <div className="flex gap-1 pt-2">
              <input
                onChange={() =>
                  isEdit &&
                  setProfileData((prev) => ({
                    ...prev,
                    available: !prev.available,
                  }))
                }
                checked={profileDta.available}
                type="checkbox"
                name=""
                id=""
              />
              <label htmlFor="">Available</label>
            </div>

            {isEdit ? (
              <button
                onClick={updateProfile}
                className="px-4 py-1 border border-primary text-sm rounded-full mt-5 hover:bg-primary hover:text-white transition-all"
              >
                Save
              </button>
            ) : (
              <button
                onClick={() => setIsEdit(true)}
                className="px-4 py-1 border border-primary text-sm rounded-full mt-5 hover:bg-primary hover:text-white transition-all"
              >
                Edit
              </button>
            )}
          </div>
        </div>
      </div>
    )
  );
};

export default DoctorProfile;
