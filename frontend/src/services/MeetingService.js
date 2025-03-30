import axios from "axios";

const API_URL = "http://localhost:5000/api/meetings"; // Update if deployed

const MeetingService = {
  getAllMeetings: async () => {
    try {
      const response = await axios.get(`${API_URL}/all`);
      return response.data;
    } catch (error) {
      console.error("Error fetching meetings:", error);
      return [];
    }
  },
};

export default MeetingService;
