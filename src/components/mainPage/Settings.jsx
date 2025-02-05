import CloseIcon from '@mui/icons-material/Close';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { useNavigate } from 'react-router-dom';

export const Settings = ({ setSettings }) => {

    const navigate = useNavigate()

    const logOut = async () => {
        try {
            await signOut(auth);
            navigate("/")
        } catch (error) {
            console.log(error)
        }
    }

    return (
        <div className="settingsContainer">
            <CloseIcon className="closeBtn" onClick={() => setSettings(false)} />
            <h3>Settings</h3>
            <button onClick={logOut}>Log Out</button>
        </div>
    )
}