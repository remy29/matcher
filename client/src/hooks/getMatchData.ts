import axios from "axios";
import { useState } from "react";
import usePartnerData from "./partnerData";

export default function useMatchData() {
  const { userList } = usePartnerData();

  const [matchData, setMatchData] = useState([]);

  const getUserByEmail = (email: string) => { //returns user object
    let user;
    userList.map((element: any) => {
      if (element.email === email) {
        user = element;
      }
    });
    return user;
  };

  const getMatchData = (email: string, partner: number) => {
    let user = getUserByEmail(email) || { id: 0 };
    axios.get(`/matches/:${user.id}/:${partner}`).then((data) => {
      setMatchData(data.data);
    });
  };

  const postMatchData = ( //sends new match to database
    email: string,
    partner: number,
    restaurant: string
  ) => {
    let user = getUserByEmail(email) || { id: 0 };
    axios
      .post("/matches", {
        user_id: user.id,
        partner_id: partner,
        restaurant: restaurant,
      })
      .then(() => {
        console.log("Match added to database");
      })
      .catch((err) => console.error(err));
  };

  return {
    matchData,
    setMatchData,
    getMatchData,
    postMatchData,
    getUserByEmail,
  };
}
