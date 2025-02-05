import { useEffect, useState } from "react";
import { getDocs, getDoc, collection, setDoc, doc } from "firebase/firestore";
import { auth, db } from "../../config/firebase";
import CloseIcon from '@mui/icons-material/Close';

export const DeckAdjuster = ({ setDeckAdjuster }) => {

    const [cardData, setCardData] = useState([])
    const [deck, setDeck] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)
    const [secError, setSecError] = useState(false)
    const [element, setElement] = useState()
    const user = auth.currentUser

    useEffect(() => {
        const fetchCardData = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "cards"));
                if (!querySnapshot.empty) {
                    const cards = querySnapshot.docs.map((doc) => doc.data());
                    setCardData(cards);
                    setLoading(false)
                } else {
                    console.log("No documents found in the 'cards' collection.");
                }
            } catch (error) {
                console.error("Error fetching cards data:", error);
            }
        };
        fetchCardData();

        const fetchDeckData = async () => {
            const docRef = doc(db, "userDecks", user.uid)
            const docSnap = await getDoc(docRef)

            if (docSnap.exists()) {
                setDeck(docSnap.data().deck);
                setElement(docSnap.data().element)
              } else {
                console.log("No such document!");
              }
        }
        fetchDeckData()
        
    }, [user.uid]);

    const addToDeck = (card) => {
        if (deck.some((c) => c.cardName === card.cardName)) {
            if(!secError){
                setSecError(true)
                setTimeout(() => {
                    setSecError(false)
                }, 2500);
            }
            return;
        }

        if (deck.length < 9) {
            setDeck((prev) => [...prev, card]);
        }        
    };

    useEffect(() => {
        if(deck.length !== 0){
            const elementCount = {};
            deck.forEach(card => {
                elementCount[card.element] = (elementCount[card.element] || 0) + 1;
            });
            const mostCommonElement = Object.keys(elementCount).reduce((a, b) =>
                elementCount[a] > elementCount[b] ? a : b
        );
        setElement(mostCommonElement)
    }
    }, [deck])

    const adjustDeck = async () => {
        if (deck.length === 9) {
            await setDoc(doc(db, "userDecks", user.uid), {
                deck: deck,
                element: element
            });
        } else {
            if (!error) {
                setError(true)
                setTimeout(() => {
                    setError(false)
                }, 2500);
            }
        }
    }

    return (
        <div className="deckAdjusterContainer">
            <CloseIcon className="closeBtn" onClick={() => setDeckAdjuster(false)} />
            <div className="mapCards">
                {loading && <div className="loader"></div>}
                {cardData && cardData.map((card, key) => (
                    <img src={card.cardImage} onClick={() => addToDeck(card)} key={key} alt="card" draggable='false' />
                ))}
            </div>
            <div className="deckContainer">
                <div className="deck">
                    <div>{deck[0] && <img draggable='false' src={deck[0].cardImage} alt="card" />}</div>
                    <div>{deck[1] && <img draggable='false' src={deck[1].cardImage} alt="card" />}</div>
                    <div>{deck[2] && <img draggable='false' src={deck[2].cardImage} alt="card" />}</div>
                    <div>{deck[3] && <img draggable='false' src={deck[3].cardImage} alt="card" />}</div>
                    <div>{deck[4] && <img draggable='false' src={deck[4].cardImage} alt="card" />}</div>
                    <div>{deck[5] && <img draggable='false' src={deck[5].cardImage} alt="card" />}</div>
                    <div>{deck[6] && <img draggable='false' src={deck[6].cardImage} alt="card" />}</div>
                    <div>{deck[7] && <img draggable='false' src={deck[7].cardImage} alt="card" />}</div>
                    <div>{deck[8] && <img draggable='false' src={deck[8].cardImage} alt="card" />}</div>
                </div>
                <p>Dominant element {element}</p>
                <button className="clearBtn" onClick={() => setDeck([])} >Clear</button>
                <button className="adjustBtn" onClick={adjustDeck}>Adjust</button>
                {error && <p className="error">You must fill in all the card spaces.</p>}
                {secError && <p className="error">You can not select the same card twice.</p>}
            </div>
        </div>
    )
}