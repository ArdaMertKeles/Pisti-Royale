import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

export const RankingPlayerBox = ({playerImg, playerName, playerTrophy, playerElement, playerLevel}) => {

    return (
        <div className="rankingPlayerBox">
            <div className="playerDetails">
                <img src={playerImg} alt="" />
                <div className="info">
                    <p>{playerName}</p>
                    <p className='trophy'>{playerTrophy} <EmojiEventsIcon /></p>
                </div>
            </div>
            <p>{playerLevel} Level</p>
        </div>
    )
}