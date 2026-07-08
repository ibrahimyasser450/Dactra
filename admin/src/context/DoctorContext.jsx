import { useState, createContext } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

export const DoctorContext = createContext();

const DoctorContextProvider = (props) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const navigate = useNavigate();

  const [dToken, setDToken] = useState(
    localStorage.getItem("dToken") ? localStorage.getItem("dToken") : "",
  );
  const [appointments, setAppointments] = useState([]);
  const [dashData, setDashData] = useState(false);
  const [profileDta, setProfileData] = useState(false);

  // for expired token
  const handleUnauthorized = () => {
    localStorage.removeItem("dToken");
    setDToken("");
    navigate("/login");
  };

  const getAppointments = async () => {
    try {
      const { data } = await axios.get(
        `${backendUrl}/api/doctor/appointments`,
        {
          headers: {
            Authorization: `Bearer ${dToken}`,
          },
        },
      );
      if (data.success) {
        setAppointments(data.appointments);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        handleUnauthorized();
        return;
      }
      console.log(
        "error at getAppointments function at DoctorContext at admin:",
        error.message,
      );
      toast.error(error.message);
    }
  };

  const completeAppointment = async (appointmentId) => {
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/doctor/complete-appointment`,
        { appointmentId },
        {
          headers: {
            Authorization: `Bearer ${dToken}`,
          },
        },
      );
      if (data.success) {
        toast.success(data.message);
        getAppointments();
        getDashDataDoctor();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        handleUnauthorized();
        return;
      }
      console.log(
        "error at completeAppointment function at DoctorContext at admin:",
        error.message,
      );
      toast.error(error.message);
    }
  };

  const cancelAppointment = async (appointmentId) => {
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/doctor/cancel-appointment`,
        { appointmentId },
        {
          headers: {
            Authorization: `Bearer ${dToken}`,
          },
        },
      );
      if (data.success) {
        toast.success(data.message);
        getAppointments();
        getDashDataDoctor();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        handleUnauthorized();
        return;
      }
      console.log(
        "error at cancelAppointment function at DoctorContext at admin:",
        error.message,
      );
      toast.error(error.message);
    }
  };

  const getDashDataDoctor = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/doctor/dashboard`, {
        headers: {
          Authorization: `Bearer ${dToken}`,
        },
      });
      if (data.success) {
        setDashData(data.dashDataDoctor);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        handleUnauthorized();
        return;
      }
      console.log(
        "error at getDashDataDoctor function at DoctorContext at admin:",
        error.message,
      );
      toast.error(error.message);
    }
  };

  const getProfileData = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/doctor/profile`, {
        headers: {
          Authorization: `Bearer ${dToken}`,
        },
      });
      if (data.success) {
        setProfileData(data.profileData);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        handleUnauthorized();
        return;
      }
      console.log(
        "error at getprofileData function at DoctorContext at admin:",
        error.message,
      );
      toast.error(error.message);
    }
  };

  const value = {
    dToken,
    setDToken,
    backendUrl,
    appointments,
    setAppointments,
    getAppointments,
    completeAppointment,
    cancelAppointment,
    dashData,
    setDashData,
    getDashDataDoctor,
    profileDta,
    setProfileData,
    getProfileData,
  };

  return (
    <DoctorContext.Provider value={value}>
      {props.children}
    </DoctorContext.Provider>
  );
};

export default DoctorContextProvider;
