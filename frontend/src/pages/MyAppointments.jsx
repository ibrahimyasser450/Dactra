import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate, useSearchParams } from "react-router-dom";

const MyAppointments = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const { backendUrl, token, setToken, getDoctorsData } =
    useContext(AppContext);
  const [appointments, setAppointments] = useState([]);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const slotDateFormatter = (slotDate) => {
    const [day, month, year] = slotDate.split("-");
    const formattedDate = `${day} ${months[parseInt(month) - 1]} ${year}`;
    return formattedDate;
  };

  // for expired token
  const handleUnauthorized = () => {
    localStorage.removeItem("token");
    setToken("");
    navigate("/");
  };
  const getUserListAppointments = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/user/appointments`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (data.success) {
        setAppointments(data.appointments);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        handleUnauthorized();
        return;
      }
      console.log(
        "error at getUserListAppointments function at MyAppointments at frontend:",
        error.message,
      );
      toast.error(error.message);
    }
  };

  const cancelAppointment = async (appointmentId) => {
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/user/cancel-appointment`,
        { appointmentId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (data.success) {
        toast.success(data.message);
        getUserListAppointments();
        getDoctorsData();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        handleUnauthorized();
        return;
      }
      console.log(
        "error at cancelAppointment function at MyAppointments at frontend:",
        error.message,
      );
      toast.error(error.message);
    }
  };

  const paymentMyAppointment = async (appointmentId) => {
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/user/create-payment-session`,
        { appointmentId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (data.success) {
        window.location.assign(data.url);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        handleUnauthorized();
        return;
      }
      console.log(
        "error at paymentMyAppointment function at MyAppointments at frontend:",
        error.message,
      );
      toast.error(error.message);
    }
  };

  useEffect(() => {
    const sessionId = searchParams.get("sessionId");
    const appointmentId = searchParams.get("appointmentId");

    const init = async () => {
      if (!token) {
        navigate("/");
        return;
      }

      // 1. ALWAYS load appointments first or after payment
      await getUserListAppointments();

      // 2. If coming from Stripe payment → verify it
      if (sessionId && appointmentId) {
        try {
          const { data } = await axios.post(
            `${backendUrl}/api/user/verify-payment`,
            { sessionId, appointmentId },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );

          if (data.success) {
            toast.success(data.message);

            // refresh updated appointments
            await getUserListAppointments();

            // remove query params (VERY IMPORTANT)
            navigate("/my-appointments", { replace: true });
          } else {
            toast.error(data.message);
          }
        } catch (error) {
          toast.error(error.message);
        }
      }
    };

    init();
  }, [token]);

  return (
    <div>
      <p className="pb-3 mt-12 font-medium text-zinc-700 border-b">
        My appointments
      </p>
      <div>
        {appointments.map((item, index) => (
          <div
            className="grid grid-cols-[1fr_2fr] gap-4 sm:flex sm:gap-6 py-2 border-b"
            key={index}
          >
            <div>
              <img
                className="w-32 ng-indigo-50"
                src={item.docId.image}
                alt="doctor_image"
              />
            </div>
            <div className="flex-1 text-sm text-zinc-600">
              <p className="text-neutral-800 font-semibold">
                {item.docId.name}
              </p>
              <p>{item.docId.specialty}</p>
              <p className="text-zinc-700 font-medium mt-1">Address:</p>
              <p className="text-xs">{item.docId.address.line1}</p>
              <p className="text-xs">{item.docId.address.line2}</p>
              <p className="text-xs mt-1">
                <span className="text-sm text-neutral-700 font-medium">
                  Date & Time:
                </span>
                {slotDateFormatter(item.slotDate)} | {item.slotTime}
              </p>
            </div>
            <div></div>
            <div className="flex flex-col gap-2 justify-center">
              {!item.cancelled && item.payment && item.isCompleted && (
                <button
                  onClick={() => paymentMyAppointment(item._id)}
                  className="sm:min-w-48 py-2 border rounded border-green-500 text-green-500"
                >
                  Completed & Paid
                </button>
              )}
              {!item.cancelled && item.payment && !item.isCompleted && (
                <button
                  onClick={() => paymentMyAppointment(item._id)}
                  className="sm:min-w-48 py-2 border rounded text-stone-500 bg-indigo-200"
                >
                  Paid
                </button>
              )}
              {!item.cancelled && !item.payment && (
                <button
                  onClick={() => paymentMyAppointment(item._id)}
                  className="text-sm text-stone-500 text-center sm:min-w-48 py-2 border hover:bg-primary hover:text-white transition-all duration-300"
                >
                  Pay Online
                </button>
              )}
              {!item.cancelled && !item.isCompleted && (
                <button
                  className="text-sm text-stone-500 text-center sm:min-w-48 py-2 border hover:bg-red-600 hover:text-white transition-all duration-300"
                  onClick={() => cancelAppointment(item._id)}
                >
                  Cancel Appointment
                </button>
              )}
              {item.cancelled && !item.isCompleted && (
                <button className="sm:min-w-48 py-2 border border-red-500 rounded text-red-500">
                  Appointment Cancelled
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyAppointments;
