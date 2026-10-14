import axios from "axios";
import { useNavigate } from "react-router-dom";
import { getApiUrl } from "../services/api";
const handleSignUp = async (e) => {
  e.preventDefault();

  if (!email) {
    setErrEmail(t("signin.error_email"));
    return;
  }

  if (!password) {
    setErrPassword(t("signin.error_password"));
    return;
  }

  const bcrypt = require("bcrypt");

  (async () => {
  const hashedPassword = await bcrypt.hash(password, 10);
  console.log("Hashed Password:", hashedPassword);
  })();
  try {

    const response = await axios.post(getApiUrl("/api/signin"), {
      email,
      password,
    });

    const { token , id , user } = response.data;
    // Store token in localStorage or cookies for persistence
    localStorage.setItem("authToken", token);
    localStorage.setItem("userId", user.id);
    console.log("userid:", id);
    console.log("user id :", user.id);
    //setSuccessMsg(t("signin.success_msg", { id }));
    setSuccessMsg( user.id);
    navigate("/dashboard");
    setEmail("");
    setPassword("");
  } catch (error) {
    if (error.response?.status === 401) {
      setErrPassword(t("signin.invalid_credentials") + hashedPassword);
    } else {
      console.error(error);
      setErrPassword(t("signin.server_error"));
    }
  }
};
