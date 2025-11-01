import React, { useContext } from "react";
import { motion } from "framer-motion";
import { AuthContext } from "../context/AuthContext.jsx";
import { FaBook, FaUsers, FaHome, FaChartLine } from "react-icons/fa";

const Home = () => {
  const { user } = useContext(AuthContext);

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.3, duration: 0.7, ease: "easeOut" },
    }),
  };

  return (
    <div className="h-[calc(100vh-6rem)] w-full bg-[#f8f8f8] flex flex-col items-center justify-center overflow-hidden">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-5xl md:text-6xl font-extrabold text-[#001740] mb-3 text-center"
      >
        Welcome {user?.firstName} 👋
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.8 }}
        className="text-lg md:text-xl text-gray-600 max-w-2xl text-center mb-6"
      >
        Your personalized hostel management experience starts here. Explore tools,
        insights, and resources crafted to make your stay efficient, organized, and enjoyable.
      </motion.p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl w-full px-6">
        {[
          {
            icon: <FaHome className="text-4xl text-[#FFB600]" />,
            title: "Smart Hostel System",
            text: "An intelligent platform designed to manage rooms, fees, and attendance seamlessly.",
          },
          {
            icon: <FaUsers className="text-4xl text-[#001740]" />,
            title: "Warden & Student Tools",
            text: "Empowering wardens with control and students with transparency.",
          },
          {
            icon: <FaBook className="text-4xl text-[#FFB600]" />,
            title: "Academic Balance",
            text: "Stay focused on your goals with integrated reminders and student support systems.",
          },
          {
            icon: <FaChartLine className="text-4xl text-[#001740]" />,
            title: "Real-time Insights",
            text: "Access up-to-date data on hostel occupancy and attendance anytime.",
          },
        ].map((item, i) => (
          <motion.div
            key={i}
            custom={i}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            whileHover={{ scale: 1.05 }}
            className="p-4 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all border-t-4 border-[#FFB600] flex flex-col items-center text-center"
          >
            <div className="mb-2">{item.icon}</div>
            <h3 className="text-lg font-bold text-[#001740] mb-1">{item.title}</h3>
            <p className="text-gray-600 text-sm">{item.text}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        className="text-center max-w-2xl mt-6"
      >
        <h2 className="text-2xl md:text-3xl font-semibold text-[#001740] mb-2">
          Built for Simplicity, Designed for Growth 🌱
        </h2>
        <p className="text-gray-600 text-base leading-relaxed">
          HostIQ is more than a hostel management tool — it’s a complete ecosystem
          connecting administrators, wardens, and students in one cohesive,
          data-driven environment.
        </p>
      </motion.div>
    </div>
  );
};

export default Home;
