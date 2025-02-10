import Dialog from "@renderer/components/layout/Dialog";
import Sidebar from "@renderer/components/layout/Sidebar";
import Workspace from "@renderer/components/layout/Workspace";

const Home = () => {
  return (
    <div className="min-h-screen w-full flex flex-row [&>div]:px-5 [&>div]:py-6">
      <Sidebar />
      <Workspace />
      <Dialog/>
    </div>
  )
}

export default Home;