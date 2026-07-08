import { createContext } from "react";

export const AppContext = createContext();

const AppContextProvider = (props) => {
  const currency = "$";
  const calculateAge = (dob) => {
    const today = new Date();
    const birthday = new Date(dob);
    let age = today.getFullYear() - birthday.getFullYear();
    return age;
  };

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

  const slotDateFormat = (slotDate) => {
    const [day, month, year] = slotDate.split("-");
    const formattedDate = `${day} ${months[parseInt(month) - 1]} ${year}`;
    return formattedDate;
  };

  const value = {
    calculateAge,
    slotDateFormat,
    currency,
  };

  return (
    <AppContext.Provider value={value}>{props.children}</AppContext.Provider>
  );
};

export default AppContextProvider;
