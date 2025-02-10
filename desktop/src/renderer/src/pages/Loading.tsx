import { auth } from "@renderer/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect } from "react";
import { useNavigate } from "react-router";

const Loading = () => {
  const navigate = useNavigate();

  useEffect(() => {
    let unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate("/home")
      } else {
        navigate("/auth/login")
      }
    })
    return unsub;
  }, []);

  return (
    <div className="w-full min-h-screen flex justify-center items-center">
      <h1>Loading...</h1>
    </div>
  )
}

export default Loading;