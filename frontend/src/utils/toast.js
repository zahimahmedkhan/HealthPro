import { Bounce, toast } from "react-toastify";


const defaultOptions = {
  position: "top-right",
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: false,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  theme: "light",
  transition: Bounce,
};

export const showSuccess = (message) => {
  toast.success(message, defaultOptions);
};

export const showError = (message) => {
  toast.error(message, defaultOptions);
};

export const showInfo = (message) => {
  toast.info(message, defaultOptions);
};

export const showWarning = (message) => {
  toast.warn(message, defaultOptions);
};