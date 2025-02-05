import { useEffect, useState } from "react";
import { getDocs, collection } from "firebase/firestore";
import { db } from "../../config/firebase";
import CloseIcon from '@mui/icons-material/Close';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { RankingPlayerBox } from "./RankingPlayerBox";

export const Ranking = ({ setRanking }) => {

    const [data, setData] = useState([])
    const [playerList, setPlayerList] = useState([])
    const [topThree, setTopThree] = useState()
    const [loading, setLoading] = useState(true)

    const fetchCardData = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "users"));
            if (!querySnapshot.empty) {
                const users = querySnapshot.docs.map((doc) => doc.data());
                setData(users)
                setLoading(false)
            } else {
                console.log("No documents found in the 'users' collection.");
            }
        } catch (error) {
            console.error("Error fetching users data:", error);
        }
    };
    useEffect(() => {
        fetchCardData();
    }, [])

    
    useEffect(() => {
        const sortRanking = () => {
            const sortedUsers = data.sort((a, b) => b.trophy - a.trophy);
            setPlayerList(sortedUsers)
            setTopThree(sortedUsers.slice(0, 3))
        }
        sortRanking()
    }, [data])

    return (
        <div className="rankingContainer">
            {loading && <div className="rankingLoader"></div>}
            <CloseIcon className="closeBtn" onClick={() => setRanking(false)} />
            <h3>Ranking</h3>
            <div className="ranking">
                <div className="rankList">
                    {playerList && playerList.map((player, key) => (
                        <RankingPlayerBox key={key} playerImg={player.photoURL} playerName={player.username} playerTrophy={player.trophy} playerLevel={player.level} />
                    ))}
                </div>
                <div className="topRanks">
                    {topThree && topThree.map((player, key) => (
                        <div key={key}>
                            <MilitaryTechIcon className="medal" />
                            <img src={player.photoURL} alt="" />
                            <div className="info">
                                <p className="username">{player.username}</p>
                                <p className="trophy">{player.trophy} <EmojiEventsIcon /></p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}