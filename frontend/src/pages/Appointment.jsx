import React, { useEffect, useContext, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { assets } from "../assets/assets";
import RelatedDoctors from "../components/RelatedDoctors";
import { toast } from "react-toastify";
import axios from "axios";

const Appointment = () => {
  const { docId } = useParams();
  const {
    doctors,
    currencySymbol,
    backendUrl,
    token,
    setToken,
    getDoctorsData,
  } = useContext(AppContext);

  const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  const navigate = useNavigate();

  const [docInfo, setDocInfo] = useState(null);
  const [docSlots, setDocSlots] = useState([]); //2D array (array of arrays) ex: [[{ datetime: "2026-07-02T10:00:00", time: "10:00 AM" }],[]]
  const [slotIndex, setSlotIndex] = useState(0); // 0 => Today, 1 => Tomorrow, 2 => Day after tomorrow
  const [slotTime, setSlotTime] = useState(""); // start from 10:00 AM to 9:00 PM with 30 minutes interval

  const fetchDocInfo = async () => {
    const docInfo = await doctors.find((doc) => doc._id === docId);
    setDocInfo(docInfo);
  };

  // Get available slots for the doctor for the next 7 days
  const getAvailableSlots = async () => {
    setDocSlots([]);

    // getting current date
    let today = new Date(); // if today is 2026-07-02, then today.getDate() = 2 (day), today.getMonth() = 6 (July), today.getFullYear() = 2026

    for (let i = 0; i < 7; i++) {
      // getting date with index
      let currentDate = new Date(today); // if today is 2026-07-02 , 11:15 AM, when 1 = 0
      // when i = 0 currentDate = July 2, when i = 1 currentDate = July 3, when i = 2 currentDate = July 4
      currentDate.setDate(today.getDate() + i);

      // fixed stopping point.
      let endTime = new Date();
      endTime.setDate(today.getDate() + i);
      endTime.setHours(21, 0, 0, 0); // 21 = 9:00 PM
      // here endTime = 2026-07-02 , 9:00 PM, when i = 0

      // just today
      if (today.getDate() === currentDate.getDate()) {
        // Current hour = 3 PM Start from 4 PM if less than 10 AM, then start from 10 AM
        currentDate.setHours(
          currentDate.getHours() > 10 ? currentDate.getHours() + 1 : 10,
        );
        // if current minutes is greater than 30, then set minutes to 30, else set minutes to 0
        currentDate.setMinutes(currentDate.getMinutes() > 30 ? 30 : 0);
        // so if time is 3:15 PM, time will be = 4:00 PM, if time is 3:45 PM, time will be = 4:30 PM, if time is 9:15 AM, the time will be = 10:00 AM
      } else {
        // for tomorrow and day after tomorrow, start from 10:00 AM
        currentDate.setHours(10);
        currentDate.setMinutes(0);
      }
      // here currentDate = 2026-07-02 , 12:00 PM, when i = 0

      let timeSlots = [];

      // while 12:00 PM < 9:00 PM, keep adding slots to the array like [12:30 PM, 1:00 PM, ...,8:30 PM]
      while (currentDate < endTime) {
        let formattedTime = currentDate.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });

        // to push only available slots so the user will show only available slots.
        let day = currentDate.getDate();
        let month = currentDate.getMonth() + 1;
        let year = currentDate.getFullYear();
        const slotDate = day + "-" + month + "-" + year;
        const slotTime = formattedTime;
        const isSlotAvailable = docInfo?.slots_booked[slotDate]?.includes(
          slotTime,
        )
          ? false
          : true;
        if (isSlotAvailable) {
          // add slot to array LIKE { datetime: "2026-07-02T10:00:00", time: "10:00 AM" }
          timeSlots.push({
            datetime: new Date(currentDate),
            time: formattedTime,
          });
        }
        // increment current time by 30 minutes
        currentDate.setMinutes(currentDate.getMinutes() + 30);
      }
      setDocSlots((prev) => [...prev, timeSlots]);
    }
  };

  const bookAppointment = async () => {
    if (!token) {
      toast.warn("Please login to book an appointment");
      return navigate("/login");
    }
    try {
      const date = docSlots[slotIndex][0].datetime;
      let day = date.getDate();
      let month = date.getMonth() + 1;
      let year = date.getFullYear();
      const slotDate = day + "-" + month + "-" + year; // 2-7-2026

      const { data } = await axios.post(
        `${backendUrl}/api/user/book-appointment`,
        {
          docId,
          slotDate,
          slotTime,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (data.success) {
        toast.success(data.message);
        getDoctorsData();
        navigate("/my-appointments");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        setToken("");
        navigate("/");
        return;
      }
      console.log(
        "error at bookAppointment function at Appointment.jsx at frontend:",
        error.message,
      );
      toast.error(error.response?.data?.message || error.message);
    }
  };

  useEffect(() => {
    fetchDocInfo();
  }, [doctors, docId]);

  useEffect(() => {
    getAvailableSlots();
  }, [docInfo]);

  return (
    docInfo && (
      <div>
        {/* ------------------- Doctor Details ------------------- */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div>
            <img
              className="bg-primary w-full sm:max-w-72 rounded-lg"
              src={docInfo.image}
              alt={docInfo.name}
            />
          </div>
          <div className="flex-1 border border-gray-400 rounded-lg p-8 py-7 bg-white mx-2 sm:mx-0 mt-[-80px] sm:mt-0">
            {/* ------------------ Doc Info ------------------- */}
            <p className="flex items-center gap-2 text-2xl font-medium text-gray-900">
              {docInfo.name}
              <img className="w-5" src={assets.verified_icon} alt="verified" />
            </p>
            <div className="flex items-center gap-2 text-sm mt-1 text-gray-600">
              <p>
                {docInfo.degree} - {docInfo.specialty}
              </p>
              <button className="py-0.5 px-2 border text-xs rounded-full">
                {docInfo.experience}
              </button>
            </div>

            {/* -------------  Doctor About ------------- */}
            <div>
              <p className="flex items-center gap-1 text-sm font-medium text-gray-900 mt-3">
                About <img src={assets.info_icon} alt="info" />
              </p>
              <p className="text-sm text-gray-500 max-w-[700px] mt-1">
                {docInfo.about}
              </p>
            </div>
            <p className="text-gray-500 font-medium mt-4">
              Appointment fee:
              <span className="text-gray-600">
                {currencySymbol}
                {docInfo.fees}
              </span>
            </p>
          </div>
        </div>
        {/* ---------------- Booking slots --------------- */}
        <div className="sm:ml-72 sm:pl-4 mt-4 font-medium text-gray-700">
          <p>Booking slots</p>
          <div className="flex gap-3 items-center w-full overflow-x-scroll mt-4">
            {docSlots.length &&
              docSlots.map((item, index) => (
                <div
                  onClick={() => setSlotIndex(index)}
                  className={`text-center py-6 min-w-16 rounded-full cursor-pointer ${slotIndex === index ? "bg-primary text-white" : "border border-gray-200"}`}
                  key={index}
                >
                  <p>{item[0] && daysOfWeek[item[0].datetime.getDay()]}</p>
                  <p>{item[0] && item[0].datetime.getDate()}</p>
                </div>
              ))}
          </div>
          <div className="flex items-center gap-3 w-full overflow-x-scroll mt-4">
            {docSlots.length &&
              docSlots[slotIndex].map((item, index) => (
                <p
                  onClick={() => setSlotTime(item.time)}
                  className={`text-sm font-light flex-shrink-0 px-5 py-2 rounded-full cursor-pointer ${item.time === slotTime ? "bg-primary text-white" : "text-gray-400 border border-gray-300"}`}
                  key={index}
                >
                  {item.time.toLowerCase()}
                </p>
              ))}
          </div>
          <button
            onClick={bookAppointment}
            className="bg-primary text-white text-sm font-light px-14 py-3 rounded-full my-6"
          >
            Book an appointment
          </button>
        </div>
        {/*  Listing Related Doctors */}
        <RelatedDoctors docId={docId} specialty={docInfo.specialty} />
      </div>
    )
  );
};

export default Appointment;
