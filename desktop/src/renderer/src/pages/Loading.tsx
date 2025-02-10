import { auth } from "@renderer/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import logo from "../assets/StealthShareLogo.png";

const Loading = () => {
  const navigate = useNavigate();

  useEffect(() => {
    let unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate("/home");
      } else {
        navigate("/auth/login");
      }

      
    });

    return unsub;
  }, []);

  return (
    <div className="w-full transition-all min-h-screen flex justify-center items-center">
      <img className="" src={logo} alt="Logo" />
    </div>
  )
}

export default Loading;