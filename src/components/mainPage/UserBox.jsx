import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PaidIcon from '@mui/icons-material/Paid';

export const UserBox = ({photoUrl, username, level, trophy, coins, xp}) =>{

    return(
        <div className='userBoxContainer'>
            <img src={photoUrl} alt="" />
            <div className="infoArea">
                <p className="username">{username}</p>
                <div className="levelSide">
                    <div className="xpBar">
                        <div className="xp" style={{width: `${xp}%`}} ></div>
                    </div>
                    <p className="level">{level} level</p>
                </div>
                <div className="container">
                    <p className="trophy">{trophy} <EmojiEventsIcon /></p>
                    <p className="coins">{coins} <PaidIcon /></p>
                </div>
            </div>
        </div>
    )
}