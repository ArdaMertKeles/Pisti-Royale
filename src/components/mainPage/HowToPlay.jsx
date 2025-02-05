import CloseIcon from '@mui/icons-material/Close';

export const HowToPlay = ({ setHowToPlay }) => {

    return (
        <div className="howToPlayContainer">
            <CloseIcon className="closeBtn" onClick={() => setHowToPlay(false)} />
            <h3>How To Play</h3>
            <p>
                In this fantasy card game, each player starts by selecting a deck of 9 cards. Every card has its own mana cost, attack damage, HP, and element.
                <h4>Elemental Advantage System</h4>
                Some elements counter others, granting bonus effects when attacking:

                <hr />
                Fire → Nature
                <hr />
                Nature → Metal
                <hr />
                Metal → Lightning
                <hr />
                Lightning → Ice
                <hr />
                Ice → Fire
                <hr />
                Death → Sun
                <hr />
                Sun → Death
                <hr />
                <h4>Turn Mechanics</h4>
                Players start with 2 mana per turn.
                Every 4 turns, the base mana gain increases by +1.
                At the beginning of each turn, players draw 1 random card from their deck.
                Players can play cards if they have enough mana.
                <h4>Combat System</h4>
                Cards attack the opposing card in front of them.
                If no enemy card is in front, the attack directly hits the opponent.
                Players start with 20 HP, and the first to reach 0 HP loses.
                Strategically play your cards, use elemental advantages, and manage your mana wisely to win the game! ⚔️🔥</p>
        </div>
    )
}