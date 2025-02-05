import PersonIcon from '@mui/icons-material/Person';
import { auth, db } from '../config/firebase';
import { updateProfile, onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { setDoc, doc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

export const SetUserInfoPage = () => {
    const [username, setUsername] = useState('');
    const [profilePicture, setProfilePicture] = useState('https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png');
    const [blank, setBlank] = useState(false);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                if (currentUser.displayName && currentUser.photoURL) {
                    navigate("/main-lobby");
                }
            } else {
                navigate("/");
            }
        });

        return () => unsubscribe();
    }, [navigate]);

    const updateProfileDone = async () => {
        if (!user) return; //

        if (username !== '' && profilePicture) {
            try {
                await updateProfile(user, {
                    displayName: username,
                    photoURL: profilePicture
                });

                await setDoc(doc(db, "users", user.uid), {
                    username: username,
                    photoURL: profilePicture,
                    trophy: 0,
                    level: 1,
                    xp: 0,
                    coins: 0
                });

                navigate("/main-lobby");
            } catch (err) {
                console.error(err);
            }
        } else {
            setBlank(true);
            setTimeout(() => {
                setBlank(false);
            }, 650);
        }
    };

    function handleChange(e) {
        setProfilePicture(URL.createObjectURL(e.target.files[0]));
    }

    return (
        <div className="setUserInfoWrapper">
            <div className="container">
                <h3>Welcome To the Pisti Royale</h3>
                <div className="infoArea">
                    <div className='imgArea'>
                        <label htmlFor="profilePicture">
                            <img draggable='false' src={profilePicture} alt="" />
                        </label>
                        <p className='imgInfo'>Set your profile picture</p>
                    </div>
                    <input type="file" id='profilePicture' onChange={handleChange} />
                    <div className='username'>
                        <div className={!blank ? 'inputDiv' : 'blank'}>
                            <label htmlFor="username">
                                <PersonIcon />
                            </label>
                            <input type="text" id='username' placeholder='Set your username' onChange={(e) => setUsername(e.target.value)} />
                        </div>
                        <p>Those informations will determine how you are seen by other users!</p>
                    </div>
                </div>
                <button onClick={updateProfileDone}>Done</button>
            </div>
        </div>
    );
};
