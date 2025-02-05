import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { db } from "../config/firebase";
import { onSnapshot, doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { auth } from "../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import cardBackground from '../assets/img/cardBackground.png'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PaidIcon from '@mui/icons-material/Paid';

export const Match = () => {

    const navigate = useNavigate()
    const { matchId } = useParams();
    const [matchData, setMatchData] = useState(null);
    const [uid, setUid] = useState()
    const [isMyTurn, setIsMyTurn] = useState(false);
    const [selectedCard, setSelectedCard] = useState(null);
    const [cardClass, setCardClass] = useState('card')
    const [manaError, setManaError] = useState('')

    // Victory-Defat
    const [gameEnd, setGameEnd] = useState(false)
    const [trophyAmount, setTrophyAmount] = useState()
    const [coinAmount, setCoinAmount] = useState()
    const [xpAmount, setXpAmount] = useState()
    const [result, setResult] = useState()

    // Player Names
    const [playerName, setPlayerName] = useState()
    const [opponentName, setOpponentName] = useState()
    // Player Datas
    const [playerData, setPlayerData] = useState()
    const [opponentData, setOpponentData] = useState()


    useEffect(() => {
        const matchRef = doc(db, "matches", matchId);
        const unsubscribe = onSnapshot(matchRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setMatchData(data);
                setIsMyTurn(data.currentTurnPlayer === uid);
            }
        });

        return () => unsubscribe();
    }, [matchId, uid]);

    // Uid Checker
    useEffect(() => {
        const checkUid = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUid(user.uid);
            }
        });

        return () => checkUid();
    }, []);

    useEffect(() => {
        const playerSetting = async () => {
            if (matchData && uid) {
                if (matchData.player1 === uid) {
                    const player1Ref = doc(db, 'users', uid)
                    const player1Snap = await getDoc(player1Ref)
                    if (player1Snap.exists()) {
                        setPlayerName(player1Snap.data().username)
                        const player2Ref = doc(db, 'users', matchData.player2)
                        const player2Snap = await getDoc(player2Ref)
                        if (player2Snap.exists()) {
                            setOpponentName(player2Snap.data().username)
                        }
                    }
                }
                if (matchData.player2 === uid) {
                    const player1Ref = doc(db, 'users', uid)
                    const player1Snap = await getDoc(player1Ref)
                    if (player1Snap.exists()) {
                        setPlayerName(player1Snap.data().username)
                        const player2Ref = doc(db, 'users', matchData.player1)
                        const player2Snap = await getDoc(player2Ref)
                        if (player2Snap.exists()) {
                            setOpponentName(player2Snap.data().username)
                        }
                    }
                }
            }
        }
        playerSetting()
    }, [matchData, uid])

    useEffect(() => {
        if (!matchId) return;

        const matchRef = doc(db, "matches", matchId);

        const unsubscribe = onSnapshot(matchRef, (docSnap) => {
            if (docSnap.exists()) {
                const matchData = docSnap.data();
                setPlayerData(matchData.players[uid]);

                const opponent = Object.keys(matchData.players).find((id) => id !== uid);
                setOpponentData(matchData.players[opponent]);
            }
        });

        return () => unsubscribe();
    }, [matchId, uid]);

    // Battle Function

    const battle = async (matchId) => {
        const matchRef = doc(db, "matches", matchId);
        const matchSnap = await getDoc(matchRef);

        if (!matchSnap.exists()) return;

        const matchData = matchSnap.data();
        const [player1, player2] = Object.keys(matchData.players);
        let updatedPlayers = { ...matchData.players };

        let player1Battlefield = matchData.players[player1].battlefield || [];
        let player2Battlefield = matchData.players[player2].battlefield || [];

        let baseMana = matchData.baseMana;
        let { turnNumber } = matchData;

        if (turnNumber % 4 === 0) {
            baseMana += 1;
            await updateDoc(matchRef, { baseMana });
        }

        let player1PrevMana = matchData.players[player1].mana;
        let player2PrevMana = matchData.players[player2].mana;

        const calculateNewMana = (prevMana) => Math.min(10, prevMana + baseMana);

        updatedPlayers[player1].mana = calculateNewMana(player1PrevMana)
        updatedPlayers[player2].mana = calculateNewMana(player2PrevMana)

        await updateDoc(matchRef, { players: updatedPlayers });


        if (player1Battlefield.length === 0 && player2Battlefield.length === 0) {
            return;
        }

        const elementAdvantage = {
            fire: "nature",
            nature: "metal",
            metal: "lightning",
            lightning: "ice",
            ice: "fire",
            death: "sun",
            sun: "death"
        };

        const applyDamage = (attacker, defender) => {
            const extraDamage = elementAdvantage[attacker.element] === defender.element ? 1 : 0;
            return Math.max(0, defender.hp - (parseInt(attacker.attackDamage) + extraDamage));
        };


        if (player1Battlefield.length === 0) {
            let totalDamage = player2Battlefield.reduce((sum, card) => sum + parseInt(card.attackDamage), 0);
            updatedPlayers[player1].hp = Math.max(0, matchData.players[player1].hp - totalDamage);
        } else if (player2Battlefield.length === 0) {
            let totalDamage = player1Battlefield.reduce((sum, card) => sum + parseInt(card.attackDamage), 0);
            updatedPlayers[player2].hp = Math.max(0, matchData.players[player2].hp - totalDamage);
        } else {
            const minLength = Math.min(player1Battlefield.length, player2Battlefield.length);
            for (let i = 0; i < minLength; i++) {
                let card1 = player1Battlefield[i];
                let card2 = player2Battlefield[i];

                if (card1 && card2) {
                    card1.hp = applyDamage(card2, card1);
                    card2.hp = applyDamage(card1, card2);
                }
            }
        }

        const processBattlefield = (playerId) => {
            let battlefield = updatedPlayers[playerId].battlefield || [];
            let deck = updatedPlayers[playerId].deck || [];

            let survivingCards = battlefield.filter(card => card.hp > 0);
            let deadCards = battlefield
                .filter(card => card.hp <= 0)
                .map(card => ({
                    ...card,
                    hp: card.maxHealth
                }));

            updatedPlayers[playerId].battlefield = survivingCards;
            updatedPlayers[playerId].deck = [...deck, ...deadCards];
        };

        processBattlefield(player1);
        processBattlefield(player2);
        setCardClass('attackCard');
        setTimeout(() => {
            setCardClass('card');
        }, 750);

        setTimeout(async () => {
            await updateDoc(matchRef, { players: updatedPlayers });
        }, 800);
    };

    const nextTurn = async (matchId) => {
        const matchRef = doc(db, "matches", matchId);
        const matchSnap = await getDoc(matchRef);

        if (!matchSnap.exists()) return;

        const matchData = matchSnap.data();
        let { turnNumber } = matchData;
        const [player1, player2] = Object.keys(matchData.players);
        const nextPlayer = matchData.currentTurnPlayer === player1 ? player2 : player1;

        const currentPlayerDeck = matchData.players[nextPlayer].deck || [];
        const currentPlayerHand = matchData.players[nextPlayer].hand || [];

        if (currentPlayerDeck.length > 0 && currentPlayerHand.length < 5) {
            const newCard = currentPlayerDeck[0];
            currentPlayerHand.push(newCard);
            matchData.players[nextPlayer].deck = currentPlayerDeck.slice(1);
            matchData.players[nextPlayer].hand = currentPlayerHand;
        }

        await updateDoc(matchRef, {
            [`players.${nextPlayer}.hand`]: matchData.players[nextPlayer].hand,
            [`players.${nextPlayer}.deck`]: matchData.players[nextPlayer].deck,
            turnNumber: matchData.turnNumber + 1,
            currentTurnPlayer: nextPlayer,
        });

        if ((turnNumber + 1) % 2 === 0) {
            await battle(matchId);
        }

    };

    const playCard = async () => {
        if (selectedCard === null) return;

        const matchRef = doc(db, "matches", matchId);
        const matchSnap = await getDoc(matchRef);

        if (!matchSnap.exists()) return;

        const matchData = matchSnap.data();
        const currentPlayerData = matchData.players[uid];

        const cardToPlay = currentPlayerData.hand[selectedCard];

        if (currentPlayerData.mana < cardToPlay.cost) {
            setManaError("Not enough mana!");
            setTimeout(() => {
                setManaError("")
            }, 1500);
            return;
        }

        const updatedHand = currentPlayerData.hand.filter((_, index) => index !== selectedCard);
        const updatedBattlefield = [...(matchData.players[uid].battlefield || []), cardToPlay];

        const updatedMana = currentPlayerData.mana - cardToPlay.cost;

        await updateDoc(matchRef, {
            [`players.${uid}.hand`]: updatedHand,
            [`players.${uid}.battlefield`]: updatedBattlefield,
            [`players.${uid}.mana`]: updatedMana
        });

        setSelectedCard(null);
    };

    // Game Over
    useEffect(() => {
        const updateUserTrophies = async (userId, trophyAmount, xpAmount, coinAmount) => {
            const userRef = doc(db, "users", userId);
            try {
                const userSnap = await getDoc(userRef);
                if (!userSnap.exists()) {
                    return;
                }
                const currentTrophy = userSnap.data().trophy || 0;
                const newTrophy = Math.max(currentTrophy + trophyAmount, 0);

                await updateDoc(userRef, { 
                    trophy: newTrophy,
                    xp: increment(xpAmount),
                    coins: increment(coinAmount)
                 });
            } catch (error) {
                console.error("Error updating trophy:", error);
            }
        };
        if (opponentData && playerData) {
            if (opponentData.hp <= 0) {
                setGameEnd(true)
                setResult('Victory')
                let newCoin = Math.floor(Math.random() * (500 - 100))
                let newTrophy = Math.floor(Math.random() * (45 - 30))
                let newXp = Math.floor(Math.random() * (80 - 60))
                setCoinAmount(newCoin)
                setTrophyAmount(newTrophy)
                setXpAmount(newXp)
                updateUserTrophies(playerData.id, newTrophy, newXp, newCoin)
            }
            if (playerData.hp <= 0) {
                setGameEnd(true)
                setResult('Defeat')
                let newCoin = Math.floor(Math.random() * (200 - 30))
                let newTrophy = Math.floor(Math.random() * (-20 - -30))
                let newXp = Math.floor(Math.random() * (50 - 30))
                setCoinAmount(newCoin)
                setTrophyAmount(newTrophy)
                setXpAmount(newXp)
                updateUserTrophies(playerData.id, newTrophy, newXp, newCoin)
            }
        }
    }, [opponentData, playerData])

    const gameEndBtn = async () => {
        const matchRef = doc(db, "matches", matchId);
        await updateDoc(matchRef, { status: 'over', winner: playerName });
        navigate('/main-lobby')
    }


    return (
        <div className="matchWrapper">
            {playerData && opponentData && <div className="leftSide">
                <div className="opponentSide">
                    <div className="opponentName">
                        <p>{opponentName}</p>
                    </div>
                    <div className="healthBar">
                        <p>{opponentData.hp}</p>
                        <div className="health" style={{ height: `${opponentData.hp * 5}%` }} ></div>
                    </div>
                </div>
                <div className="playerSide">
                    <div className="healthBar">
                        <p>{playerData.hp}</p>
                        <div className="health" style={{ height: `${playerData.hp * 5}%` }}></div>
                    </div>
                    <div className="playerName">
                        <p>{playerName}</p>
                    </div>
                </div>
            </div>}
            {playerData && opponentData && <div className="centerSide">
                <div className="opponentDeck">
                    {opponentData?.hand.map((card, index) => (
                        <img draggable='false' key={index} src={cardBackground} alt="Opponent Card" className="opponentCard" />
                    ))}
                </div>
                <div className="battlefield">
                    <div className="opponentSide">
                        {opponentData.battlefield?.map((card, index) => (
                            <div className={cardClass}>
                                <img
                                    key={index}
                                    draggable='false'
                                    src={card.cardImage}
                                    alt={card.name}
                                    className="opponentCard"
                                />
                                <div className="hp">{card.hp}</div>
                            </div>
                        ))}
                    </div>
                    <div className="playerSide">
                        {playerData.battlefield?.map((card, index) => (
                            <div className={cardClass}>
                                <img
                                    key={index}
                                    draggable='false'
                                    src={card.cardImage}
                                    alt={card.name}
                                    className="playerCard"
                                />
                                <div className="hp">{card.hp}</div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="playerDeck">
                    {playerData?.hand.map((card, index) => (
                        <img
                            draggable="false"
                            key={index}
                            src={card.cardImage}
                            alt="Player Card"
                            className={`playerCard ${selectedCard === index ? "selected" : ""}`}
                            onClick={() => setSelectedCard(index)}
                        />
                    ))}
                </div>
            </div>}
            {playerData && opponentData && <div className="rightSide">
                <div className="top">
                    <p className="turn">Turn: {matchData.turnNumber}</p>
                    <div className="manaShown">
                        <p>{opponentData.mana}</p>
                        <div className="mana" style={{ width: `${opponentData.mana * 10}%` }}></div>
                    </div>
                </div>
                <div className="center">
                    <button
                        className="turnBtn"
                        onClick={() => nextTurn(matchId, uid)}
                        disabled={!isMyTurn}
                        style={{
                            cursor: isMyTurn ? "pointer" : "not-allowed",
                        }}
                    >
                        Turn
                    </button>
                    <button className="playCardBtn" onClick={() => playCard()} disabled={!isMyTurn}>
                        Play Card
                    </button>
                </div>
                <div className="bottom">
                    <div className="manaShown">
                        <p>{playerData.mana}</p>
                        <div className="mana" style={{ width: `${playerData.mana * 10}%` }}></div>
                    </div>
                    <p className="manaError">{manaError}</p>
                </div>
            </div>}
            {gameEnd && <div className="matchResult">
                <p>{result}</p>
                <div>
                    <p className="trophy">{trophyAmount}+ <EmojiEventsIcon /></p>
                    <p className="coin">{coinAmount}+ <PaidIcon /></p>
                    <p className="xp">{xpAmount}+ XP</p>
                </div>
                <button onClick={gameEndBtn}>Main Menu</button>
            </div>}
        </div>
    )
}