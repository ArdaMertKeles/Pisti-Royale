import { auth, db } from "../config/firebase";
import { doc, getDoc, collection, where, query, getDocs, setDoc, deleteDoc, onSnapshot, increment, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { UserBox } from "../components/mainPage/UserBox";
import StorefrontIcon from '@mui/icons-material/Storefront';
import SettingsIcon from '@mui/icons-material/Settings';
import ViewCarouselIcon from '@mui/icons-material/ViewCarousel';
import GroupsIcon from '@mui/icons-material/Groups';
import { DeckAdjuster } from "../components/mainPage/DeckAdjuster";
import { Ranking } from "../components/mainPage/Ranking";
import { HowToPlay } from "../components/mainPage/HowToPlay";
import { Settings } from "../components/mainPage/Settings";
import { Market } from "../components/mainPage/Market";

export const MainLobby = () => {
    const navigate = useNavigate();
    const [uid, setUid] = useState(null);
    const [userData, setUserData] = useState([])
    const [deckAdjuster, setDeckAdjuster] = useState(false)
    const [ranking, setRanking] = useState(false)
    const [howToPlay, setHowToPlay] = useState(false)
    const [settings, setSettings] = useState(false)
    const [market, setMarket] = useState(false)
    const [waitingForMatch, setWaitingForMatch] = useState(false);

    const user = auth.currentUser

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user) {
                navigate("/");
            } else {
                setUid(user.uid);
            }
        });

        return () => unsubscribe();
    }, [navigate]);

    useEffect(() => {
        const fetchUserData = async () => {
            if (!uid) return;
            try {
                const userDoc = await getDoc(doc(db, "users", uid));
                if (userDoc.exists()) {
                    setUserData(userDoc.data());
                } else {
                    console.log("No such document!");
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
            }
        };

        fetchUserData();
    }, [uid]);

    const joinMatchmaking = async (user) => {
        const player1DeckRef = doc(db, "userDecks", user.uid);
        const player1DeckSnap = await getDoc(player1DeckRef);
        const player1Deck = player1DeckSnap.exists() ? player1DeckSnap.data() : {};

        if (Object.keys(player1Deck).length !== 0) {

            if (!user || !user.uid) {
                console.error("User is undefined or missing UID");
                return;
            }

            const queueRef = collection(db, "matchQueue");

            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);
            if (!userSnap.exists()) {
                console.error("User document not found in Firestore");
                return;
            }

            const userData = userSnap.data();
            const userCups = userData?.trophy || 0;

            await setDoc(doc(db, "matchQueue", user.uid), {
                uid: user.uid,
                cups: userCups
            });

            const q = query(queueRef, where("uid", "!=", user.uid));
            const querySnapshot = await getDocs(q);

            let bestMatch = null;
            let minDifference = Infinity;

            querySnapshot.forEach((doc) => {
                const opponent = doc.data();
                const diff = Math.abs(opponent.cups - userCups);
                if (diff < minDifference) {
                    minDifference = diff;
                    bestMatch = opponent;
                }
            });

            if (bestMatch) {
                const matchId = `${user.uid}_${bestMatch.uid}`;
                const matchRef = doc(db, "matches", matchId);

                const player1DeckRef = doc(db, "userDecks", user.uid);
                const player2DeckRef = doc(db, "userDecks", bestMatch.uid);
                const player1DeckSnap = await getDoc(player1DeckRef);
                const player2DeckSnap = await getDoc(player2DeckRef);

                const player1Deck = player1DeckSnap.exists() ? player1DeckSnap.data() : {};
                const player2Deck = player2DeckSnap.exists() ? player2DeckSnap.data() : {};

                const shuffleDeck = (deck) => {
                    let shuffled = [...deck];
                    for (let i = shuffled.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
                    }
                    return shuffled;
                };

                const shuffledPlayer1Deck = shuffleDeck(player1Deck.deck)
                const shuffledPlayer2Deck = shuffleDeck(player2Deck.deck)

                await setDoc(matchRef, {
                    players: {
                        [user.uid]: {
                            hand: shuffledPlayer1Deck.slice(0, 3),
                            deck: shuffledPlayer1Deck.slice(3),
                            mana: 2,
                            battlefield: null,
                            element: player1Deck.element,
                            specialCharge: 0,
                            hp: 20,
                            id: user.uid
                        },
                        [bestMatch.uid]: {
                            hand: shuffledPlayer2Deck.slice(0, 3),
                            deck: shuffledPlayer2Deck.slice(3),
                            element: player2Deck.element,
                            battlefield: null,
                            mana: 2,
                            specialCharge: 0,
                            hp: 20,
                            id: bestMatch.uid
                        }
                    },
                    player1: user.uid,
                    player2: bestMatch.uid,
                    turnNumber: 1,
                    baseMana: 2,
                    currentTurnPlayer: user.uid,
                    battlefield: {
                        [user.uid]: [],
                        [bestMatch.uid]: []
                    },
                    status: "ongoing",
                    createdAt: new Date(),
                });

                await deleteDoc(doc(queueRef, bestMatch.uid));
                await deleteDoc(doc(queueRef, user.uid));

                navigate(`/match/${matchId}`);
            } else {
                setWaitingForMatch(true);
            }
        } else {
            setDeckAdjuster(true)
        }
    };

    const useMatchListener = (user, setWaitingForMatch) => {
        const navigate = useNavigate();

        useEffect(() => {
            if (!user || !user.uid) return;

            const matchesRef = collection(db, "matches");


            const q = query(matchesRef, where("player1", "==", user.uid), where("status", "==", "ongoing"));
            const q2 = query(matchesRef, where("player2", "==", user.uid), where("status", "==", "ongoing"));

            const unsubscribe1 = onSnapshot(q, (snapshot) => {
                snapshot.forEach((doc) => {
                    navigate(`/match/${doc.id}`);
                    setWaitingForMatch(false);
                });
            });

            const unsubscribe2 = onSnapshot(q2, (snapshot) => {
                snapshot.forEach((doc) => {
                    navigate(`/match/${doc.id}`);
                    setWaitingForMatch(false);
                });
            });

            return () => {
                unsubscribe1();
                unsubscribe2();
            };
        }, [user, navigate, setWaitingForMatch]);
    };

    const stopSearching = async () => {
        const queueRef = collection(db, "matchQueue");
        await deleteDoc(doc(queueRef, user.uid));
        setWaitingForMatch(false)
    }

    useMatchListener(user, setWaitingForMatch);

    // Xp Adjuster
    useEffect(() => {
    const xpAdjuster = async () => {
        const userRef = doc(db, "users", uid);
        let i = userData.xp
        while (i > 100) {
            i -= 100
            await updateDoc(userRef, {
                level: increment(1),
                xp: increment(-100),
            });
        }
    }
        if(userData.xp > 100){
            xpAdjuster()
        }
    }, [userData, uid])

    return (
        <div className="mainLobbyWrapper">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <div className="topSide">
                <UserBox photoUrl={userData.photoURL} username={userData.username} level={userData.level} trophy={userData.trophy} coins={userData.coins} xp={userData.xp} />
                <div className="table center">
                    <div className="monitor-wrapper center">
                        <div className="monitor center">
                            <h1>Pisti Royale</h1>
                        </div>
                    </div>
                </div>
                <div className="buttons">
                    <button className="deckBtn" onClick={() => setDeckAdjuster(true)}><ViewCarouselIcon /></button>
                    <button className="shopBtn" onClick={() => setMarket(true)}><StorefrontIcon /></button>
                    <button className="settingsBtn" onClick={() => setSettings(true)}><SettingsIcon /></button>
                </div>
            </div>
            <div className="playBtns">
                {waitingForMatch ? (
                    <div className="lookingMatchContainer">
                        <div className="container">
                            <p>Looking for a match...</p>
                            <div className="battleSearchLoader"></div>
                        </div>
                        <button className="cancelBtn" onClick={stopSearching}>Cancel</button>
                    </div>
                ) : (
                    <button className="battleBtn" onClick={() => joinMatchmaking(user, setWaitingForMatch)}>Play</button>
                )}
                <button className="secondaryBattleBtn" onClick={() => setHowToPlay(true)}>Learn how to play</button>
            </div>
            <button className="rankingBtn" onClick={() => setRanking(true)}><GroupsIcon /></button>
            {deckAdjuster && <DeckAdjuster setDeckAdjuster={setDeckAdjuster} />}
            {ranking && <Ranking setRanking={setRanking} />}
            {howToPlay && <HowToPlay setHowToPlay={setHowToPlay} />}
            {settings && <Settings setSettings={setSettings} />}
            {market && <Market setMarket={setMarket} />}
        </div>
    );
};
