import { createContext, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
export const AdminContext = createContext();

const AdminContextProvider = (props) => {
  const [aToken, setAToken] = useState(
    localStorage.getItem("aToken") ? localStorage.getItem("aToken") : "",
  );
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [dashData, setDashData] = useState(false);

  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const navigate = useNavigate();
  // for expired token
  const handleUnauthorized = () => {
    localStorage.removeItem("aToken");
    setAToken("");
    navigate("/login");
  };
  const getAllDoctors = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/admin/all-doctors`, {
        headers: {
          Authorization: `Bearer ${aToken}`,
        },
      });
      if (data.success) {
        setDoctors(data.doctors);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        handleUnauthorized();
        return;
      }
      console.log(
        "error at getAllDoctors function at AdminContext at admin:",
        error.message,
      );
      toast.error(error.message);
    }
  };

  const changeAvailability = async (docId) => {
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/admin/change-availability`,
        { docId },
        {
          headers: {
            Authorization: `Bearer ${aToken}`,
          },
        },
      );
      if (data.success) {
        toast.success(data.message);
        getAllDoctors();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        handleUnauthorized();
        return;
      }
      console.log(
        "error at changeAvailability function at AdminContext at admin:",
        error.message,
      );
      toast.error(error.message);
    }
  };

  const getAllAppointments = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/admin/appointments`, {
        headers: {
          Authorization: `Bearer ${aToken}`,
        },
      });
      if (data.seccess) {
        setAppointments(data.appointments);
      } else {
        toast.error(data.me);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        handleUnauthorized();
        return;
      }
      console.log(
        "error at getAllAppointments function at AdminContext at admin:",
        error.message,
      );
      toast.error(error.message);
    }
  };

  const cancelAppointment = async (appointmentId) => {
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/admin/cancel-appointment`,
        { appointmentId },
        {
          headers: {
            Authorization: `Bearer ${aToken}`,
          },
        },
      );

      if (data.success) {
        toast.success(data.message);
        getAllAppointments();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        handleUnauthorized();
        return;
      }
      console.log(
        "error at cancelAppointment function at AdminContext at admin:",
        error.message,
      );
      toast.error(error.message);
    }
  };

  const getDashData = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/admin/dashboard`, {
        headers: {
          Authorization: `Bearer ${aToken}`,
        },
      });

      if (data.success) {
        setDashData(data.dashboardData);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        handleUnauthorized();
        return;
      }
      console.log(
        "error at getDashData function at AdminContext at admin:",
        error.message,
      );
      toast.error(error.message);
    }
  };

  const value = {
    aToken,
    setAToken,
    backendUrl,
    doctors,
    getAllDoctors,
    changeAvailability,
    appointments,
    setAppointments,
    getAllAppointments,
    cancelAppointment,
    dashData,
    getDashData,
  };

  return (
    <AdminContext.Provider value={value}>
      {props.children}
    </AdminContext.Provider>
  );
};

export default AdminContextProvider;
